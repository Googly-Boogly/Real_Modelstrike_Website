import { test } from "node:test";
import assert from "node:assert/strict";
import { analysisJsonSchema, validateAnalysis, validateIntakeEmail } from "./schema.ts";

const email = {
  fromName: "Sarah  Mitchell",
  fromEmail: "Sarah@Example.com",
  subject: "Air Conditioner Not Working",
  body: "My air conditioner stopped cooling yesterday.\r\nCan someone come Wednesday?",
};

const analysis = {
  isServiceRequest: true,
  customerName: "Sarah Mitchell",
  email: "sarah@example.com",
  phone: "612-555-0147",
  location: "Minneapolis",
  serviceType: "Air Conditioning Repair",
  problem: "AC stopped cooling",
  preferredAppointment: "Wednesday afternoon",
  priority: "Normal",
  summary: "Sarah's AC stopped cooling.",
  replySubject: "Re: Air Conditioner Not Working",
  replyBody: "Hi Sarah,\n\nThanks for reaching out.\n\nBest regards,\nCustomer Service Team",
};

test("accepts and normalises a valid intake email", () => {
  const r = validateIntakeEmail(email);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.fromName, "Sarah Mitchell");
    assert.equal(r.data.fromEmail, "sarah@example.com");
    assert.equal(r.data.body, "My air conditioner stopped cooling yesterday.\nCan someone come Wednesday?");
  }
});

test("rejects short, oversized and malformed intake emails", () => {
  assert.equal(validateIntakeEmail({ ...email, body: "too short" }).ok, false);
  assert.equal(validateIntakeEmail({ ...email, body: "x".repeat(3001) }).ok, false);
  assert.equal(validateIntakeEmail({ ...email, subject: "x".repeat(201) }).ok, false);
  assert.equal(validateIntakeEmail({ ...email, fromEmail: "not-an-email" }).ok, false);
  assert.equal(validateIntakeEmail({ ...email, fromName: "" }).ok, false);
  assert.equal(validateIntakeEmail({ ...email, body: ["array"] }).ok, false);
  assert.equal(validateIntakeEmail({}).ok, false);
});

test("accepts a well-formed analysis", () => {
  const r = validateAnalysis(analysis);
  assert.ok(r);
  assert.equal(r.customerName, "Sarah Mitchell");
  assert.equal(r.replyBody.includes("\n"), true);
});

test("keeps missing fields as null and normalises placeholders to null", () => {
  const r = validateAnalysis({ ...analysis, phone: null, location: "Not provided", preferredAppointment: "N/A", email: "  " });
  assert.ok(r);
  assert.equal(r.phone, null);
  assert.equal(r.location, null);
  assert.equal(r.preferredAppointment, null);
  assert.equal(r.email, null);
});

test("rejects analyses that don't match the schema", () => {
  assert.equal(validateAnalysis(null), null);
  assert.equal(validateAnalysis([]), null);
  assert.equal(validateAnalysis({ ...analysis, priority: "Urgent" }), null);
  assert.equal(validateAnalysis({ ...analysis, isServiceRequest: "yes" }), null);
  assert.equal(validateAnalysis({ ...analysis, phone: 6125550147 }), null);
  assert.equal(validateAnalysis({ ...analysis, summary: "" }), null);
  assert.equal(validateAnalysis({ ...analysis, replyBody: "x".repeat(3001) }), null);
  assert.equal(validateAnalysis({ ...analysis, problem: "x".repeat(201) }), null);
  const missing: Record<string, unknown> = { ...analysis };
  delete missing.summary;
  assert.equal(validateAnalysis(missing), null);
});

test("JSON schema requires every property and allows no extras", () => {
  assert.deepEqual([...analysisJsonSchema.required].sort(), Object.keys(analysisJsonSchema.properties).sort());
  assert.equal(analysisJsonSchema.additionalProperties, false);
});
