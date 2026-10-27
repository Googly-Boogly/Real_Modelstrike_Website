import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPlainText, validateContact } from "./schema.ts";
import { createRateLimiter } from "./rate-limit.ts";

const valid = {
  name: "  Jordan   Rivera ",
  email: "Jordan@Example.com",
  company: "Example Heating",
  industry: "HVAC",
  message: "We re-type every service email into our job software.",
};

test("accepts and normalises a valid submission", () => {
  const r = validateContact(valid);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.name, "Jordan Rivera");
    assert.equal(r.data.email, "jordan@example.com");
  }
});

test("industry is optional", () => {
  assert.equal(validateContact({ ...valid, industry: "" }).ok, true);
});

test("rejects missing required fields", () => {
  const r = validateContact({});
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["company", "email", "message", "name"]);
});

test("rejects invalid email, unknown industry, short and oversized message", () => {
  for (const email of ["nope", "a@b", "a b@c.com", "a@.com"]) {
    assert.equal(validateContact({ ...valid, email }).ok, false, email);
  }
  assert.equal(validateContact({ ...valid, industry: "<script>" }).ok, false);
  assert.equal(validateContact({ ...valid, message: "hi" }).ok, false);
  assert.equal(validateContact({ ...valid, message: "x".repeat(4001) }).ok, false);
});

test("ignores non-string input and strips control characters", () => {
  assert.equal(validateContact({ ...valid, name: ["array"] }).ok, false);
  const r = validateContact({ ...valid, company: "Acme\u0000\nCo", message: "Line one\nLine two\u0007 ok" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.company, "Acme Co");
    assert.equal(r.data.message, "Line one\nLine two ok");
  }
});

test("plain-text formatting includes every field", () => {
  const r = validateContact(valid);
  assert.ok(r.ok);
  const text = formatPlainText(r.data, "2026-01-01T00:00:00Z");
  for (const part of ["Jordan Rivera", "jordan@example.com", "Example Heating", "HVAC", "job software"]) assert.ok(text.includes(part), part);
});

test("rate limiter allows up to the limit per window, then resets", () => {
  const rl = createRateLimiter({ limit: 2, windowMs: 1000 });
  assert.equal(rl.check("ip", 0).allowed, true);
  assert.equal(rl.check("ip", 10).allowed, true);
  const blocked = rl.check("ip", 20);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, 980);
  assert.equal(rl.check("other", 20).allowed, true);
  assert.equal(rl.check("ip", 1000).allowed, true);
});

test("rate limiter fails closed when the key table is full", () => {
  const rl = createRateLimiter({ limit: 5, windowMs: 1000, maxKeys: 2 });
  rl.check("a", 0);
  rl.check("b", 0);
  assert.equal(rl.check("c", 0).allowed, false);
  assert.equal(rl.check("c", 1000).allowed, true);
});
