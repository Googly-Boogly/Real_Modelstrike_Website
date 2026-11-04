// /api/customer-onboarding/* request handling, kept free of Next.js imports so it is unit-tested directly.
//
// Security model (details in docs/ONBOARDING.md):
// * The invitation token is exchanged once for a Swarm session. The session token lives only in a
//   Secure, HttpOnly, SameSite=Strict, __Host- cookie on this origin. JavaScript never sees it.
// * The project is identified by that session alone. No request accepts a project or customer id.
// * POSTs must be same-origin JSON (CSRF), bodies are size-capped, and every route is rate limited
//   per IP here and again in the Swarm.
// * Logs carry outcome codes only: never tokens, sessions, names, emails or answers.

import { createRateLimiter, type RateLimiter } from "../contact/rate-limit.ts";
import type { Ctx, Failure, OnboardingBackend } from "./backend.ts";
import { toBackendPayload, validateSubmission, type Field, type FieldErrors } from "./schema.ts";

export const COOKIE_SECURE = "__Host-ms_onboarding";
/** Plain-http local development only (browsers reject __Host- cookies without Secure). */
export const COOKIE_DEV = "ms_onboarding";

const TOKEN_RE = /^[A-Za-z0-9_-]{20,512}$/;
const CODE_RE = /^\d{6}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_SESSION_SECONDS = 4 * 60 * 60;

/** Swarm field paths (snake_case payload) → questionnaire fields, for server-side validation errors. */
const PATH_TO_FIELD: Record<string, Field> = {
  "contact.full_name": "contactName",
  "contact.job_title": "jobTitle",
  "contact.preferred_email": "contactEmail",
  "business.industry": "industry",
  "business.industry_other": "industryOther",
  "workflow.process_to_automate": "processToAutomate",
  "workflow.current_process": "currentProcess",
  "workflow.challenges": "challenges",
  "workflow.challenges_other": "challengesOther",
  "automation.software": "software",
  "automation.software_other": "softwareOther",
  "automation.data_sources": "dataSources",
  "automation.data_sources_other": "dataSourcesOther",
  "automation.daily_volume": "dailyVolume",
  "automation.desired_actions": "actions",
  "automation.desired_actions_other": "actionsOther",
  "automation.desired_actions_notes": "actionsNotes",
  "automation.approver.role": "approverRole",
  "automation.approver.email": "approverEmail",
  "goals.success_criteria": "successCriteria",
  "goals.additional_notes": "additionalNotes",
};

type Limiters = { session: RateLimiter; project: RateLimiter; send: RateLimiter; confirm: RateLimiter; submit: RateLimiter };

export function defaultLimiters(): Limiters {
  const m = 60_000;
  return {
    session: createRateLimiter({ limit: 10, windowMs: 15 * m }),
    project: createRateLimiter({ limit: 60, windowMs: 15 * m }),
    send: createRateLimiter({ limit: 5, windowMs: 15 * m }),
    confirm: createRateLimiter({ limit: 10, windowMs: 15 * m }),
    submit: createRateLimiter({ limit: 10, windowMs: 60 * m }),
  };
}

type Options = {
  getBackend: () => OnboardingBackend | null;
  limiters?: Limiters;
  /** Secure cookies (and the __Host- prefix). True in production; false only for plain-http localhost. */
  secureCookies: boolean;
  now?: () => number;
  log?: (line: string) => void;
};

const NO_STORE = { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" };

function reply(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}, cookies: string[] = []) {
  const h = new Headers({ ...NO_STORE, ...headers });
  for (const c of cookies) h.append("Set-Cookie", c);
  return Response.json(body, { status, headers: h });
}

function clientIp(request: Request) {
  // Trust only the first hop; the reverse proxy in front of the app (Caddy) sets these.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}

async function readJson(request: Request, limit: number): Promise<{ ok: true; json: unknown } | { ok: false; status: number }> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return { ok: false, status: 415 };
  if (!request.body) return { ok: false, status: 400 };
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return { ok: false, status: 413 };
    }
    chunks.push(value);
  }
  try {
    return { ok: true, json: JSON.parse(Buffer.concat(chunks).toString("utf8")) };
  } catch {
    return { ok: false, status: 400 };
  }
}

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function createOnboardingHandlers({ getBackend, limiters = defaultLimiters(), secureCookies, now = Date.now, log = (l) => console.info(l) }: Options) {
  const cookieName = secureCookies ? COOKIE_SECURE : COOKIE_DEV;
  const attrs = `Path=/; HttpOnly; SameSite=Strict${secureCookies ? "; Secure" : ""}`;
  const setSession = (value: string, maxAge: number) => `${cookieName}=${value}; Max-Age=${maxAge}; ${attrs}`;
  const clearSession = () => `${cookieName}=; Max-Age=0; ${attrs}`;

  const deny = (route: string, status: number, code: string, extra: Record<string, unknown> = {}, cookies: string[] = []) => {
    log(`[onboarding] ${route} denied code=${code} status=${status}`);
    const headers: Record<string, string> = typeof extra.retryAfterSeconds === "number" ? { "Retry-After": String(extra.retryAfterSeconds) } : {};
    return reply(status, { ok: false, code, ...extra }, headers, cookies);
  };

  /** Passes a Swarm failure to the browser using only whitelisted fields. A dead session also clears the cookie. */
  const fromFailure = (route: string, f: Failure) => {
    const extra: Record<string, unknown> = {};
    if (f.retryAfterSeconds !== undefined) extra.retryAfterSeconds = f.retryAfterSeconds;
    if (f.attemptsRemaining !== undefined) extra.attemptsRemaining = f.attemptsRemaining;
    if (f.submittedAt !== undefined) extra.submittedAt = f.submittedAt;
    const dead = f.code === "session_expired" || f.code === "revoked_link" || f.code === "expired_link";
    return deny(route, f.status, f.code, extra, dead ? [clearSession()] : []);
  };

  const limited = (route: string, limiter: RateLimiter, ip: string) => {
    const { allowed, retryAfterMs } = limiter.check(ip, now());
    return allowed ? null : deny(route, 429, "rate_limited", { retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) });
  };

  /** Shared preamble: backend configured, same-origin for writes, rate limit, session cookie where needed. */
  function prepare(route: string, request: Request, limiter: RateLimiter, { needsSession }: { needsSession: boolean }) {
    const backend = getBackend();
    if (!backend) return deny(route, 503, "not_configured");
    if (request.method !== "GET" && !isSameOrigin(request)) return deny(route, 403, "forbidden");
    const ctx: Ctx = { clientIp: clientIp(request) };
    const blocked = limited(route, limiter, ctx.clientIp);
    if (blocked) return blocked;
    const session = readCookie(request, cookieName);
    if (needsSession && (!session || !TOKEN_RE.test(session))) return deny(route, 401, "no_session");
    return { backend, ctx, session: session ?? "" };
  }

  return {
    /** POST /api/customer-onboarding/session  { token } → sets the session cookie. */
    async session(request: Request) {
      const p = prepare("session", request, limiters.session, { needsSession: false });
      if (p instanceof Response) return p;
      const body = await readJson(request, 2048);
      if (!body.ok) return deny("session", body.status, "bad_request");
      const raw = body.json as Record<string, unknown> | null;
      const token = raw && typeof raw === "object" && Object.keys(raw).length === 1 ? raw.token : undefined;
      // A malformed token can't be valid: answer exactly like an unknown one, without a backend call.
      if (typeof token !== "string" || !TOKEN_RE.test(token)) return deny("session", 401, "invalid_link");
      const r = await p.backend.exchange(token, p.ctx);
      if (!r.ok) return fromFailure("session", r);
      const seconds = Math.floor((Date.parse(r.data.expiresAt) - now()) / 1000);
      if (seconds <= 0 || !TOKEN_RE.test(r.data.sessionToken)) return deny("session", 503, "backend_unavailable");
      log(`[onboarding] session established verification=${r.data.verification.required ? "required" : "not_required"} backend=${p.backend.name}`);
      return reply(200, { ok: true, verification: r.data.verification, mock: p.backend.name === "mock" }, {}, [setSession(r.data.sessionToken, Math.min(seconds, MAX_SESSION_SECONDS))]);
    },

    /** GET /api/customer-onboarding/project → the verified project context and questionnaire status. */
    async project(request: Request) {
      const p = prepare("project", request, limiters.project, { needsSession: true });
      if (p instanceof Response) return p;
      const r = await p.backend.project(p.session, p.ctx);
      if (!r.ok) return fromFailure("project", r);
      return reply(200, { ok: true, project: r.data, mock: p.backend.name === "mock" });
    },

    /** POST /api/customer-onboarding/verification/send → emails a one-time code to the authorized contact. */
    async sendCode(request: Request) {
      const p = prepare("verification_send", request, limiters.send, { needsSession: true });
      if (p instanceof Response) return p;
      const body = await readJson(request, 256);
      if (!body.ok) return deny("verification_send", body.status, "bad_request");
      const r = await p.backend.sendCode(p.session, p.ctx);
      if (!r.ok) return fromFailure("verification_send", r);
      return reply(200, { ok: true, maskedEmail: r.data.maskedEmail, resendAfterSeconds: r.data.resendAfterSeconds });
    },

    /** POST /api/customer-onboarding/verification/confirm  { code } */
    async confirmCode(request: Request) {
      const p = prepare("verification_confirm", request, limiters.confirm, { needsSession: true });
      if (p instanceof Response) return p;
      const body = await readJson(request, 256);
      if (!body.ok) return deny("verification_confirm", body.status, "bad_request");
      const code = (body.json as Record<string, unknown> | null)?.code;
      if (typeof code !== "string" || !CODE_RE.test(code.trim())) return deny("verification_confirm", 400, "invalid_code");
      const r = await p.backend.confirmCode(p.session, code.trim(), p.ctx);
      if (!r.ok) return fromFailure("verification_confirm", r);
      log("[onboarding] contact verified");
      return reply(200, { ok: true });
    },

    /** POST /api/customer-onboarding/submit  { answers, idempotencyKey } */
    async submit(request: Request) {
      const p = prepare("submit", request, limiters.submit, { needsSession: true });
      if (p instanceof Response) return p;
      const body = await readJson(request, 96 * 1024);
      if (!body.ok) return deny("submit", body.status, "bad_request");
      const raw = body.json as Record<string, unknown> | null;
      if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some((k) => k !== "answers" && k !== "idempotencyKey")) {
        return deny("submit", 400, "invalid");
      }
      if (typeof raw.idempotencyKey !== "string" || !UUID_RE.test(raw.idempotencyKey)) return deny("submit", 400, "invalid");
      const v = validateSubmission(raw.answers);
      if (!v.ok) return deny("submit", 422, "invalid", v.fieldErrors ? { fieldErrors: v.fieldErrors } : {});

      const r = await p.backend.submit(p.session, toBackendPayload(v.answers), raw.idempotencyKey.toLowerCase(), p.ctx);
      if (!r.ok) {
        if (r.code === "invalid" && r.fieldErrors) {
          const fieldErrors: FieldErrors = {};
          for (const [path, message] of Object.entries(r.fieldErrors)) {
            const field = PATH_TO_FIELD[path];
            if (field) fieldErrors[field] = message;
          }
          return deny("submit", 422, "invalid", Object.keys(fieldErrors).length > 0 ? { fieldErrors } : {});
        }
        return fromFailure("submit", r);
      }
      log(`[onboarding] questionnaire submitted backend=${p.backend.name}`);
      return reply(201, { ok: true, submittedAt: r.data.submittedAt });
    },
  };
}

export type OnboardingHandlers = ReturnType<typeof createOnboardingHandlers>;
