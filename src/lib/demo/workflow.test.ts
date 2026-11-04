import { test } from "node:test";
import assert from "node:assert/strict";
import { previews } from "../../content/intake-previews.ts";
import { getIndustry } from "../intake/industries.ts";
import { classify } from "../intake/rules.ts";
import { composeInquiry, type Draft, type IntakeEvent } from "../intake/schema.ts";
import { templateDraft } from "../intake/templates.ts";
import { CUSTOM_ID, currentDraft, initialWorkflow, MAX_REGENERATIONS, phaseOf, workflowReducer, type WorkflowAction, type WorkflowState } from "./workflow.ts";

const hvac = getIndustry("hvac")!;
const sample = hvac.samples[0];
const extraction = previews[sample.id];
const classification = classify(hvac, extraction, composeInquiry(sample));
const draft: Draft = { subject: "Re: your AC", body: "Hi Sarah,\n\nWe'll review and follow up.\n\nBest regards,\nCustomer Service Team", source: "ai" };

const apply = (state: WorkflowState, ...actions: WorkflowAction[]) => actions.reduce(workflowReducer, state);
const liveRun = (runId: number, itemId = sample.id): WorkflowAction[] => {
  const events: IntakeEvent[] = [{ type: "received" }, { type: "extraction", data: extraction }, { type: "classification", data: classification }, { type: "draft", data: draft }, { type: "complete", processing_mode: "live_ai" }];
  return [{ type: "run_start", itemId, runId }, ...events.map((event) => ({ type: "run_event" as const, runId, event }))];
};
const start = initialWorkflow("hvac");

test("idle → request_selected → processing → review_ready → approved", () => {
  assert.equal(phaseOf(start), "idle");
  let s = apply(start, { type: "select", itemId: sample.id });
  assert.equal(phaseOf(s), "request_selected");
  s = apply(s, { type: "run_start", itemId: sample.id, runId: 1 });
  assert.equal(phaseOf(s), "processing");
  s = apply(s, ...liveRun(1).slice(1));
  assert.equal(phaseOf(s), "review_ready");
  assert.equal(s.activeRun, null);
  const r = s.results[sample.id];
  assert.equal(r.mode, "live");
  assert.equal(r.extraction?.fields.customer_name, "Sarah Johnson");
  assert.equal(r.classification?.priority, "Review Soon");
  assert.equal(r.draft?.subject, "Re: your AC");
  s = apply(s, { type: "approve", itemId: sample.id });
  assert.equal(phaseOf(s), "approved");
});

test("edits are kept, approval uses them, and an empty draft can't be approved", () => {
  let s = apply(start, ...liveRun(1));
  s = apply(s, { type: "edit", itemId: sample.id, subject: "Edited", body: "New body" });
  assert.deepEqual(currentDraft(s.results[sample.id]), { subject: "Edited", body: "New body" });
  s = apply(s, { type: "approve", itemId: sample.id });
  assert.equal(phaseOf(s), "approved");
  // Editing an approved draft needs a fresh decision.
  s = apply(s, { type: "edit", itemId: sample.id, subject: "Edited", body: "   " });
  assert.equal(phaseOf(s), "review_ready");
  s = apply(s, { type: "approve", itemId: sample.id });
  assert.equal(phaseOf(s), "review_ready");
});

test("rejection records an optional reason, and reopening returns to review", () => {
  let s = apply(start, ...liveRun(1), { type: "reject", itemId: sample.id, reason: "  Too formal  " });
  assert.equal(phaseOf(s), "rejected");
  assert.equal(s.results[sample.id].rejectionReason, "Too formal");
  s = apply(s, { type: "reopen", itemId: sample.id });
  assert.equal(phaseOf(s), "review_ready");
  assert.equal(s.results[sample.id].rejectionReason, null);
  s = apply(s, { type: "reject", itemId: sample.id, reason: "" });
  assert.equal(s.results[sample.id].rejectionReason, null);
});

test("approval and rejection aren't possible while processing", () => {
  let s = apply(start, { type: "run_start", itemId: sample.id, runId: 1 }, { type: "run_event", runId: 1, event: { type: "draft", data: draft } });
  s = apply(s, { type: "approve", itemId: sample.id }, { type: "reject", itemId: sample.id, reason: "" });
  assert.equal(phaseOf(s), "processing");
});

test("errors keep earlier stages and can be retried", () => {
  let s = apply(start, { type: "run_start", itemId: sample.id, runId: 1 }, { type: "run_event", runId: 1, event: { type: "received" } }, { type: "run_event", runId: 1, event: { type: "extraction", data: extraction } });
  s = apply(s, { type: "run_event", runId: 1, event: { type: "error", stage: "draft", code: "timeout", message: "Took too long", retryable: true } });
  assert.equal(phaseOf(s), "error");
  assert.equal(s.results[sample.id].failure?.stage, "draft");
  assert.ok(s.results[sample.id].extraction);
  assert.equal(s.activeRun, null);
  s = apply(s, ...liveRun(2));
  assert.equal(phaseOf(s), "review_ready");

  const lost = apply(start, { type: "run_start", itemId: sample.id, runId: 3 }, { type: "run_fail", runId: 3, failure: { stage: "received", message: "Offline", retryable: true } });
  assert.equal(phaseOf(lost), "error");
});

test("a stream that ends without a draft is an error, not a success", () => {
  const s = apply(start, { type: "run_start", itemId: sample.id, runId: 1 }, { type: "run_event", runId: 1, event: { type: "complete", processing_mode: "live_ai" } });
  assert.equal(phaseOf(s), "error");
});

test("stale responses never overwrite a newer state", () => {
  // Industry switch mid-run: late events are dropped.
  let s = apply(start, { type: "run_start", itemId: sample.id, runId: 1 }, { type: "industry", industryId: "accounting" });
  s = apply(s, ...liveRun(1).slice(1));
  assert.deepEqual(s, initialWorkflow("accounting"));

  // Reset mid-run.
  s = apply(start, { type: "run_start", itemId: sample.id, runId: 1 }, { type: "reset" }, ...liveRun(1).slice(1));
  assert.equal(phaseOf(s), "idle");

  // A regeneration from an earlier run is ignored after reprocessing.
  s = apply(start, ...liveRun(1), { type: "regen_start", itemId: sample.id }, ...liveRun(2));
  s = apply(s, { type: "regen_done", itemId: sample.id, runId: 1, draft: { ...draft, subject: "stale" } });
  assert.equal(s.results[sample.id].draft?.subject, "Re: your AC");
});

test("only one run at a time; other items keep their own results", () => {
  const other = hvac.samples[1].id;
  let s = apply(start, { type: "run_start", itemId: sample.id, runId: 1 }, { type: "run_start", itemId: other, runId: 2 });
  assert.equal(s.activeRun?.runId, 1);
  assert.equal(s.results[other], undefined);
  // Browsing to another item while processing doesn't move the results.
  s = apply(s, { type: "select", itemId: other }, ...liveRun(1).slice(1));
  assert.equal(phaseOf(s), "request_selected");
  assert.equal(s.results[sample.id].status, "review_ready");
});

test("regenerate replaces the draft, clears edits, and is capped", () => {
  let s = apply(start, ...liveRun(1), { type: "edit", itemId: sample.id, subject: "x", body: "y" });
  for (let i = 0; i < MAX_REGENERATIONS + 1; i += 1) {
    s = apply(s, { type: "regen_start", itemId: sample.id }, { type: "regen_done", itemId: sample.id, runId: 1, draft: { ...draft, subject: `v${i}` } });
  }
  const r = s.results[sample.id];
  assert.equal(r.regenerations, MAX_REGENERATIONS);
  assert.equal(r.draft?.subject, `v${MAX_REGENERATIONS - 1}`);
  assert.equal(r.edited, null);

  const failed = apply(start, ...liveRun(1), { type: "regen_start", itemId: sample.id }, { type: "regen_fail", itemId: sample.id, runId: 1, message: "Busy" });
  assert.equal(failed.results[sample.id].regenError, "Busy");
  assert.equal(failed.results[sample.id].draft?.subject, "Re: your AC", "the previous draft stays");
});

test("simulated examples are labelled and can't be regenerated", () => {
  const s = apply(start, { type: "simulated", itemId: sample.id, runId: 1, extraction, classification, draft: templateDraft(hvac, extraction, classification) }, { type: "regen_start", itemId: sample.id });
  const r = s.results[sample.id];
  assert.equal(r.mode, "simulated");
  assert.equal(r.status, "review_ready");
  assert.equal(r.regenerating, false);
});

test("a custom request is its own inbox item and replaces the previous one", () => {
  const item = { id: "ignored", name: "Pat", email: null, subject: "Help", receivedAt: "Now", body: "My heat pump is making a loud noise." };
  let s = apply(start, { type: "custom", item }, ...liveRun(1, CUSTOM_ID));
  assert.equal(s.custom?.id, CUSTOM_ID);
  assert.equal(phaseOf(s), "review_ready");
  s = apply(s, { type: "custom", item: { ...item, body: "Different message entirely." } });
  assert.equal(phaseOf(s), "request_selected");
  assert.equal(s.custom?.body, "Different message entirely.");
});

test("reset and industry change return to idle", () => {
  const s = apply(start, ...liveRun(1), { type: "approve", itemId: sample.id });
  assert.deepEqual(apply(s, { type: "reset" }), initialWorkflow("hvac"));
  assert.deepEqual(apply(s, { type: "industry", industryId: "property" }), initialWorkflow("property"));
});
