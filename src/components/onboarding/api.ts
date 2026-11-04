// Browser → this site's /api/customer-onboarding routes. Same origin only: the
// session cookie is HttpOnly, so it is never read or handled here.

import type { ProjectContext, Verification } from "@/lib/onboarding/backend";
import type { Answers, FieldErrors } from "@/lib/onboarding/schema";

export type ApiError = {
  ok: false;
  /** HTTP status, or 0 when the request never got a response (offline, DNS, aborted). */
  status: number;
  code: string;
  retryAfterSeconds?: number;
  attemptsRemaining?: number;
  submittedAt?: string;
  fieldErrors?: FieldErrors;
};

type Ok<T> = { ok: true } & T;
export type ApiResult<T> = Ok<T> | ApiError;

const BASE = "/api/customer-onboarding";

async function call<T>(path: string, init: { method: "GET" | "POST"; body?: unknown }): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: init.method,
      headers: init.body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });
  } catch {
    return { ok: false, status: 0, code: "network" };
  }
  let json: Record<string, unknown> | null = null;
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    // A proxy error page or an empty body.
  }
  if (res.ok && json?.ok === true) return json as Ok<T>;
  return { ...(json ?? {}), ok: false, status: res.status, code: typeof json?.code === "string" ? json.code : res.status >= 500 ? "backend_unavailable" : "unknown" } as ApiError;
}

export const onboardingApi = {
  exchange: (token: string) => call<{ verification: Verification; mock?: boolean }>("/session", { method: "POST", body: { token } }),
  project: () => call<{ project: ProjectContext; mock?: boolean }>("/project", { method: "GET" }),
  sendCode: () => call<{ maskedEmail: string | null; resendAfterSeconds: number }>("/verification/send", { method: "POST", body: {} }),
  confirmCode: (code: string) => call<object>("/verification/confirm", { method: "POST", body: { code } }),
  submit: (answers: Answers, idempotencyKey: string) => call<{ submittedAt: string }>("/submit", { method: "POST", body: { answers, idempotencyKey } }),
};
