import { test } from "node:test";
import assert from "node:assert/strict";
import { flowReducer, initialFlow, isDirty, type FlowAction, type FlowState } from "./flow.ts";
import { completeAnswers } from "./fixtures.ts";

const run = (state: FlowState, ...actions: FlowAction[]) => actions.reduce(flowReducer, state);
const filled = () => ({ ...initialFlow(), answers: completeAnswers() });

test("starts on the welcome screen and opens step 1", () => {
  const s = run(initialFlow({ contactName: "Test Customer" }), { type: "start" });
  assert.deepEqual(s.view, { kind: "step", index: 0 });
  assert.equal(s.answers.contactName, "Test Customer");
});

test("Next is blocked with inline errors until the step is valid, and the answers are kept", () => {
  let s = run(initialFlow(), { type: "start" }, { type: "set", field: "contactName", value: "Test Customer" }, { type: "next" });
  assert.deepEqual(s.view, { kind: "step", index: 0 });
  assert.ok(s.errors.contactEmail && s.errors.jobTitle && s.errors.industry);
  assert.equal(s.errors.contactName, undefined);
  assert.equal(s.answers.contactName, "Test Customer");
  assert.equal(s.attempt, 1);

  s = run(s, { type: "set", field: "contactEmail", value: "not-an-email" }, { type: "next" });
  assert.match(s.errors.contactEmail ?? "", /valid email/);
  assert.equal(s.answers.contactEmail, "not-an-email");
});

test("editing a field clears its error (and the error of its Other companion)", () => {
  let s = run(initialFlow(), { type: "start" }, { type: "next" });
  assert.ok(s.errors.industry);
  s = run(s, { type: "set", field: "industry", value: "other" });
  assert.equal(s.errors.industry, undefined);
});

test("walks all four steps to review; Previous goes back without losing answers", () => {
  let s = run(filled(), { type: "start" }, { type: "next" }, { type: "next" }, { type: "next" });
  assert.deepEqual(s.view, { kind: "step", index: 3 });
  s = run(s, { type: "back" }, { type: "back" });
  assert.deepEqual(s.view, { kind: "step", index: 1 });
  assert.equal(s.answers.processToAutomate, completeAnswers().processToAutomate);
  s = run(s, { type: "next" }, { type: "next" }, { type: "next" });
  assert.deepEqual(s.view, { kind: "review" });
  assert.deepEqual(run(s, { type: "back" }).view, { kind: "step", index: 3 });
  assert.deepEqual(run(filled(), { type: "start" }, { type: "back" }).view, { kind: "welcome" });
});

test("Edit from review opens that step and Next returns straight to review", () => {
  let s = run(filled(), { type: "start" }, { type: "next" }, { type: "next" }, { type: "next" }, { type: "next" });
  assert.equal(s.view.kind, "review");
  s = run(s, { type: "edit", step: 1 });
  assert.deepEqual(s.view, { kind: "step", index: 1 });
  assert.equal(s.returnToReview, true);
  s = run(s, { type: "next" });
  assert.deepEqual(s.view, { kind: "review" });
  assert.equal(s.returnToReview, false);
});

test("submit is a no-op while one is in flight (duplicate submission prevention)", () => {
  let s = run(filled(), { type: "start" }, { type: "next" }, { type: "next" }, { type: "next" }, { type: "next" }, { type: "submitStart" });
  assert.equal(s.submit.status, "submitting");
  const frozen = s;
  for (const a of [{ type: "submitStart" }, { type: "set", field: "contactName", value: "X" }, { type: "back" }, { type: "edit", step: 0 }] as FlowAction[]) {
    s = flowReducer(s, a);
    assert.equal(s, frozen, a.type);
  }
});

test("a failed submission keeps every answer and allows a retry", () => {
  let s = run(filled(), { type: "start" }, { type: "next" }, { type: "next" }, { type: "next" }, { type: "next" }, { type: "submitStart" });
  s = run(s, { type: "submitFailed", message: "Network problem" });
  assert.equal(s.submit.status, "error");
  assert.equal(s.view.kind, "review");
  assert.deepEqual(s.answers, completeAnswers());
  assert.equal(run(s, { type: "submitStart" }).submit.status, "submitting");
});

test("server field errors send the customer to the first affected step", () => {
  let s = run(filled(), { type: "start" }, { type: "next" }, { type: "next" }, { type: "next" }, { type: "next" }, { type: "submitStart" });
  s = run(s, { type: "submitFailed", message: "Fix", fieldErrors: { approverEmail: "Bad", successCriteria: "Short" } });
  assert.deepEqual(s.view, { kind: "step", index: 2 });
  assert.equal(s.returnToReview, true);
  assert.equal(s.errors.approverEmail, "Bad");
});

test("submitting an incomplete questionnaire from review routes to the first invalid step instead", () => {
  let s = run(filled(), { type: "start" }, { type: "next" }, { type: "next" }, { type: "next" }, { type: "next" });
  s = { ...s, answers: { ...s.answers, jobTitle: "" } };
  s = run(s, { type: "submitStart" });
  assert.equal(s.submit.status, "idle");
  assert.deepEqual(s.view, { kind: "step", index: 0 });
  assert.ok(s.errors.jobTitle);
});

test("isDirty ignores the prefilled values", () => {
  const prefill = { contactName: "Test Customer" };
  const s = initialFlow(prefill);
  assert.equal(isDirty(s, prefill), false);
  assert.equal(isDirty(run(s, { type: "set", field: "jobTitle", value: "Owner" }), prefill), true);
});
