import { test } from "node:test";
import assert from "node:assert/strict";
import { getIndustry, industries } from "./industries.ts";
import { composeInquiry, extractionJsonSchema, validateDraftRequest, validateDraft, validateExtraction, validateIntakeRequest } from "./schema.ts";

const hvac = getIndustry("hvac")!;
const valid = {
  is_customer_inquiry: true,
  request_type: "cooling_repair",
  summary: "AC stopped cooling.",
  signals: ["service_outage"],
  fields: { customer_name: "Sarah Johnson", email: null, phone: null, service_requested: "AC Repair", problem: "Not cooling", location: "Minneapolis", preferred_time: null },
};

test("accepts and normalises a valid request", () => {
  const r = validateIntakeRequest({ industry: "hvac", message: "  My AC stopped cooling.\r\nCan someone help?\u0000 " });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.industry.id, "hvac");
    assert.equal(r.data.message, "My AC stopped cooling.\nCan someone help?");
  }
});

test("rejects empty, short, oversized and malformed requests", () => {
  assert.equal(validateIntakeRequest({ industry: "hvac", message: "" }).ok, false);
  assert.equal(validateIntakeRequest({ industry: "hvac", message: "too short" }).ok, false);
  assert.equal(validateIntakeRequest({ industry: "hvac", message: "x".repeat(3001) }).ok, false);
  assert.equal(validateIntakeRequest({ industry: "hvac", message: ["array"] }).ok, false);
  assert.equal(validateIntakeRequest({ industry: "__proto__", message: "x".repeat(50) }).ok, false);
  assert.equal(validateIntakeRequest({ message: "x".repeat(50) }).ok, false);
  assert.equal(validateIntakeRequest(null).ok, false);
});

test("accepts a well-formed extraction and turns placeholders into null", () => {
  const r = validateExtraction({ ...valid, fields: { ...valid.fields, location: "Not provided", phone: "N/A", email: "  " } }, hvac);
  assert.ok(r);
  assert.equal(r.fields.customer_name, "Sarah Johnson");
  assert.equal(r.fields.location, null);
  assert.equal(r.fields.phone, null);
  assert.equal(r.fields.email, null);
});

test("rejects malformed extractions", () => {
  assert.equal(validateExtraction(null, hvac), null);
  assert.equal(validateExtraction([], hvac), null);
  assert.equal(validateExtraction({ ...valid, request_type: "made_up" }, hvac), null);
  assert.equal(validateExtraction({ ...valid, is_customer_inquiry: "yes" }, hvac), null);
  assert.equal(validateExtraction({ ...valid, signals: ["panic"] }, hvac), null);
  assert.equal(validateExtraction({ ...valid, summary: "" }, hvac), null);
  assert.equal(validateExtraction({ ...valid, fields: { ...valid.fields, phone: 6125550147 } }, hvac), null);
  assert.equal(validateExtraction({ ...valid, fields: { ...valid.fields, problem: "x".repeat(201) } }, hvac), null);
  const incomplete: Record<string, unknown> = { ...valid.fields };
  delete incomplete.location;
  assert.equal(validateExtraction({ ...valid, fields: incomplete }, hvac), null);
});

test("ignores extra keys rather than passing them through", () => {
  const r = validateExtraction({ ...valid, secret: "x", fields: { ...valid.fields, secret: "x" } }, hvac);
  assert.ok(r);
  assert.equal("secret" in r, false);
  assert.equal("secret" in r.fields, false);
});

test("validates drafts", () => {
  assert.deepEqual(validateDraft({ subject: " Hi ", body: "Hello\nthere" }), { subject: "Hi", body: "Hello\nthere", source: "ai" });
  assert.equal(validateDraft({ subject: "", body: "x" }), null);
  assert.equal(validateDraft({ subject: "x", body: "x".repeat(3001) }), null);
  assert.equal(validateDraft("nope"), null);
});

test("every industry yields a strict schema from one configuration shape", () => {
  for (const i of industries) {
    const s = extractionJsonSchema(i);
    assert.equal(s.additionalProperties, false);
    assert.deepEqual([...s.required].sort(), Object.keys(s.properties).sort());
    assert.deepEqual(s.properties.fields.required.sort(), i.fields.map((f) => f.key).sort());
    assert.equal(s.properties.fields.additionalProperties, false);
    assert.ok(i.categories.some((c) => c.id === "other"), `${i.id} needs a catch-all category`);
  }
});

test("optional sender details are validated and composed into the processed text", () => {
  const r = validateIntakeRequest({ industry: "hvac", message: "My AC stopped cooling this morning.", customer_name: " Sarah  Johnson ", customer_email: "sarah@example.com", subject: "AC down" });
  assert.ok(r.ok);
  assert.equal(r.data.message, "From: Sarah Johnson <sarah@example.com>\nSubject: AC down\n\nMy AC stopped cooling this morning.");
  assert.equal(composeInquiry({ email: "a@example.com", body: "x" }), "From: a@example.com\n\nx");
  assert.equal(composeInquiry({ body: "  just the body " }), "just the body");

  const base = { industry: "hvac", message: "My AC stopped cooling this morning." };
  assert.equal(validateIntakeRequest({ ...base, customer_email: "not-an-email" }).ok, false);
  assert.equal(validateIntakeRequest({ ...base, customer_email: "" }).ok, true);
  assert.equal(validateIntakeRequest({ ...base, customer_name: "x".repeat(81) }).ok, false);
  assert.equal(validateIntakeRequest({ ...base, subject: "x".repeat(151) }).ok, false);
  assert.equal(validateIntakeRequest({ ...base, customer_name: { $ne: 1 } }).ok, false);
});

test("a regenerate request needs a valid extraction", () => {
  const base = { industry: "hvac", message: "My AC stopped cooling this morning." };
  assert.equal(validateDraftRequest({ ...base, extraction: valid }).ok, true);
  assert.equal(validateDraftRequest({ ...base }).ok, false);
  assert.equal(validateDraftRequest({ ...base, extraction: { ...valid, request_type: "hack" } }).ok, false);
  assert.equal(validateDraftRequest({ ...base, extraction: { ...valid, fields: { ...valid.fields, phone: 5 } } }).ok, false);
});
