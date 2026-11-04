// DEVELOPMENT-ONLY stand-in for the Sales Swarm onboarding API.
// In memory, fictional data, fixed tokens. config.ts refuses to use it in
// production, and nothing submitted here is saved anywhere real.

import { randomBytes, randomUUID } from "node:crypto";
import type { Failure, OnboardingBackend, ProjectContext } from "./backend.ts";

export const MOCK_CODE = "123456";

/** Fixed development invitation tokens. Each maps to a scenario. */
export const mockTokens = {
  valid: "mock_valid_invitation_0001",
  verify: "mock_verify_invitation_0002",
  expired: "mock_expired_invitation_003",
  revoked: "mock_revoked_invitation_004",
  submitted: "mock_submitted_invitation_5",
} as const;

type Scenario = keyof typeof mockTokens;

const fixture = (): ProjectContext => ({
  company: "ABC Heating & Cooling",
  projectName: "AI Customer Intake Automation",
  contact: { name: "Test Customer", email: "test.customer@example.com", title: "Office Manager" },
  status: "open",
  submittedAt: null,
});

type Session = { scenario: Scenario; verified: boolean; expiresAt: number; codeSentAt: number | null; codeAttempts: number };
type Store = { sessions: Map<string, Session>; submissions: Map<Scenario, { id: string; at: string; key: string }> };

const fail = (status: number, code: string, extra: Partial<Failure> = {}): Failure => ({ ok: false, status, code, ...extra });

export function mockBackend({ store = newStore(), now = () => Date.now(), sessionTtlMs = 2 * 60 * 60_000 }: { store?: Store; now?: () => number; sessionTtlMs?: number } = {}): OnboardingBackend {
  function session(token: string): Session | Failure {
    const s = store.sessions.get(token);
    if (!s || s.expiresAt <= now()) return fail(401, "session_expired");
    return s;
  }
  function verified(token: string): Session | Failure {
    const s = session(token);
    if ("ok" in s) return s;
    return s.verified ? s : fail(403, "verification_required");
  }

  return {
    name: "mock",

    async exchange(token) {
      const scenario = (Object.keys(mockTokens) as Scenario[]).find((k) => mockTokens[k] === token);
      if (!scenario) return fail(401, "invalid_link");
      if (scenario === "expired") return fail(410, "expired_link");
      if (scenario === "revoked") return fail(410, "revoked_link");
      const sessionToken = randomBytes(32).toString("base64url");
      const expiresAt = now() + sessionTtlMs;
      store.sessions.set(sessionToken, { scenario, verified: scenario !== "verify", expiresAt, codeSentAt: null, codeAttempts: 0 });
      return {
        ok: true,
        data: { sessionToken, expiresAt: new Date(expiresAt).toISOString(), verification: { required: scenario === "verify", maskedEmail: scenario === "verify" ? "t•••@example.com" : null } },
      };
    },

    async sendCode(token) {
      const s = session(token);
      if ("ok" in s) return s;
      if (s.codeSentAt && now() - s.codeSentAt < 30_000) return fail(429, "rate_limited", { retryAfterSeconds: Math.ceil((30_000 - (now() - s.codeSentAt)) / 1000) });
      s.codeSentAt = now();
      s.codeAttempts = 0;
      return { ok: true, data: { maskedEmail: "t•••@example.com", resendAfterSeconds: 30 } };
    },

    async confirmCode(token, code) {
      const s = session(token);
      if ("ok" in s) return s;
      if (!s.codeSentAt) return fail(400, "code_expired");
      if (s.codeAttempts >= 5) return fail(429, "rate_limited", { retryAfterSeconds: 600 });
      if (code !== MOCK_CODE) {
        s.codeAttempts += 1;
        return fail(400, "invalid_code", { attemptsRemaining: 5 - s.codeAttempts });
      }
      s.verified = true;
      return { ok: true, data: { verified: true } };
    },

    async project(token) {
      const s = verified(token);
      if ("ok" in s) return s;
      const saved = store.submissions.get(s.scenario);
      if (s.scenario === "submitted" || saved) return { ok: true, data: { ...fixture(), status: "submitted", submittedAt: saved?.at ?? "2026-11-01T15:30:00.000Z" } };
      return { ok: true, data: fixture() };
    },

    async submit(token, _payload, idempotencyKey) {
      const s = verified(token);
      if ("ok" in s) return s;
      if (s.scenario === "submitted") return fail(409, "already_submitted", { submittedAt: "2026-11-01T15:30:00.000Z" });
      const saved = store.submissions.get(s.scenario);
      if (saved) return saved.key === idempotencyKey ? { ok: true, data: { questionnaireId: saved.id, submittedAt: saved.at } } : fail(409, "already_submitted", { submittedAt: saved.at });
      const record = { id: randomUUID(), at: new Date(now()).toISOString(), key: idempotencyKey };
      store.submissions.set(s.scenario, record);
      return { ok: true, data: { questionnaireId: record.id, submittedAt: record.at } };
    },
  };
}

export function newStore(): Store {
  return { sessions: new Map(), submissions: new Map() };
}
