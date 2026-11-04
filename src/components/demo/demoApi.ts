// Browser client for /api/demo. The server holds the API key and every limit;
// this only sends the request and reads events as each real stage finishes.

import type { Failure, InboxItem } from "@/lib/demo/workflow";
import type { Draft, Extraction, IntakeEvent } from "@/lib/intake/schema";

export const connectionFailure: Failure = { stage: "received", message: "We couldn't reach the server. Please check your connection and try again.", retryable: true };

const payload = (industryId: string, item: InboxItem) => ({
  industry: industryId,
  message: item.body,
  customer_name: item.name,
  customer_email: item.email,
  subject: item.subject,
});

async function refusal(response: Response): Promise<Failure> {
  const body = (await response.json().catch(() => null)) as { message?: string; code?: string } | null;
  return { stage: "received", message: body?.message ?? connectionFailure.message, retryable: body?.code !== "budget" && body?.code !== "not_configured" && body?.code !== "invalid" };
}

/** Streams the NDJSON events. Resolves with a failure if the run couldn't complete. */
export async function processInquiry(industryId: string, item: InboxItem, signal: AbortSignal, onEvent: (event: IntakeEvent) => void): Promise<Failure | null> {
  const response = await fetch("/api/demo/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload(industryId, item)),
    signal,
  });
  if (!response.ok || !response.body) return refusal(response);

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
      onEvent(event);
    }
  }
  return finished ? null : connectionFailure;
}

export async function regenerate(industryId: string, item: InboxItem, extraction: Extraction, signal: AbortSignal): Promise<{ draft: Draft } | { error: string }> {
  try {
    const response = await fetch("/api/demo/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload(industryId, item), extraction }),
      signal,
    });
    if (!response.ok) return { error: (await refusal(response)).message };
    const event = (await response.json()) as IntakeEvent;
    if (event.type === "draft") return { draft: event.data };
    if (event.type === "error") return { error: event.message };
    return { error: connectionFailure.message };
  } catch {
    return { error: connectionFailure.message };
  }
}
