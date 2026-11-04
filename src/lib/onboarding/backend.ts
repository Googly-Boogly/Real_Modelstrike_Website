// The Sales Swarm onboarding API, as seen from this site's server.
//
// The browser never talks to the Swarm directly. /api/customer-onboarding/*
// route handlers call it server-to-server, signing every request with a shared
// secret, so the Swarm's address, the secret and the raw session token never
// reach the client bundle and no CORS is needed. See docs/ONBOARDING.md for the
// full contract the Swarm must implement.

import { createHash, createHmac } from "node:crypto";
import type { BackendPayload } from "./schema.ts";

export type Verification = { required: boolean; maskedEmail: string | null };

export type ProjectContext = {
  company: string;
  projectName: string;
  contact: { name: string; email: string | null; title: string | null };
  status: "open" | "submitted";
  submittedAt: string | null;
};

export type Failure = {
  ok: false;
  status: number;
  /** Stable machine code; the browser maps it to copy. Never contains backend internals. */
  code: string;
  retryAfterSeconds?: number;
  fieldErrors?: Record<string, string>;
  attemptsRemaining?: number;
  submittedAt?: string;
};

export type Result<T> = { ok: true; data: T } | Failure;

export type Ctx = { clientIp: string };

export interface OnboardingBackend {
  readonly name: "swarm" | "mock";
  exchange(token: string, ctx: Ctx): Promise<Result<{ sessionToken: string; expiresAt: string; verification: Verification }>>;
  sendCode(session: string, ctx: Ctx): Promise<Result<{ maskedEmail: string | null; resendAfterSeconds: number }>>;
  confirmCode(session: string, code: string, ctx: Ctx): Promise<Result<{ verified: true }>>;
  project(session: string, ctx: Ctx): Promise<Result<ProjectContext>>;
  submit(session: string, payload: BackendPayload, idempotencyKey: string, ctx: Ctx): Promise<Result<{ questionnaireId: string; submittedAt: string }>>;
}

// --------------------------------------------------------------------------------------------- signing

/**
 * HMAC-SHA256 over `timestamp \n METHOD \n path \n sha256(body)`, hex encoded.
 * The Swarm recomputes it with the same secret, rejects timestamps more than
 * five minutes old, and compares in constant time.
 */
export function sign(secret: string, timestamp: string, method: string, path: string, body: string) {
  const bodyHash = createHash("sha256").update(body).digest("hex");
  return createHmac("sha256", secret).update(`${timestamp}\n${method.toUpperCase()}\n${path}\n${bodyHash}`).digest("hex");
}

// --------------------------------------------------------------------------------------------- response parsing

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.slice(0, max) : null);

/** Known codes pass through; anything else collapses to a generic one so backend details never leak to the browser. */
const KNOWN_CODES = new Set([
  "invalid_link",
  "expired_link",
  "revoked_link",
  "no_session",
  "session_expired",
  "verification_required",
  "invalid_code",
  "code_expired",
  "rate_limited",
  "already_submitted",
  "invalid",
  "backend_unavailable",
]);

function failure(status: number, json: Record<string, unknown> | null): Failure {
  const raw = str(json?.code, 60) ?? "";
  const code = KNOWN_CODES.has(raw) ? raw : status === 401 ? "session_expired" : status === 429 ? "rate_limited" : status >= 500 ? "backend_unavailable" : "invalid";
  const out: Failure = { ok: false, status: status >= 500 ? 503 : status, code };
  if (typeof json?.retry_after_seconds === "number") out.retryAfterSeconds = Math.max(1, Math.min(3600, Math.round(json.retry_after_seconds)));
  if (typeof json?.attempts_remaining === "number") out.attemptsRemaining = Math.max(0, Math.round(json.attempts_remaining));
  if (str(json?.submitted_at)) out.submittedAt = str(json?.submitted_at)!;
  if (json?.field_errors && typeof json.field_errors === "object") {
    out.fieldErrors = Object.fromEntries(
      Object.entries(json.field_errors as Record<string, unknown>)
        .filter(([, v]) => typeof v === "string")
        .slice(0, 40)
        .map(([k, v]) => [k.slice(0, 60), (v as string).slice(0, 200)]),
    );
  }
  return out;
}

function parseVerification(v: unknown): Verification {
  const o = (v ?? {}) as Record<string, unknown>;
  // Fail safe: anything other than an explicit `false` means verification is required.
  return { required: o.required !== false, maskedEmail: str(o.masked_email, 320) };
}

export function parseProject(json: Record<string, unknown>): ProjectContext | null {
  const contact = (json.contact ?? {}) as Record<string, unknown>;
  const company = str(json.company_name);
  const projectName = str(json.project_name);
  const status = json.questionnaire_status === "submitted" ? "submitted" : json.questionnaire_status === "open" ? "open" : null;
  if (!company || !projectName || !status) return null;
  return {
    company,
    projectName,
    contact: { name: str(contact.name, 200) ?? "", email: str(contact.email, 320), title: str(contact.title, 200) },
    status,
    submittedAt: str(json.submitted_at),
  };
}

// --------------------------------------------------------------------------------------------- HTTP client

export type SwarmConfig = { baseUrl: string; secret: string; timeoutMs?: number; fetch?: typeof fetch };

export function swarmBackend({ baseUrl, secret, timeoutMs = 10_000, fetch: doFetch = fetch }: SwarmConfig): OnboardingBackend {
  const base = baseUrl.replace(/\/+$/, "");
  const prefix = "/api/onboarding-portal/v1";

  async function call(method: "GET" | "POST", path: string, ctx: Ctx, opts: { session?: string; body?: unknown; idempotencyKey?: string } = {}) {
    const fullPath = `${prefix}${path}`;
    const body = opts.body === undefined ? "" : JSON.stringify(opts.body);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-ModelStrike-Client": "modelstrike-web",
      "X-ModelStrike-Timestamp": timestamp,
      "X-ModelStrike-Signature": `sha256=${sign(secret, timestamp, method, fullPath, body)}`,
      // Trusted by the Swarm only because the request is signed; used for its own invalid-token limits.
      "X-Onboarding-Client-IP": ctx.clientIp,
    };
    if (body) headers["Content-Type"] = "application/json";
    if (opts.session) headers["X-Onboarding-Session"] = opts.session;
    if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

    let res: Response;
    try {
      res = await doFetch(`${base}${fullPath}`, { method, headers, body: body || undefined, signal: AbortSignal.timeout(timeoutMs), cache: "no-store", redirect: "error" });
    } catch {
      return { status: 503, json: null as Record<string, unknown> | null, unreachable: true };
    }
    let json: Record<string, unknown> | null = null;
    try {
      const parsed: unknown = await res.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) json = parsed as Record<string, unknown>;
    } catch {
      // Non-JSON (e.g. a proxy error page): handled as a failure below.
    }
    return { status: res.status, json, unreachable: false };
  }

  const unavailable: Failure = { ok: false, status: 503, code: "backend_unavailable" };

  return {
    name: "swarm",

    async exchange(token, ctx) {
      const r = await call("POST", "/session", ctx, { body: { token } });
      if (r.status !== 200 || !r.json) return r.unreachable ? unavailable : failure(r.status, r.json);
      const sessionToken = str(r.json.session_token, 512);
      const expiresAt = str(r.json.expires_at);
      if (!sessionToken || !expiresAt || Number.isNaN(Date.parse(expiresAt))) return unavailable;
      return { ok: true, data: { sessionToken, expiresAt, verification: parseVerification(r.json.verification) } };
    },

    async sendCode(session, ctx) {
      const r = await call("POST", "/verification/send", ctx, { session, body: {} });
      if (r.status !== 200 && r.status !== 202) return r.unreachable ? unavailable : failure(r.status, r.json);
      const after = typeof r.json?.resend_after_seconds === "number" ? r.json.resend_after_seconds : 60;
      return { ok: true, data: { maskedEmail: str(r.json?.masked_email, 320), resendAfterSeconds: Math.max(0, Math.min(600, Math.round(after))) } };
    },

    async confirmCode(session, code, ctx) {
      const r = await call("POST", "/verification/confirm", ctx, { session, body: { code } });
      if (r.status !== 200) return r.unreachable ? unavailable : failure(r.status, r.json);
      return { ok: true, data: { verified: true } };
    },

    async project(session, ctx) {
      const r = await call("GET", "/project", ctx, { session });
      if (r.status !== 200 || !r.json) return r.unreachable ? unavailable : failure(r.status, r.json);
      const project = parseProject(r.json);
      return project ? { ok: true, data: project } : unavailable;
    },

    async submit(session, payload, idempotencyKey, ctx) {
      const r = await call("POST", "/questionnaire", ctx, { session, body: payload, idempotencyKey });
      // 201 = created, 200 = idempotent replay of the same submission.
      if ((r.status !== 201 && r.status !== 200) || !r.json) return r.unreachable ? unavailable : failure(r.status, r.json);
      const questionnaireId = str(r.json.questionnaire_id, 80);
      const submittedAt = str(r.json.submitted_at);
      // Never report success without the Swarm's confirmation of what it saved.
      if (!questionnaireId || !submittedAt) return unavailable;
      return { ok: true, data: { questionnaireId, submittedAt } };
    },
  };
}
