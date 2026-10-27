"use server";

import Anthropic from "@anthropic-ai/sdk";
import { headers } from "next/headers";
import { createRateLimiter } from "@/lib/contact/rate-limit";
import { analyzeIntakeEmail, IntakeAnalysisError, isAiConfigured } from "@/lib/intake/analyze";
import { validateIntakeEmail, type IntakeAnalysis } from "@/lib/intake/schema";

export type ProcessResult = { ok: true; analysis: IntakeAnalysis } | { ok: false; message: string };

// Per-IP limit for fairness, plus a global ceiling per instance to cap API spend.
const perIp = createRateLimiter({ limit: 8, windowMs: 10 * 60_000 });
const globalLimit = createRateLimiter({ limit: 200, windowMs: 60 * 60_000 });

async function clientKey() {
  const h = await headers();
  // Trust only the first hop; the reverse proxy in front of the app must set these.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}

export async function processIntakeEmail(input: unknown): Promise<ProcessResult> {
  // 1. Only run when the operator configured a key. The page shows the simulated mode otherwise.
  if (!isAiConfigured()) return { ok: false, message: "Live AI processing isn't enabled on this site right now." };

  // 2. Validate before spending anything.
  const result = validateIntakeEmail(typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {});
  if (!result.ok) return { ok: false, message: result.message };

  // 3. Rate limits.
  const ip = perIp.check(await clientKey());
  if (!ip.allowed) {
    const minutes = Math.max(1, Math.ceil(ip.retryAfterMs / 60_000));
    return { ok: false, message: `You've reached the demo limit. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }
  if (!globalLimit.check("all").allowed) return { ok: false, message: "The demo is very busy right now. Please try again a little later." };

  // 4. Analyze. Log only the failure kind — never the email or contact details.
  try {
    return { ok: true, analysis: await analyzeIntakeEmail(result.data) };
  } catch (err) {
    const kind =
      err instanceof IntakeAnalysisError
        ? err.message
        : err instanceof Anthropic.APIError
          ? `api ${err.status ?? "connection"}`
          : "unexpected";
    console.error(`[demo] intake analysis failed: ${kind}`);
    if (err instanceof IntakeAnalysisError && err.message === "refusal") {
      return { ok: false, message: "The AI declined to process this message. Please try a different example." };
    }
    return { ok: false, message: "We couldn't analyze this email just now. Please try again in a moment." };
  }
}
