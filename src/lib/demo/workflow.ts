// The /demo workflow as a pure reducer, so every component reads one source of
// truth and the transitions can be tested without a browser.
//
//   idle → request_selected → processing → review_ready → approved / rejected
//                                  ↘ error (retry → processing)
//
// Each processed inbox item keeps its own result, so visitors can work through
// several requests. Every run carries an id; events from a run that is no longer
// current (reset, industry change, reprocessing) are ignored, so a slow response
// can never overwrite a newer selection.

import type { InboxSample } from "../intake/industries.ts";
import type { Classification, Draft, Extraction, IntakeEvent, Stage } from "../intake/schema.ts";

export const CUSTOM_ID = "custom";
export const MAX_REGENERATIONS = 3;

export type InboxItem = InboxSample & { custom?: boolean };
export type RunMode = "live" | "simulated";
export type Failure = { stage: Stage; message: string; retryable: boolean };
export type ItemStatus = "processing" | "review_ready" | "approved" | "rejected" | "error";
export type Phase = "idle" | "request_selected" | ItemStatus;

export type ItemResult = {
  runId: number;
  mode: RunMode;
  status: ItemStatus;
  received: boolean;
  extraction: Extraction | null;
  classification: Classification | null;
  draft: Draft | null;
  /** The employee's edits to the current draft, if any. */
  edited: { subject: string; body: string } | null;
  failure: Failure | null;
  rejectionReason: string | null;
  regenerations: number;
  regenerating: boolean;
  regenError: string | null;
};

export type WorkflowState = {
  industryId: string;
  selectedId: string | null;
  custom: InboxItem | null;
  results: Record<string, ItemResult>;
  activeRun: { runId: number; itemId: string } | null;
};

export type WorkflowAction =
  | { type: "industry"; industryId: string }
  | { type: "select"; itemId: string }
  | { type: "custom"; item: InboxItem }
  | { type: "run_start"; itemId: string; runId: number }
  | { type: "run_event"; runId: number; event: IntakeEvent }
  | { type: "run_fail"; runId: number; failure: Failure }
  | { type: "simulated"; itemId: string; runId: number; extraction: Extraction; classification: Classification; draft: Draft }
  | { type: "edit"; itemId: string; subject: string; body: string }
  | { type: "approve"; itemId: string }
  | { type: "reject"; itemId: string; reason: string }
  | { type: "reopen"; itemId: string }
  | { type: "regen_start"; itemId: string }
  | { type: "regen_done"; itemId: string; runId: number; draft: Draft }
  | { type: "regen_fail"; itemId: string; runId: number; message: string }
  | { type: "reset" };

export function initialWorkflow(industryId: string): WorkflowState {
  return { industryId, selectedId: null, custom: null, results: {}, activeRun: null };
}

const blank = (runId: number, mode: RunMode): ItemResult => ({
  runId,
  mode,
  status: "processing",
  received: false,
  extraction: null,
  classification: null,
  draft: null,
  edited: null,
  failure: null,
  rejectionReason: null,
  regenerations: 0,
  regenerating: false,
  regenError: null,
});

function update(state: WorkflowState, itemId: string, change: (r: ItemResult) => ItemResult | null): WorkflowState {
  const current = state.results[itemId];
  if (!current) return state;
  const next = change(current);
  return next ? { ...state, results: { ...state.results, [itemId]: next } } : state;
}

const reviewable = (r: ItemResult) => r.draft !== null && r.status !== "processing" && !r.regenerating;

export function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case "industry":
      return initialWorkflow(action.industryId);

    case "reset":
      return initialWorkflow(state.industryId);

    case "select":
      return { ...state, selectedId: action.itemId };

    case "custom": {
      // A new custom message replaces the old one and its results.
      const results = { ...state.results };
      delete results[CUSTOM_ID];
      const activeRun = state.activeRun?.itemId === CUSTOM_ID ? null : state.activeRun;
      return { ...state, custom: { ...action.item, id: CUSTOM_ID, custom: true }, selectedId: CUSTOM_ID, results, activeRun };
    }

    case "run_start":
      if (state.activeRun) return state; // one run at a time
      return {
        ...state,
        selectedId: action.itemId,
        activeRun: { runId: action.runId, itemId: action.itemId },
        results: { ...state.results, [action.itemId]: blank(action.runId, "live") },
      };

    case "run_event": {
      if (state.activeRun?.runId !== action.runId) return state;
      const { itemId } = state.activeRun;
      const { event } = action;
      const finished = event.type === "complete" || event.type === "error";
      const next = update(state, itemId, (r) => {
        switch (event.type) {
          case "received":
            return { ...r, received: true };
          case "extraction":
            return { ...r, extraction: event.data };
          case "classification":
            return { ...r, classification: event.data };
          case "draft":
            return { ...r, draft: event.data };
          case "complete":
            return { ...r, status: r.draft ? "review_ready" : "error", failure: r.draft ? null : { stage: "draft", message: "Processing ended without a draft. Please try again.", retryable: true } };
          case "error":
            return { ...r, status: "error", failure: { stage: event.stage, message: event.message, retryable: event.retryable } };
        }
      });
      return finished ? { ...next, activeRun: null } : next;
    }

    case "run_fail": {
      if (state.activeRun?.runId !== action.runId) return state;
      const next = update(state, state.activeRun.itemId, (r) => ({ ...r, status: "error", failure: action.failure }));
      return { ...next, activeRun: null };
    }

    case "simulated":
      if (state.activeRun) return state;
      return {
        ...state,
        selectedId: action.itemId,
        results: {
          ...state.results,
          [action.itemId]: { ...blank(action.runId, "simulated"), status: "review_ready", received: true, extraction: action.extraction, classification: action.classification, draft: action.draft },
        },
      };

    case "edit":
      return update(state, action.itemId, (r) => (reviewable(r) ? { ...r, edited: { subject: action.subject, body: action.body }, status: "review_ready", rejectionReason: null } : null));

    case "approve":
      return update(state, action.itemId, (r) => {
        const text = r.edited ?? r.draft;
        if (!reviewable(r) || !text?.subject.trim() || !text.body.trim()) return null;
        return { ...r, status: "approved", rejectionReason: null };
      });

    case "reject":
      return update(state, action.itemId, (r) => (reviewable(r) ? { ...r, status: "rejected", rejectionReason: action.reason.trim().slice(0, 300) || null } : null));

    case "reopen":
      return update(state, action.itemId, (r) => (r.status === "approved" || r.status === "rejected" ? { ...r, status: "review_ready", rejectionReason: null } : null));

    case "regen_start":
      return update(state, action.itemId, (r) =>
        r.mode === "live" && reviewable(r) && r.regenerations < MAX_REGENERATIONS && !state.activeRun ? { ...r, regenerating: true, regenError: null } : null,
      );

    case "regen_done":
      return update(state, action.itemId, (r) =>
        r.runId === action.runId && r.regenerating ? { ...r, regenerating: false, draft: action.draft, edited: null, status: "review_ready", rejectionReason: null, regenerations: r.regenerations + 1 } : null,
      );

    case "regen_fail":
      return update(state, action.itemId, (r) => (r.runId === action.runId && r.regenerating ? { ...r, regenerating: false, regenError: action.message } : null));
  }
}

/** The phase of the selected request, which drives the whole dashboard. */
export function phaseOf(state: WorkflowState): Phase {
  if (!state.selectedId) return "idle";
  return state.results[state.selectedId]?.status ?? "request_selected";
}

export const phaseLabels: Record<Phase, string> = {
  idle: "Choose a request",
  request_selected: "Ready to process",
  processing: "AI processing",
  review_ready: "Awaiting employee review",
  approved: "Approved (simulated)",
  rejected: "Rejected (simulated)",
  error: "Needs attention",
};

/** The draft text the employee is looking at: their edits, or the suggestion. */
export function currentDraft(r: ItemResult | undefined) {
  if (!r?.draft) return null;
  return r.edited ?? { subject: r.draft.subject, body: r.draft.body };
}
