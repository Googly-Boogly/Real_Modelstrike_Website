import "server-only";
import { createHmac } from "node:crypto";
import { site } from "@/content/site";
import { formatPlainText, type ContactSubmission } from "./schema";

export type ContactDelivery = {
  name: string;
  send(submission: ContactSubmission, submittedAt: string): Promise<void>;
};

const TIMEOUT_MS = 10_000;

function env(name: string) {
  return process.env[name]?.trim() || "";
}

async function post(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, method: "POST", signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

function resend(): ContactDelivery | null {
  const apiKey = env("RESEND_API_KEY");
  const to = env("CONTACT_TO_EMAIL");
  const from = env("CONTACT_FROM_EMAIL");
  if (!apiKey || !to || !from) return null;
  return {
    name: "resend",
    async send(s, submittedAt) {
      await post("https://api.resend.com/emails", {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: to.split(",").map((t) => t.trim()).filter(Boolean),
          reply_to: s.email,
          subject: `Consultation request: ${s.company}`.slice(0, 200),
          text: formatPlainText(s, submittedAt),
        }),
      });
    },
  };
}

// HTTPS only, except plain HTTP to localhost for local testing.
function isAllowedWebhook(raw: string) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1"].includes(u.hostname));
  } catch {
    return false;
  }
}

function webhook(): ContactDelivery | null {
  const url = env("CONTACT_WEBHOOK_URL");
  if (!isAllowedWebhook(url)) return null;
  const secret = env("CONTACT_WEBHOOK_SECRET");
  return {
    name: "webhook",
    async send(s, submittedAt) {
      const body = JSON.stringify({ ...s, submittedAt, source: "modelstrike.ai contact form" });
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // Receivers verify with HMAC-SHA256 of the raw body; the secret itself never leaves the server.
      if (secret) headers["X-ModelStrike-Signature"] = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
      await post(url, { headers, body });
    },
  };
}

/** Returns the configured provider, or null when delivery isn't fully set up. */
export function resolveDelivery(): ContactDelivery | null {
  switch (env("CONTACT_DELIVERY").toLowerCase()) {
    case "resend":
      return resend();
    case "webhook":
      return webhook();
    default:
      return null;
  }
}

export type ConfirmationSender = { name: string; send(to: string): Promise<void> };

/**
 * Deliberately contains nothing the visitor typed: the recipient address is
 * unverified, so echoing submitted text would let anyone use the form to send
 * their own content to an arbitrary inbox under our name.
 */
function confirmationText(withCalendar: boolean): string {
  return [
    "Hello,",
    "",
    `Thanks for requesting a free automation consultation from ${site.name}. This email confirms we've received your request.`,
    "",
    withCalendar
      ? "If you haven't picked a time for the call yet, you can do so on the contact page. Otherwise, we'll follow up by email."
      : "We'll review what you've shared and follow up by email to arrange a time to talk.",
    "",
    "If you didn't submit this request, you can ignore this email — nothing further will happen.",
    "",
    `— ${site.legalName}`,
    site.url,
  ].join("\n");
}

/** Sender for the visitor's confirmation email, or null when Resend isn't configured. */
export function resolveConfirmation(): ConfirmationSender | null {
  const apiKey = env("RESEND_API_KEY");
  const from = env("CONTACT_FROM_EMAIL");
  if (!apiKey || !from) return null;
  const replyTo = env("CONTACT_TO_EMAIL").split(",")[0]?.trim() || site.contactEmail || "";
  return {
    name: "resend",
    async send(to) {
      await post("https://api.resend.com/emails", {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [to],
          ...(replyTo ? { reply_to: replyTo } : {}),
          subject: `We've received your ${site.name} consultation request`,
          text: confirmationText(Boolean(site.calLink)),
        }),
      });
    },
  };
}
