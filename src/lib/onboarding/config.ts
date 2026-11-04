// Chooses the onboarding backend from runtime (server-only) environment variables.
//
//   ONBOARDING_API_URL + ONBOARDING_API_SECRET  → the Sales Swarm (production path)
//   ONBOARDING_MOCK=true, outside production    → the in-memory development mock
//   otherwise                                   → null: the page says onboarding is unavailable
//
// Nothing here is NEXT_PUBLIC_*, so none of it reaches the client bundle.

import { swarmBackend, type OnboardingBackend } from "./backend.ts";
import { mockBackend, newStore } from "./mock.ts";

type Env = Record<string, string | undefined>;

export type ConfigProblem = "not_configured" | "insecure_url" | "weak_secret";

export function resolveBackendConfig(env: Env): { kind: "swarm"; baseUrl: string; secret: string } | { kind: "mock" } | { kind: "none"; problem: ConfigProblem } {
  const production = env.NODE_ENV === "production";
  const baseUrl = env.ONBOARDING_API_URL?.trim() ?? "";
  const secret = env.ONBOARDING_API_SECRET?.trim() ?? "";
  if (baseUrl || secret) {
    let url: URL | null = null;
    try {
      url = new URL(baseUrl);
    } catch {
      return { kind: "none", problem: "not_configured" };
    }
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    // Plain http only to a local Swarm during development; production traffic carries customer answers.
    if (url.protocol !== "https:" && !(url.protocol === "http:" && local && !production)) return { kind: "none", problem: "insecure_url" };
    if (secret.length < 32) return { kind: "none", problem: "weak_secret" };
    return { kind: "swarm", baseUrl: url.toString(), secret };
  }
  if (!production && env.ONBOARDING_MOCK?.trim() === "true") return { kind: "mock" };
  return { kind: "none", problem: "not_configured" };
}

// Kept on globalThis so the dev mock's sessions survive hot reloads.
const g = globalThis as typeof globalThis & { __msOnboardingMockStore?: ReturnType<typeof newStore> };

let cached: { key: string; backend: OnboardingBackend | null } | null = null;
let warned = false;

export function getBackend(env: Env = process.env): OnboardingBackend | null {
  const config = resolveBackendConfig(env);
  const key = JSON.stringify(config);
  if (cached?.key === key) return cached.backend;
  let backend: OnboardingBackend | null = null;
  if (config.kind === "swarm") backend = swarmBackend(config);
  else if (config.kind === "mock") backend = mockBackend({ store: (g.__msOnboardingMockStore ??= newStore()) });
  else if (config.problem !== "not_configured" && !warned) {
    warned = true;
    console.warn(`[onboarding] backend disabled: ${config.problem}`);
  }
  cached = { key, backend };
  return backend;
}
