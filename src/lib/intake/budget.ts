// Backend-enforced spending controls for the public demo.

import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

export type BudgetState = { day: string; spentUsd: number };
export type BudgetStore = { load(): BudgetState | null; save(state: BudgetState): void };

/**
 * Daily spending ceiling. Each model call reserves its worst-case cost up front
 * and settles to actual usage afterwards, so concurrent calls can't overshoot.
 * The reservation stands if a call ends without reporting usage, or if the
 * process dies mid-call: errs toward stopping early. Resets at midnight UTC.
 */
export function createBudget({ limitUsd, store, now = () => new Date() }: { limitUsd: number; store?: BudgetStore; now?: () => Date }) {
  const today = () => now().toISOString().slice(0, 10);
  let state: BudgetState = store?.load() ?? { day: today(), spentUsd: 0 };

  function current() {
    if (state.day !== today()) state = { day: today(), spentUsd: 0 };
    return state;
  }

  function add(usd: number) {
    const s = current();
    state = { day: s.day, spentUsd: Math.max(0, s.spentUsd + usd) };
    store?.save(state);
  }

  return {
    canSpend: (usd: number) => current().spentUsd + usd <= limitUsd,
    reserve(usd: number) {
      if (current().spentUsd + usd > limitUsd) return false;
      add(usd);
      return true;
    },
    settle: (reservedUsd: number, actualUsd: number) => add(actualUsd - reservedUsd),
    spent: () => current().spentUsd,
  };
}

export type Budget = ReturnType<typeof createBudget>;

/** Survives container restarts when pointed at a persistent path. Holds only a date and a number. */
export function fileBudgetStore(path: string, onError: (err: unknown) => void): BudgetStore {
  return {
    load() {
      try {
        if (!existsSync(path)) return null;
        const s = JSON.parse(readFileSync(path, "utf8")) as Partial<BudgetState>;
        return typeof s.day === "string" && typeof s.spentUsd === "number" && Number.isFinite(s.spentUsd) ? { day: s.day, spentUsd: s.spentUsd } : null;
      } catch (err) {
        onError(err);
        return null;
      }
    },
    save(state) {
      try {
        writeFileSync(`${path}.tmp`, JSON.stringify(state));
        renameSync(`${path}.tmp`, path);
      } catch (err) {
        onError(err);
      }
    },
  };
}

/** Limits how many runs are in flight. Excess requests are refused, not queued. */
export function createGate(max: number) {
  let active = 0;
  const keys = new Set<string>();
  return {
    /** Returns a release function, or a reason the run can't start. */
    acquire(key: string): { release: () => void } | { refused: "busy" | "duplicate" } {
      if (keys.has(key)) return { refused: "duplicate" };
      if (active >= max) return { refused: "busy" };
      active += 1;
      keys.add(key);
      let released = false;
      return {
        release() {
          if (released) return;
          released = true;
          active -= 1;
          keys.delete(key);
        },
      };
    },
  };
}
