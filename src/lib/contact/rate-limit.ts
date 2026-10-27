// Fixed-window, in-memory rate limiter. Per server instance — good enough to
// stop casual abuse of a single self-hosted container; use a shared store
// (e.g. Redis) if the site is ever scaled horizontally.

export type RateLimiter = { check(key: string, now?: number): { allowed: boolean; retryAfterMs: number } };

export function createRateLimiter({ limit, windowMs, maxKeys = 10_000 }: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();

  function sweep(now: number) {
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }

  return {
    check(key, now = Date.now()) {
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        if (hits.size >= maxKeys) sweep(now);
        // Still full after sweeping: fail closed rather than grow without bound.
        if (hits.size >= maxKeys) return { allowed: false, retryAfterMs: windowMs };
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return entry.count <= limit ? { allowed: true, retryAfterMs: 0 } : { allowed: false, retryAfterMs: entry.resetAt - now };
    },
  };
}
