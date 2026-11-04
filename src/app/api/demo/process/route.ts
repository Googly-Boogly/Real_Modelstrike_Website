import { guard } from "@/lib/intake/http";
import { runIntake, type RunStats } from "@/lib/intake/pipeline";
import { budgetedModel, spentToday } from "@/lib/intake/runtime";
import { validateIntakeRequest } from "@/lib/intake/schema";

// A generous ceiling on top of each model call's own timeout.
const RUN_DEADLINE_MS = 60_000;

export async function POST(request: Request) {
  const guarded = await guard(request, (json) => {
    const v = validateIntakeRequest(json);
    return v.ok ? { ok: true, value: v.data } : v;
  });
  if (guarded instanceof Response) return guarded;
  const { value: data, admission } = guarded;

  // Stops the provider call, and its cost, when the visitor cancels or leaves.
  const abort = new AbortController();
  const signal = AbortSignal.any([abort.signal, request.signal, AbortSignal.timeout(RUN_DEADLINE_MS)]);
  const spend = { usd: 0 };
  const stats: RunStats = { dropped: 0 };
  const startedAt = Date.now();
  const events = runIntake(data, { callModel: budgetedModel(spend), signal, stats });
  const encoder = new TextEncoder();

  let finished = false;
  let outcome = "cancelled";
  const finish = () => {
    if (finished) return;
    finished = true;
    admission.release();
    // Aggregate facts for monitoring abuse and funnel health. Never the message, IP or results.
    console.info(`[demo] run outcome=${outcome} industry=${data.industry.id} ms=${Date.now() - startedAt} usd=${spend.usd.toFixed(4)} spent_today=${spentToday().toFixed(4)} dropped_fields=${stats.dropped}`);
  };

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await events.next();
        if (done) {
          finish();
          controller.close();
          return;
        }
        if (value.type === "complete") outcome = "completed";
        if (value.type === "error") outcome = `failed_${value.code}`;
        controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
      } catch {
        // Enqueueing after the visitor disconnected also lands here; that's a cancellation.
        if (abort.signal.aborted || request.signal.aborted) {
          finish();
          return;
        }
        outcome = "failed_stream";
        finish();
        controller.error(new Error("stream failed"));
      }
    },
    async cancel() {
      abort.abort();
      await events.return(undefined);
      finish();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" },
  });
}
