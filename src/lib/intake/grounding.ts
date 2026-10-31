// Deterministic checks on model output. Prompts ask for good behavior; these
// are what enforce it. Nothing here depends on the model cooperating.

import type { IndustryConfig } from "./industries.ts";
import type { Extraction } from "./schema.ts";

const NUMBER_WORDS: Record<string, string> = {
  one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10", eleven: "11", twelve: "12",
};

function tokens(text: string) {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).map((t) => NUMBER_WORDS[t] ?? t);
}

const digits = (text: string) => text.replace(/\D/g, "");

function isGrounded(key: string, value: string, message: string) {
  if (key === "email") return message.toLowerCase().includes(value.toLowerCase());
  if (key === "phone") return digits(value).length >= 7 && digits(message).includes(digits(value));
  const known = new Set(tokens(message));
  return tokens(value).every((t) => known.has(t));
}

function numbersGrounded(value: string, message: string) {
  const known = new Set(tokens(message));
  return (value.match(/\d+/g) ?? []).every((n) => known.has(n));
}

/**
 * Clears any field the message doesn't support, so a fabricated value shows as
 * "Not provided". Returns the cleaned extraction and how many values were dropped.
 */
export function groundExtraction(extraction: Extraction, industry: IndustryConfig, message: string) {
  const fields = { ...extraction.fields };
  let dropped = 0;
  for (const f of industry.fields) {
    const value = fields[f.key];
    if (!value) continue;
    const ok = f.grounding === "verbatim" ? isGrounded(f.key, value, message) : numbersGrounded(value, message) && !LINK.test(value);
    if (!ok) {
      fields[f.key] = null;
      dropped += 1;
    }
  }
  return { extraction: { ...extraction, fields }, dropped };
}

const LINK = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\.[a-z]{2,}/i;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE = /(?:\+?\d[\s().-]*){7,}/g;
const PLACEHOLDER = /\[[^\]\n]{2,40}\]|\{\{[^}\n]+\}\}/;

const PRICE = [
  /[$€£]\s?\d/,
  /\b\d[\d,.]*\s?(dollars|usd|bucks)\b/i,
  /\b\d+\s?%\s?(off|discount)\b/i,
  /\b(free|no[- ]cost|complimentary)\s+(estimate|quote|inspection|visit|consultation|service|repair)\b/i,
  /\bno charge\b/i,
];

const COMMITMENT = [
  /\b(appointment|visit|technician|plumber|maintenance|repair|someone|service call|work order)\b[^.!?\n]{0,50}\b(is|are|has been|have been|was|been)\s+(now\s+)?(confirmed|booked|scheduled|arranged|dispatched|on (the|their|its) way)\b/i,
  /\bwe(?:'ve| have)\s+(booked|scheduled|confirmed|dispatched|arranged)\b/i,
  /\b(we(?:'ll| will| can)?|our (team|technician|plumber|staff)( member)?(?:'ll| will| can)?)\s+(definitely\s+)?(be there|arrive|come out|come by|send (a|an|someone|out)|dispatch|fix|repair|resolve)\b/i,
  /\bwill (arrive|be there|be fixed|be repaired|be resolved)\b/i,
  /\bsee you\b/i,
  /\bguarantee/i,
  /\bwithin \d+ (minutes?|hours?|days?)\b/i,
];

const PRIVATE_RECORDS = /\b(reviewed|checked|looked at|accessed|pulled( up)?)\s+(your|the)\s+(records?|books|accounts?|financials?|file|history|tax returns?)\b/i;

/**
 * Lists what's wrong with a draft, in terms the model can act on when retrying.
 * Details that came from the customer's own message are allowed.
 */
export function checkDraft(draft: { subject: string; body: string }, message: string): string[] {
  const text = `${draft.subject}\n${draft.body}`;
  const problems: string[] = [];
  const has = (patterns: RegExp[]) => patterns.some((p) => p.test(text) && !p.test(message));

  if (has(PRICE)) problems.push("Remove any price, discount or free offer.");
  if (has(COMMITMENT)) problems.push("Remove any promise about appointments, arrival, timing or outcomes. Say only that the team will review the request and follow up.");
  if (PRIVATE_RECORDS.test(text)) problems.push("Don't claim to have seen any records. You have only the customer's message.");
  if (PLACEHOLDER.test(text)) problems.push("Remove placeholders in brackets.");
  if (LINK.test(text)) problems.push("Remove links.");

  const invented = [...(text.match(EMAIL) ?? [])].filter((e) => !message.toLowerCase().includes(e.toLowerCase()));
  const inventedPhones = [...(text.match(PHONE) ?? [])].filter((p) => digits(p).length >= 7 && !digits(message).includes(digits(p)));
  if (invented.length > 0 || inventedPhones.length > 0) problems.push("Remove contact details that weren't in the customer's message.");

  return problems;
}
