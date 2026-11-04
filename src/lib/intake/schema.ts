// Shared by the /api/demo/process route (source of truth) and the client demo
// (limits and early feedback). Keep this file free of runtime dependencies so
// it can be unit-tested with plain Node.

import { getIndustry, type IndustryConfig } from "./industries.ts";

export const intakeLimits = {
  message: 3000,
  messageMin: 20,
  /** Largest request body the route will read, in bytes (allows for JSON escaping). */
  requestBytes: 16_384,
} as const;

export const senderLimits = { name: 80, email: 254, subject: 150 } as const;

/** What the visitor submits. Only `body` is required; the rest is optional sender metadata. */
export type InquiryInput = { name?: string | null; email?: string | null; subject?: string | null; body: string };

/** `message` is the full text the model reads and every grounding check runs against. */
export type IntakeRequest = { industry: IndustryConfig; message: string };
export type IntakeValidation = { ok: true; data: IntakeRequest } | { ok: false; message: string };

function clean(value: unknown, multiline = false): string {
  if (typeof value !== "string") return "";
  let v = value.normalize("NFC").replace(/\r\n?/g, "\n");
  v = multiline ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") : v.replace(/[\u0000-\u001F\u007F]/g, " ");
  if (!multiline) v = v.replace(/\s+/g, " ");
  return v.trim();
}

const EMAIL_FORMAT = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/;

/**
 * Builds the email-style text that is processed, so the sender's name and
 * address are grounded exactly like anything else the customer wrote.
 * Used by the server and by the browser (to show the same text).
 */
export function composeInquiry({ name, email, subject, body }: InquiryInput): string {
  const n = clean(name);
  const e = clean(email);
  const s = clean(subject);
  const from = n && e ? `${n} <${e}>` : n || e;
  const headers = [from ? `From: ${from}` : "", s ? `Subject: ${s}` : ""].filter(Boolean).join("\n");
  const text = clean(body, true);
  return headers ? `${headers}\n\n${text}` : text;
}

export function validateIntakeRequest(input: unknown): IntakeValidation {
  const r = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const industry = getIndustry(r.industry);
  if (!industry) return { ok: false, message: "Please choose one of the listed industries." };
  const body = clean(r.message, true);
  if (body.length < intakeLimits.messageMin) return { ok: false, message: "Please write a little more so there's something to process." };
  if (body.length > intakeLimits.message) return { ok: false, message: `Please keep the inquiry under ${intakeLimits.message} characters.` };

  for (const key of ["customer_name", "customer_email", "subject"] as const) {
    if (r[key] !== undefined && r[key] !== null && typeof r[key] !== "string") return { ok: false, message: "This request couldn't be read." };
  }
  const name = clean(r.customer_name);
  const email = clean(r.customer_email);
  const subject = clean(r.subject);
  if (name.length > senderLimits.name) return { ok: false, message: `Please keep the name under ${senderLimits.name} characters.` };
  if (subject.length > senderLimits.subject) return { ok: false, message: `Please keep the subject under ${senderLimits.subject} characters.` };
  if (email && (email.length > senderLimits.email || !EMAIL_FORMAT.test(email))) return { ok: false, message: "Please enter a valid email address, or leave it blank." };

  return { ok: true, data: { industry, message: composeInquiry({ name, email, subject, body }) } };
}

// ---------------------------------------------------------------------------
// Stage 2: extraction
// ---------------------------------------------------------------------------

export const signals = ["safety_risk", "active_damage", "service_outage", "vulnerable_people", "stated_deadline"] as const;
export type Signal = (typeof signals)[number];

/** `null` means the customer didn't provide it; the UI shows "Not provided". */
export type Extraction = {
  is_customer_inquiry: boolean;
  request_type: string;
  summary: string;
  signals: Signal[];
  fields: Record<string, string | null>;
};

const nullableString = { type: ["string", "null"] };

/** JSON Schema sent to the model as a structured-output format. */
export function extractionJsonSchema(industry: IndustryConfig) {
  const keys = industry.fields.map((f) => f.key);
  return {
    type: "object",
    additionalProperties: false,
    required: ["is_customer_inquiry", "request_type", "summary", "signals", "fields"],
    properties: {
      is_customer_inquiry: { type: "boolean" },
      request_type: { type: "string", enum: industry.categories.map((c) => c.id) },
      summary: { type: "string" },
      signals: { type: "array", items: { type: "string", enum: [...signals] } },
      fields: {
        type: "object",
        additionalProperties: false,
        required: keys,
        properties: Object.fromEntries(keys.map((k) => [k, nullableString])),
      },
    },
  };
}

const fieldMax = 200;
const summaryMax = 800;

/** Validates the model's JSON before it's used. Returns null on any mismatch. */
export function validateExtraction(raw: unknown, industry: IndustryConfig): Extraction | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.is_customer_inquiry !== "boolean") return null;
  if (!industry.categories.some((c) => c.id === r.request_type)) return null;
  if (!Array.isArray(r.signals) || !r.signals.every((s) => (signals as readonly unknown[]).includes(s))) return null;
  const summary = clean(r.summary);
  if (!summary || summary.length > summaryMax) return null;
  if (typeof r.fields !== "object" || r.fields === null) return null;

  const rawFields = r.fields as Record<string, unknown>;
  const fields: Record<string, string | null> = {};
  for (const { key } of industry.fields) {
    const value = rawFields[key];
    if (value === null) fields[key] = null;
    else if (typeof value !== "string") return null;
    else {
      const v = clean(value);
      if (v.length > fieldMax) return null;
      // Treat placeholder strings as missing so the UI stays honest.
      fields[key] = v === "" || /^(n\/?a|none|unknown|not (provided|specified|mentioned))\.?$/i.test(v) ? null : v;
    }
  }
  return { is_customer_inquiry: r.is_customer_inquiry, request_type: r.request_type as string, summary, signals: [...new Set(r.signals as Signal[])], fields };
}

// ---------------------------------------------------------------------------
// Stage 3: deterministic classification
// ---------------------------------------------------------------------------

export const priorities = ["Routine Review", "Review Soon", "Immediate Review"] as const;
export type Priority = (typeof priorities)[number];

export type Classification = {
  category: string;
  department: string;
  /** Proposed by rules for an employee to confirm; never a safety assessment. */
  priority: Priority;
  reasons: string[];
  missing: string[];
  /** Questions the draft may ask. */
  questions: string[];
  next_action: string;
  /** Whether a person should look at this before anything else happens. */
  escalation: { required: boolean; reason: string | null };
};

// ---------------------------------------------------------------------------
// Stage 4: response draft
// ---------------------------------------------------------------------------

export type Draft = { subject: string; body: string; source: "ai" | "template" };

export const draftJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["subject", "body"],
  properties: { subject: { type: "string" }, body: { type: "string" } },
};

export const draftLimits = { subject: 200, body: 3000 } as const;

export function validateDraft(raw: unknown): Draft | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const subject = clean(r.subject);
  const body = clean(r.body, true);
  if (!subject || subject.length > draftLimits.subject || !body || body.length > draftLimits.body) return null;
  return { subject, body, source: "ai" };
}

// ---------------------------------------------------------------------------
// Streamed response (NDJSON, one event per line)
// ---------------------------------------------------------------------------

/** Regenerate: the request plus the extraction the browser already holds. Re-validated and re-grounded on the server. */
export function validateDraftRequest(input: unknown): { ok: true; data: IntakeRequest; extraction: Extraction } | { ok: false; message: string } {
  const request = validateIntakeRequest(input);
  if (!request.ok) return request;
  const r = input as Record<string, unknown>;
  const extraction = validateExtraction(r.extraction, request.data.industry);
  if (!extraction) return { ok: false, message: "This request couldn't be read." };
  return { ok: true, data: request.data, extraction };
}

export type Stage = "received" | "extraction" | "classification" | "draft";

export type ErrorCode = "timeout" | "busy" | "unavailable" | "refusal" | "invalid_output" | "draft_rejected" | "budget" | "aborted";

export type IntakeEvent =
  | { type: "received" }
  | { type: "extraction"; data: Extraction }
  | { type: "classification"; data: Classification }
  | { type: "draft"; data: Draft }
  | { type: "complete"; processing_mode: "live_ai" }
  | { type: "error"; stage: Stage; code: ErrorCode; message: string; retryable: boolean };
