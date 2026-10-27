"use server";

import { headers } from "next/headers";
import { resolveConfirmation, resolveDelivery } from "@/lib/contact/delivery";
import { createRateLimiter } from "@/lib/contact/rate-limit";
import { validateContact } from "@/lib/contact/schema";
import type { ContactState } from "./state";

const MIN_FILL_MS = 3_000;
const limiter = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });

async function clientKey() {
  const h = await headers();
  // Trust only the first hop; the reverse proxy in front of the app must set these.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}

export async function submitContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  // 1. Honeypot: bots fill the hidden field. Return a neutral success so they don't adapt.
  if (String(formData.get("website") ?? "").length > 0) return { status: "success" };

  // 2. Minimum fill time.
  const startedAt = Number(formData.get("startedAt"));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FILL_MS) {
    return { status: "error", message: "That was quick! Please take a moment to review your details and submit again." };
  }

  // 3. Per-IP rate limit.
  const { allowed, retryAfterMs } = limiter.check(await clientKey());
  if (!allowed) {
    const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
    return { status: "error", message: `Too many requests from your network. Please try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.` };
  }

  // 4. Server-side validation (source of truth).
  const result = validateContact({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    industry: formData.get("industry"),
    message: formData.get("message"),
  });
  if (!result.ok) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: result.errors, values: result.values };
  }

  // 5. Deliver. Never report success unless the provider accepted it.
  const delivery = resolveDelivery();
  if (!delivery) {
    return {
      status: "error",
      message: "Our contact form isn't accepting submissions right now. Please try again later.",
      values: result.data,
    };
  }

  try {
    await delivery.send(result.data, new Date().toISOString());
  } catch (err) {
    // Log the provider and error only — never the visitor's details.
    console.error(`[contact] delivery via ${delivery.name} failed: ${err instanceof Error ? err.message : "unknown error"}`);
    return { status: "error", message: "We couldn't send your request just now. Please try again in a few minutes.", values: result.data };
  }

  // The request is delivered at this point, so a failed confirmation is logged
  // but doesn't fail the submission — the visitor just isn't told to expect an email.
  const booker = { name: result.data.name, email: result.data.email };
  const confirmation = resolveConfirmation();
  if (confirmation) {
    try {
      await confirmation.send(result.data.email);
      return { status: "success", confirmed: true, booker };
    } catch (err) {
      console.error(`[contact] confirmation via ${confirmation.name} failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return { status: "success", booker };
}
