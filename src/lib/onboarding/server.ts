import "server-only";
import { getBackend } from "./config";
import { createOnboardingHandlers } from "./handlers";

/** One instance per server process, so the per-IP rate limits are shared by all onboarding routes. */
export const onboarding = createOnboardingHandlers({
  getBackend: () => getBackend(),
  // Secure + __Host- cookies everywhere except `next dev` on plain-http localhost.
  secureCookies: process.env.NODE_ENV === "production",
});
