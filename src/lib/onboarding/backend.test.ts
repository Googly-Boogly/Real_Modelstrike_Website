import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { sign, swarmBackend } from "./backend.ts";
import { resolveBackendConfig } from "./config.ts";
import { completeAnswers } from "./fixtures.ts";
import { toBackendPayload } from "./schema.ts";

const SECRET = "s".repeat(48);
const ctx = { clientIp: "203.0.113.7" };

type Call = { url: string; init: RequestInit };

function fakeFetch(responses: (Response | Error)[]) {
  const calls: Call[] = [];
  const fn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("requests are HMAC-signed over timestamp, method, path and body hash", async () => {
  const f = fakeFetch([json(200, { session_token: "x".repeat(43), expires_at: new Date(Date.now() + 3600_000).toISOString(), verification: { required: false } })]);
  const b = swarmBackend({ baseUrl: "https://swarm.example.com/", secret: SECRET, fetch: f.fn });
  const r = await b.exchange("tok_abcdefghijklmnopqrstuvwxyz", ctx);
  assert.equal(r.ok, true);
  const { url, init } = f.calls[0];
  assert.equal(url, "https://swarm.example.com/api/onboarding-portal/v1/session");
  const h = init.headers as Record<string, string>;
  const ts = h["X-ModelStrike-Timestamp"];
  const body = init.body as string;
  const expected = createHmac("sha256", SECRET)
    .update(`${ts}\nPOST\n/api/onboarding-portal/v1/session\n${createHash("sha256").update(body).digest("hex")}`)
    .digest("hex");
  assert.equal(h["X-ModelStrike-Signature"], `sha256=${expected}`);
  assert.equal(sign(SECRET, ts, "post", "/api/onboarding-portal/v1/session", body), expected);
  assert.equal(h["X-Onboarding-Client-IP"], "203.0.113.7");
  assert.equal(init.redirect, "error");
  assert.deepEqual(JSON.parse(body), { token: "tok_abcdefghijklmnopqrstuvwxyz" });
});

test("verification defaults to required unless the Swarm says otherwise", async () => {
  const f = fakeFetch([json(200, { session_token: "x".repeat(43), expires_at: new Date(Date.now() + 3600_000).toISOString() })]);
  const r = await swarmBackend({ baseUrl: "https://swarm.example.com", secret: SECRET, fetch: f.fn }).exchange("t".repeat(30), ctx);
  assert.ok(r.ok && r.data.verification.required);
});

test("submit sends the session and idempotency key, and only succeeds on the Swarm's confirmation", async () => {
  const f = fakeFetch([json(201, { questionnaire_id: "q_1", submitted_at: "2026-11-04T12:00:00Z" }), json(201, {}), json(200, { questionnaire_id: "q_1", submitted_at: "2026-11-04T12:00:00Z" })]);
  const b = swarmBackend({ baseUrl: "https://swarm.example.com", secret: SECRET, fetch: f.fn });
  const payload = toBackendPayload(completeAnswers());
  const ok = await b.submit("sess_".padEnd(40, "x"), payload, "key-1", ctx);
  assert.deepEqual(ok, { ok: true, data: { questionnaireId: "q_1", submittedAt: "2026-11-04T12:00:00Z" } });
  const h = f.calls[0].init.headers as Record<string, string>;
  assert.equal(h["X-Onboarding-Session"], "sess_".padEnd(40, "x"));
  assert.equal(h["Idempotency-Key"], "key-1");
  assert.equal(f.calls[0].url, "https://swarm.example.com/api/onboarding-portal/v1/questionnaire");

  // A 201 without the saved record's id is NOT a success.
  const empty = await b.submit("s".repeat(40), payload, "key-2", ctx);
  assert.equal(empty.ok, false);
  // 200 is an idempotent replay.
  assert.equal((await b.submit("s".repeat(40), payload, "key-1", ctx)).ok, true);
});

test("network failures, timeouts and 5xx become backend_unavailable; unknown codes never leak", async () => {
  const f = fakeFetch([new TypeError("fetch failed"), json(502, { detail: "psycopg.OperationalError: connection to 10.0.0.5 failed" }), new Response("<html>Bad gateway</html>", { status: 504 }), json(400, { code: "sqlalchemy_integrity_error" })]);
  const b = swarmBackend({ baseUrl: "https://swarm.example.com", secret: SECRET, fetch: f.fn });
  for (let i = 0; i < 3; i++) {
    const r = await b.project("s".repeat(40), ctx);
    assert.deepEqual(r, { ok: false, status: 503, code: "backend_unavailable" });
  }
  const r = await b.project("s".repeat(40), ctx);
  assert.deepEqual(r, { ok: false, status: 400, code: "invalid" });
});

test("known failure codes and limits pass through", async () => {
  const f = fakeFetch([json(410, { code: "expired_link" }), json(429, { code: "rate_limited", retry_after_seconds: 99999 }), json(409, { code: "already_submitted", submitted_at: "2026-11-01T00:00:00Z" })]);
  const b = swarmBackend({ baseUrl: "https://swarm.example.com", secret: SECRET, fetch: f.fn });
  assert.deepEqual(await b.exchange("t".repeat(30), ctx), { ok: false, status: 410, code: "expired_link" });
  assert.deepEqual(await b.exchange("t".repeat(30), ctx), { ok: false, status: 429, code: "rate_limited", retryAfterSeconds: 3600 });
  assert.deepEqual(await b.submit("s".repeat(40), toBackendPayload(completeAnswers()), "k", ctx), { ok: false, status: 409, code: "already_submitted", submittedAt: "2026-11-01T00:00:00Z" });
});

test("config: Swarm needs https and a strong secret; the mock never runs in production", () => {
  assert.deepEqual(resolveBackendConfig({ NODE_ENV: "production" }), { kind: "none", problem: "not_configured" });
  assert.deepEqual(resolveBackendConfig({ NODE_ENV: "production", ONBOARDING_MOCK: "true" }), { kind: "none", problem: "not_configured" });
  assert.deepEqual(resolveBackendConfig({ NODE_ENV: "development", ONBOARDING_MOCK: "true" }), { kind: "mock" });
  assert.deepEqual(resolveBackendConfig({ NODE_ENV: "production", ONBOARDING_API_URL: "http://3.90.81.224:9122", ONBOARDING_API_SECRET: SECRET }), { kind: "none", problem: "insecure_url" });
  assert.deepEqual(resolveBackendConfig({ NODE_ENV: "production", ONBOARDING_API_URL: "http://localhost:9122", ONBOARDING_API_SECRET: SECRET }), { kind: "none", problem: "insecure_url" });
  assert.deepEqual(resolveBackendConfig({ NODE_ENV: "development", ONBOARDING_API_URL: "http://localhost:9122", ONBOARDING_API_SECRET: SECRET }).kind, "swarm");
  assert.deepEqual(resolveBackendConfig({ NODE_ENV: "production", ONBOARDING_API_URL: "https://swarm.example.com", ONBOARDING_API_SECRET: "short" }), { kind: "none", problem: "weak_secret" });
  assert.deepEqual(resolveBackendConfig({ NODE_ENV: "production", ONBOARDING_API_URL: "https://swarm.example.com", ONBOARDING_API_SECRET: SECRET }), { kind: "swarm", baseUrl: "https://swarm.example.com/", secret: SECRET });
  // A half-configured Swarm doesn't silently fall back to the mock.
  assert.deepEqual(resolveBackendConfig({ NODE_ENV: "development", ONBOARDING_MOCK: "true", ONBOARDING_API_URL: "https://swarm.example.com" }), { kind: "none", problem: "weak_secret" });
});
