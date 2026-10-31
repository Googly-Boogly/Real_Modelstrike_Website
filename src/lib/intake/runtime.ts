import "server-only";
import { createRateLimiter } from "@/lib/contact/rate-limit";
import { callOpenAI } from "./ai";
import { createBudget, createGate, fileBudgetStore } from "./budget";
import { maxRunCostUsd, withBudget, type CallModel } from "./pipeline";

const number = (name: string, fallback: number) => {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  // A mistyped limit fails closed instead of removing the limit.
  return Number.isFinite(value) && value >= 0 ? value : 0;
};

const perIp = createRateLimiter({ limit: number("DEMO_IP_LIMIT", 8), windowMs: 10 * 60_000 });
const hourly = createRateLimiter({ limit: number("DEMO_HOURLY_LIMIT", 200), windowMs: 60 * 60_000 });
const gate = createGate(number("DEMO_MAX_CONCURRENCY", 4));

const budgetFile = process.env.DEMO_BUDGET_FILE?.trim();
const budget = createBudget({
  limitUsd: number("DEMO_DAILY_BUDGET_USD", 5),
  store: budgetFile ? fileBudgetStore(budgetFile, () => console.error("[demo] budget file unavailable; using memory")) : undefined,
});

export type Admission = { ok: true; release: () => void } | { ok: false; status: number; code: string; message: string; retryAfterSeconds?: number };

/** Every check that must pass before a run may start. Holds a concurrency slot on success. */
export function admit(ip: string): Admission {
  if (!budget.canSpend(maxRunCostUsd)) return { ok: false, status: 503, code: "budget", message: "The live demo has reached today's usage limit. Please come back tomorrow." };

  const acquired = gate.acquire(ip);
  if ("refused" in acquired) {
    return acquired.refused === "duplicate"
      ? { ok: false, status: 409, code: "duplicate", message: "Your last request is still processing." }
      : { ok: false, status: 503, code: "busy", message: "The demo is very busy right now. Please try again in a moment.", retryAfterSeconds: 15 };
  }

  const ipCheck = perIp.check(ip);
  if (!ipCheck.allowed) {
    acquired.release();
    const minutes = Math.max(1, Math.ceil(ipCheck.retryAfterMs / 60_000));
    return { ok: false, status: 429, code: "rate_limited", message: `You've reached the demo limit. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`, retryAfterSeconds: Math.ceil(ipCheck.retryAfterMs / 1000) };
  }
  const hourCheck = hourly.check("all");
  if (!hourCheck.allowed) {
    acquired.release();
    return { ok: false, status: 429, code: "rate_limited", message: "The demo is very busy right now. Please try again a little later.", retryAfterSeconds: Math.ceil(hourCheck.retryAfterMs / 1000) };
  }
  return { ok: true, release: acquired.release };
}

/** A budget-enforced model call that adds what it spends to `spend.usd`. */
export function budgetedModel(spend: { usd: number }): CallModel {
  return withBudget(callOpenAI, budget, (usd) => {
    spend.usd += usd;
  });
}

export const spentToday = () => budget.spent();
