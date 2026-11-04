import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../contact/rate-limit.ts";
import type { OnboardingBackend } from "./backend.ts";
import { completeAnswers } from "./fixtures.ts";
import { COOKIE_DEV, COOKIE_SECURE, createOnboardingHandlers, defaultLimiters } from "./handlers.ts";
import { MOCK_CODE, mockBackend, mockTokens, newStore } from "./mock.ts";

const ORIGIN = "https://modelstrike.ai";
const KEY = "3f1c2a8e-5b7d-4c1e-9a2b-1234567890ab";

function setup({ backend = mockBackend({ store: newStore() }) as OnboardingBackend | null, secure = true, limiters = defaultLimiters() } = {}) {
  const logs: string[] = [];
  const h = createOnboardingHandlers({ getBackend: () => backend, secureCookies: secure, limiters, log: (l) => logs.push(l) });
  let cookie = "";
  const name = secure ? COOKIE_SECURE : COOKIE_DEV;
  const req = (method: "GET" | "POST", path: string, body?: unknown, headers: Record<string, string> = {}) =>
    new Request(`${ORIGIN}/api/customer-onboarding${path}`, {
      method,
      headers: { host: "modelstrike.ai", origin: ORIGIN, "x-forwarded-for": "203.0.113.7", ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie: `${name}=${cookie}` } : {}), ...headers },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
  const remember = (res: Response) => {
    const set = res.headers.get("set-cookie") ?? "";
    const m = set.match(new RegExp(`${name}=([^;]*)`));
    if (m) cookie = m[1];
    return res;
  };
  return {
    h,
    logs,
    get cookie() {
      return cookie;
    },
    exchange: async (token: string) => remember(await h.session(req("POST", "/session", { token }))),
    project: async () => remember(await h.project(req("GET", "/project"))),
    send: async () => remember(await h.sendCode(req("POST", "/verification/send", {}))),
    confirm: async (code: string) => remember(await h.confirmCode(req("POST", "/verification/confirm", { code }))),
    submit: async (body: unknown, headers?: Record<string, string>) => remember(await h.submit(req("POST", "/submit", body, headers))),
    req,
  };
}

test("a valid invitation sets a Secure, HttpOnly, SameSite=Strict __Host- cookie and loads the project", async () => {
  const t = setup();
  const res = await t.exchange(mockTokens.valid);
  assert.equal(res.status, 200);
  const set = res.headers.get("set-cookie") ?? "";
  assert.match(set, /^__Host-ms_onboarding=[A-Za-z0-9_-]{40,}; Max-Age=\d+; Path=\/; HttpOnly; SameSite=Strict; Secure$/);
  assert.equal(res.headers.get("cache-control"), "no-store, max-age=0");
  const body = await res.json();
  assert.deepEqual(body.verification, { required: false, maskedEmail: null });
  assert.ok(!JSON.stringify(body).includes(t.cookie), "session token is never in the response body");

  const p = await t.project();
  assert.equal(p.status, 200);
  const { project } = await p.json();
  assert.equal(project.company, "ABC Heating & Cooling");
  assert.equal(project.projectName, "AI Customer Intake Automation");
  assert.equal(project.contact.name, "Test Customer");
  assert.equal(project.status, "open");
});

test("invalid, malformed, expired and revoked invitations are refused without a session", async () => {
  const t = setup();
  for (const [token, code, status] of [
    ["definitely_not_a_real_token_123", "invalid_link", 401],
    ["short", "invalid_link", 401],
    ["../../etc/passwd?x=<script>", "invalid_link", 401],
    [mockTokens.expired, "expired_link", 410],
    [mockTokens.revoked, "revoked_link", 410],
  ] as const) {
    const res = await t.exchange(token);
    assert.equal(res.status, status, token);
    assert.equal((await res.json()).code, code, token);
  }
  assert.equal(t.cookie, "");
  assert.equal((await t.project()).status, 401);
});

test("an unknown invitation and a malformed one look identical, revealing nothing about customers", async () => {
  const t = setup();
  const a = await (await t.exchange("unknown_token_but_well_formed_1")).json();
  const b = await (await t.exchange("x")).json();
  assert.deepEqual(a, b);
  assert.deepEqual(Object.keys(a).sort(), ["code", "ok"]);
});

test("missing session → 401 no_session", async () => {
  const t = setup();
  const res = await t.project();
  assert.equal(res.status, 401);
  assert.equal((await res.json()).code, "no_session");
});

test("the session token must be HttpOnly cookie-borne; a header or query parameter isn't accepted", async () => {
  const t = setup();
  await t.exchange(mockTokens.valid);
  const session = t.cookie;
  const t2 = setup();
  const res = await t2.h.project(t2.req("GET", `/project?session=${session}`, undefined, { "x-onboarding-session": session }));
  assert.equal(res.status, 401);
});

test("writes must be same-origin JSON (CSRF)", async () => {
  const t = setup();
  assert.equal((await t.h.session(t.req("POST", "/session", { token: mockTokens.valid }, { origin: "https://evil.example" }))).status, 403);
  const noOrigin = new Request(`${ORIGIN}/api/customer-onboarding/session`, { method: "POST", headers: { host: "modelstrike.ai", "content-type": "application/json" }, body: JSON.stringify({ token: mockTokens.valid }) });
  assert.equal((await t.h.session(noOrigin)).status, 403);
  assert.equal((await t.h.session(t.req("POST", "/session", "token=x", { "content-type": "application/x-www-form-urlencoded" }))).status, 415);
  assert.equal((await t.h.session(t.req("POST", "/session", "x".repeat(5000)))).status, 413);
  assert.equal((await t.h.session(t.req("POST", "/session", { token: mockTokens.valid, projectId: "p1" }))).status, 401);
});

test("email verification gates the project until the code is confirmed", async () => {
  const t = setup();
  const ex = await (await t.exchange(mockTokens.verify)).json();
  assert.equal(ex.verification.required, true);
  assert.equal(ex.verification.maskedEmail, "t•••@example.com");
  const blocked = await t.project();
  assert.equal(blocked.status, 403);
  assert.equal((await blocked.json()).code, "verification_required");

  assert.equal((await t.send()).status, 200);
  const wrong = await t.confirm("000000");
  assert.equal(wrong.status, 400);
  assert.deepEqual(await wrong.json(), { ok: false, code: "invalid_code", attemptsRemaining: 4 });
  assert.equal((await t.confirm("12ab56")).status, 400);
  assert.equal((await t.confirm(MOCK_CODE)).status, 200);
  assert.equal((await t.project()).status, 200);
});

test("submission saves once; a double click replays the same result instead of creating a duplicate", async () => {
  const t = setup();
  await t.exchange(mockTokens.valid);
  const body = { answers: completeAnswers(), idempotencyKey: KEY };
  const [a, b] = await Promise.all([t.submit(body), t.submit(body)]);
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  const ja = await a.json();
  const jb = await b.json();
  assert.equal(ja.submittedAt, jb.submittedAt);

  // A different attempt (new key) is told it's already submitted.
  const again = await t.submit({ ...body, idempotencyKey: "9a1c2a8e-5b7d-4c1e-9a2b-1234567890ab" });
  assert.equal(again.status, 409);
  const j = await again.json();
  assert.equal(j.code, "already_submitted");
  assert.equal(j.submittedAt, ja.submittedAt);

  const p = await (await t.project()).json();
  assert.equal(p.project.status, "submitted");
});

test("an already-submitted project reports its status", async () => {
  const t = setup();
  await t.exchange(mockTokens.submitted);
  const { project } = await (await t.project()).json();
  assert.equal(project.status, "submitted");
  assert.ok(project.submittedAt);
});

test("submission is validated server-side: field errors, unexpected fields, bad idempotency key", async () => {
  const t = setup();
  await t.exchange(mockTokens.valid);
  const bad = await t.submit({ answers: { ...completeAnswers(), contactEmail: "nope", successCriteria: "" }, idempotencyKey: KEY });
  assert.equal(bad.status, 422);
  const j = await bad.json();
  assert.ok(j.fieldErrors.contactEmail && j.fieldErrors.successCriteria);

  assert.equal((await t.submit({ answers: { ...completeAnswers(), projectId: "another-project" }, idempotencyKey: KEY })).status, 422);
  assert.equal((await t.submit({ answers: completeAnswers(), idempotencyKey: KEY, projectId: "another-project" })).status, 400);
  assert.equal((await t.submit({ answers: completeAnswers(), idempotencyKey: "1" })).status, 400);
  assert.equal((await t.submit({ answers: completeAnswers() })).status, 400);
});

test("submission without a session is unauthorized", async () => {
  const t = setup();
  const res = await t.submit({ answers: completeAnswers(), idempotencyKey: KEY });
  assert.equal(res.status, 401);
});

test("the payload sent to the Swarm is the validated, normalised one, with the session and idempotency key", async () => {
  const seen: { session: string; key: string; payload: unknown }[] = [];
  const inner = mockBackend({ store: newStore() });
  const spy: OnboardingBackend = { ...inner, name: "mock", submit: async (s, payload, key, ctx) => (seen.push({ session: s, key, payload }), inner.submit(s, payload, key, ctx)) };
  const t = setup({ backend: spy });
  await t.exchange(mockTokens.valid);
  await t.submit({ answers: { ...completeAnswers(), contactName: "  Test   Customer " }, idempotencyKey: KEY.toUpperCase() });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].session, t.cookie);
  assert.equal(seen[0].key, KEY);
  assert.equal((seen[0].payload as { contact: { full_name: string } }).contact.full_name, "Test Customer");
});

test("an expired session clears the cookie", async () => {
  let now = Date.now();
  const backend = mockBackend({ store: newStore(), now: () => now, sessionTtlMs: 60_000 });
  const t = setup({ backend });
  await t.exchange(mockTokens.valid);
  now += 61_000;
  const res = await t.project();
  assert.equal(res.status, 401);
  assert.equal((await res.json()).code, "session_expired");
  assert.match(res.headers.get("set-cookie") ?? "", /Max-Age=0/);
});

test("no backend configured → 503 not_configured, never a fake success", async () => {
  const t = setup({ backend: null });
  const res = await t.exchange(mockTokens.valid);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).code, "not_configured");
  assert.equal((await t.submit({ answers: completeAnswers(), idempotencyKey: KEY })).status, 503);
});

test("invitation exchange is rate limited per IP", async () => {
  const limiters = { ...defaultLimiters(), session: createRateLimiter({ limit: 3, windowMs: 60_000 }) };
  const t = setup({ limiters });
  for (let i = 0; i < 3; i++) assert.equal((await t.exchange("unknown_token_but_well_formed_" + i)).status, 401);
  const res = await t.exchange(mockTokens.valid);
  assert.equal(res.status, 429);
  assert.ok(Number(res.headers.get("retry-after")) > 0);
});

test("logs never contain tokens, sessions or answers", async () => {
  const t = setup();
  await t.exchange(mockTokens.valid);
  await t.exchange("unknown_token_but_well_formed_x");
  await t.submit({ answers: completeAnswers(), idempotencyKey: KEY });
  const all = t.logs.join("\n");
  for (const secret of [mockTokens.valid, "unknown_token_but_well_formed_x", t.cookie, "Test Customer", "example.com", "re-typed"]) assert.ok(!all.includes(secret), secret);
});

test("plain-http development uses a non-Secure, non-prefixed cookie", async () => {
  const t = setup({ secure: false });
  const res = await t.exchange(mockTokens.valid);
  const set = res.headers.get("set-cookie") ?? "";
  assert.match(set, /^ms_onboarding=/);
  assert.ok(!set.includes("Secure"));
  assert.equal((await t.project()).status, 200);
});
