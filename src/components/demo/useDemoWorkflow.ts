"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { initialWorkflow, workflowReducer, type InboxItem } from "@/lib/demo/workflow";
import { getIndustry, type IndustryConfig } from "@/lib/intake/industries";
import { classify } from "@/lib/intake/rules";
import { composeInquiry } from "@/lib/intake/schema";
import { templateDraft } from "@/lib/intake/templates";
import { connectionFailure, processInquiry, regenerate as regenerateDraft } from "./demoApi";

/** Workflow state plus the side effects: API calls, cancellation and run ids. */
export function useDemoWorkflow(defaultIndustry: IndustryConfig) {
  const [state, dispatch] = useReducer(workflowReducer, defaultIndustry.id, initialWorkflow);
  const industry = getIndustry(state.industryId) ?? defaultIndustry;
  const runIds = useRef(0);
  const inFlight = useRef<AbortController | null>(null);
  const regenFlight = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    inFlight.current?.abort();
    regenFlight.current?.abort();
    inFlight.current = null;
    regenFlight.current = null;
  }, []);
  useEffect(() => cancel, [cancel]);

  const selectIndustry = useCallback(
    (id: string) => {
      cancel();
      dispatch({ type: "industry", industryId: id });
    },
    [cancel],
  );

  const reset = useCallback(() => {
    cancel();
    dispatch({ type: "reset" });
  }, [cancel]);

  const processLive = useCallback(
    async (item: InboxItem) => {
      if (inFlight.current) return;
      const runId = ++runIds.current;
      const abort = new AbortController();
      inFlight.current = abort;
      dispatch({ type: "run_start", itemId: item.id, runId });
      try {
        const failure = await processInquiry(industry.id, item, abort.signal, (event) => dispatch({ type: "run_event", runId, event }));
        if (failure) dispatch({ type: "run_fail", runId, failure });
      } catch {
        if (!abort.signal.aborted) dispatch({ type: "run_fail", runId, failure: connectionFailure });
      } finally {
        if (inFlight.current === abort) inFlight.current = null;
      }
    },
    [industry.id],
  );

  /** The labelled simulated example: precomputed extraction, real rules, template reply. Samples only. */
  const processSimulated = useCallback(
    async (item: InboxItem) => {
      if (item.custom || inFlight.current) return;
      const { previews } = await import("@/content/intake-previews");
      const extraction = previews[item.id];
      if (!extraction) return;
      const classification = classify(industry, extraction, composeInquiry(item));
      dispatch({ type: "simulated", itemId: item.id, runId: ++runIds.current, extraction, classification, draft: templateDraft(industry, extraction, classification) });
    },
    [industry],
  );

  const regenerate = useCallback(
    async (item: InboxItem) => {
      const result = state.results[item.id];
      if (!result?.extraction || regenFlight.current) return;
      const abort = new AbortController();
      regenFlight.current = abort;
      dispatch({ type: "regen_start", itemId: item.id });
      const outcome = await regenerateDraft(industry.id, item, result.extraction, abort.signal);
      if (regenFlight.current === abort) regenFlight.current = null;
      if (abort.signal.aborted) return;
      if ("draft" in outcome) dispatch({ type: "regen_done", itemId: item.id, runId: result.runId, draft: outcome.draft });
      else dispatch({ type: "regen_fail", itemId: item.id, runId: result.runId, message: outcome.error });
    },
    [industry.id, state.results],
  );

  return { state, dispatch, industry, selectIndustry, reset, processLive, processSimulated, regenerate };
}
