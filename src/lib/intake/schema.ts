// Shared by the /demo server action (source of truth) and the client demo
// (limits and early feedback). Keep this file dependency-free so it can be
// unit-tested with plain Node.

export const intakeLimits = {
  name: 100,
  email: 254,
  subject: 200,
  body: 3000,
  bodyMin: 20,
} as const;

export type IntakeEmail = { fromName: string; fromEmail: string; subject: string; body: string };

export type IntakeValidation = { ok: true; data: IntakeEmail } | { ok: false; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

function clean(value: unknown, multiline = false): string {
  if (typeof value !== "string") return "";
  let v = value.normalize("NFC").replace(/\r\n?/g, "\n");
  v = multiline ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") : v.replace(/[\u0000-\u001F\u007F]/g, " ");
  if (!multiline) v = v.replace(/\s+/g, " ");
  return v.trim();
}

export function validateIntakeEmail(input: Record<string, unknown>): IntakeValidation {
  const data = {
    fromName: clean(input.fromName),
    fromEmail: clean(input.fromEmail).toLowerCase(),
    subject: clean(input.subject),
    body: clean(input.body, true),
  };
  if (!data.fromName || data.fromName.length > intakeLimits.name) return { ok: false, message: "The sender name is missing or too long." };
  if (data.fromEmail.length > intakeLimits.email || !EMAIL_RE.test(data.fromEmail)) return { ok: false, message: "The sender email address isn't valid." };
  if (data.subject.length > intakeLimits.subject) return { ok: false, message: `Please keep the subject under ${intakeLimits.subject} characters.` };
  if (data.body.length < intakeLimits.bodyMin) return { ok: false, message: "Please write a little more in the email body so there's something to analyze." };
  if (data.body.length > intakeLimits.body) return { ok: false, message: `Please keep the email body under ${intakeLimits.body} characters.` };
  return { ok: true, data };
}

// ---------------------------------------------------------------------------
// AI analysis result
// ---------------------------------------------------------------------------

export const priorities = ["Low", "Normal", "High", "Emergency"] as const;
export type Priority = (typeof priorities)[number];

/** `null` means the customer didn't provide it; the UI shows "Not provided". */
export type IntakeAnalysis = {
  isServiceRequest: boolean;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  serviceType: string | null;
  problem: string | null;
  preferredAppointment: string | null;
  priority: Priority;
  summary: string;
  replySubject: string;
  replyBody: string;
};

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };

/** JSON Schema sent to the model as a structured-output format. */
export const analysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "isServiceRequest",
    "customerName",
    "email",
    "phone",
    "location",
    "serviceType",
    "problem",
    "preferredAppointment",
    "priority",
    "summary",
    "replySubject",
    "replyBody",
  ],
  properties: {
    isServiceRequest: { type: "boolean" },
    customerName: nullableString,
    email: nullableString,
    phone: nullableString,
    location: nullableString,
    serviceType: nullableString,
    problem: nullableString,
    preferredAppointment: nullableString,
    priority: { type: "string", enum: [...priorities] },
    summary: { type: "string" },
    replySubject: { type: "string" },
    replyBody: { type: "string" },
  },
} as const;

const fieldLimits = { short: 200, summary: 800, replySubject: 200, replyBody: 3000 } as const;

function shortField(value: unknown): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const v = clean(value);
  if (v.length > fieldLimits.short) return undefined;
  // Treat placeholder strings as missing so the UI stays honest.
  return v === "" || /^(n\/?a|none|unknown|not (provided|specified|mentioned))\.?$/i.test(v) ? null : v;
}

function text(value: unknown, max: number, multiline = false): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = clean(value, multiline);
  return v && v.length <= max ? v : undefined;
}

/** Validates the model's JSON before anything reaches the browser. Returns null on any mismatch. */
export function validateAnalysis(raw: unknown): IntakeAnalysis | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.isServiceRequest !== "boolean") return null;
  if (!(priorities as readonly unknown[]).includes(r.priority)) return null;

  const short = {
    customerName: shortField(r.customerName),
    email: shortField(r.email),
    phone: shortField(r.phone),
    location: shortField(r.location),
    serviceType: shortField(r.serviceType),
    problem: shortField(r.problem),
    preferredAppointment: shortField(r.preferredAppointment),
  };
  if (Object.values(short).some((v) => v === undefined)) return null;

  const summary = text(r.summary, fieldLimits.summary);
  const replySubject = text(r.replySubject, fieldLimits.replySubject);
  const replyBody = text(r.replyBody, fieldLimits.replyBody, true);
  if (!summary || !replySubject || !replyBody) return null;

  return {
    isServiceRequest: r.isServiceRequest,
    ...(short as { [K in keyof typeof short]: string | null }),
    priority: r.priority as Priority,
    summary,
    replySubject,
    replyBody,
  };
}
