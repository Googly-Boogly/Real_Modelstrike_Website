"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { classify } from "@/lib/intake/rules";
import type { IndustryConfig } from "@/lib/intake/industries";
import type { Classification, Draft, Extraction, IntakeEvent, Stage } from "@/lib/intake/schema";

export type RunMode = "live" | "preview";
export type RunFailure = { stage: Stage; message: string; retryable: boolean };

export type RunState = {
  status: "idle" | "running" | "done" | "failed";
  mode: RunMode;
  received: boolean;
  extraction: Extraction | null;
  classification: Classification | null;
  draft: Draft | null;
  failure: RunFailure | null;
};

const idle: RunState = { status: "idle", mode: "live", received: false, extraction: null, classification: null, draft: null, failure: null };

const connectionFailure: RunFailure = { stage: "extraction", message: "We couldn't reach the server. Please check your connection and try again.", retryable: true };

/** Runs the workflow against the API, updating state as each real stage finishes. */
export function useIntakeRun() {
  const [run, setRun] = useState<RunState>(idle);
  const controller = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    setRun(idle);
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  const start = useCallback(async (industry: IndustryConfig, message: string) => {
    if (controller.current) return; // a run is already in flight
    const abort = new AbortController();
    controller.current = abort;
    setRun({ ...idle, status: "running" });

    const apply = (event: IntakeEvent) => {
      setRun((r) => {
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
            return { ...r, status: "done" };
          case "error":
            return { ...r, status: "failed", failure: { stage: event.stage, message: event.message, retryable: event.retryable } };
        }
      });
    };
    const fail = (failure: RunFailure) => setRun((r) => ({ ...r, status: "failed", failure }));

    try {
      const response = await fetch("/api/demo/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: industry.id, message }),
        signal: abort.signal,
      });

      if (!response.ok || !response.body) {
        const body = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
        fail({ stage: "received", message: body?.message ?? connectionFailure.message, retryable: body?.code !== "budget" && body?.code !== "not_configured" });
        return;
      }

      let buffer = "";
      let finished = false;
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line) as IntakeEvent;
          finished ||= event.type === "complete" || event.type === "error";
          apply(event);
        }
      }
      if (!finished) fail(connectionFailure);
    } catch {
      if (!abort.signal.aborted) fail(connectionFailure);
    } finally {
      if (controller.current === abort) controller.current = null;
    }
  }, []);

  const showPreview = useCallback(async (industry: IndustryConfig, message: string) => {
    const { previews } = await import("@/content/intake-previews");
    const preview = previews[industry.id];
    if (!preview) return;
    setRun({
      status: "done",
      mode: "preview",
      received: true,
      extraction: preview.extraction,
      classification: classify(industry, preview.extraction, message),
      draft: preview.draft,
      failure: null,
    });
  }, []);

  return { run, start, reset, showPreview };
}
