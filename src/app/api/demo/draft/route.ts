import { guard } from "@/lib/intake/http";
import { regenerateDraft } from "@/lib/intake/pipeline";
import { budgetedModel, spentToday } from "@/lib/intake/runtime";
import { validateDraftRequest } from "@/lib/intake/schema";

// "Regenerate Draft": one more draft for a record the visitor already has.
// Shares the per-IP, site-wide, concurrency and budget limits with /process.
// Returns a draft for on-page review only; nothing is ever sent.

const DEADLINE_MS = 45_000;

export async function POST(request: Request) {
  const guarded = await guard(request, (json) => {
    const v = validateDraftRequest(json);
    return v.ok ? { ok: true, value: v } : v;
  });
  if (guarded instanceof Response) return guarded;
  const { value, admission } = guarded;

  const spend = { usd: 0 };
  const startedAt = Date.now();
  let outcome = "cancelled";
  try {
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(DEADLINE_MS)]);
    const event = await regenerateDraft(value.data, value.extraction, { callModel: budgetedModel(spend), signal });
    outcome = event.type === "error" ? `failed_${event.code}` : "completed";
    return Response.json(event, { headers: { "Cache-Control": "no-store" } });
  } finally {
    admission.release();
    // Aggregate facts only. Never the message, IP or results.
    console.info(`[demo] regenerate outcome=${outcome} industry=${value.data.industry.id} ms=${Date.now() - startedAt} usd=${spend.usd.toFixed(4)} spent_today=${spentToday().toFixed(4)}`);
  }
}
