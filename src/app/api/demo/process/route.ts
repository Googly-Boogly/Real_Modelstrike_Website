import { isAiConfigured } from "@/lib/intake/ai";
import { runIntake, type RunStats } from "@/lib/intake/pipeline";
import { admit, budgetedModel, spentToday } from "@/lib/intake/runtime";
import { intakeLimits, validateIntakeRequest } from "@/lib/intake/schema";

// A generous ceiling on top of each model call's own timeout.
const RUN_DEADLINE_MS = 60_000;

function deny(status: number, code: string, message: string, retryAfterSeconds?: number) {
  console.warn(`[demo] denied reason=${code}`);
  return Response.json({ success: false, code, message }, { status, headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined });
}

/** Browsers always send Origin on a POST; requiring it keeps other sites and casual scripts off the paid API. */
function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}

function clientIp(request: Request) {
  // Trust only the first hop; the reverse proxy in front of the app must set these.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Reads at most `limit` bytes, however large the body or whatever Content-Length claims. */
async function readBody(request: Request, limit: number) {
  if (!request.body) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(request: Request) {
  if (!isAiConfigured()) return deny(503, "not_configured", "Live AI processing isn't enabled on this site right now.");
  if (!isSameOrigin(request)) return deny(403, "forbidden", "This request isn't allowed.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) return deny(415, "bad_request", "This request isn't allowed.");

  const body = await readBody(request, intakeLimits.requestBytes);
  if (body === null) return deny(413, "too_large", `Please keep the inquiry under ${intakeLimits.message} characters.`);
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return deny(400, "bad_request", "This request couldn't be read.");
  }
  const validation = validateIntakeRequest(json);
  if (!validation.ok) return deny(400, "invalid", validation.message);

  const admission = admit(clientIp(request));
  if (!admission.ok) return deny(admission.status, admission.code, admission.message, admission.retryAfterSeconds);

  // Stops the provider call, and its cost, when the visitor cancels or leaves.
  const abort = new AbortController();
  const signal = AbortSignal.any([abort.signal, request.signal, AbortSignal.timeout(RUN_DEADLINE_MS)]);
  const spend = { usd: 0 };
  const stats: RunStats = { dropped: 0 };
  const startedAt = Date.now();
  const events = runIntake(validation.data, { callModel: budgetedModel(spend), signal, stats });
  const encoder = new TextEncoder();

  let finished = false;
  let outcome = "cancelled";
  const finish = () => {
    if (finished) return;
    finished = true;
    admission.release();
    // Aggregate facts for monitoring abuse and funnel health. Never the message, IP or results.
    console.info(`[demo] run outcome=${outcome} industry=${validation.data.industry.id} ms=${Date.now() - startedAt} usd=${spend.usd.toFixed(4)} spent_today=${spentToday().toFixed(4)} dropped_fields=${stats.dropped}`);
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
