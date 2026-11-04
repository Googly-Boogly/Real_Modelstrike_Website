// Deterministic reply drafts, built only from the validated record. Used for the
// labelled simulated examples, never presented as AI output.

import type { IndustryConfig } from "./industries.ts";
import type { Classification, Draft, Extraction } from "./schema.ts";

function list(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

export function templateDraft(industry: IndustryConfig, extraction: Extraction, classification: Classification): Draft {
  const category = industry.categories.find((c) => c.label === classification.category) ?? industry.categories.at(-1)!;
  const first = extraction.fields.customer_name?.split(/\s+/)[0]?.replace(/\.$/, "");
  const greeting = first && first.length > 1 ? `Hi ${first},` : "Hello,";
  const timing = extraction.fields.preferred_time ?? extraction.fields.deadline;
  const paragraphs = [greeting, category.thanks];

  if (classification.priority === "Immediate Review") {
    paragraphs.push("If you believe anyone is in immediate danger, please leave the area and contact emergency services or your utility provider right away.");
  }
  paragraphs.push(
    timing
      ? `Our team will review your request, including the timing you mentioned (${timing}), and follow up with next steps.`
      : "Our team will review your request and follow up with next steps.",
  );
  if (classification.questions.length > 0) paragraphs.push(`So we can help, could you share ${list(classification.questions)}?`);
  paragraphs.push(`Best regards,\n${industry.signature}`);

  return { subject: `Re: your ${category.label.toLowerCase()} request`, body: paragraphs.join("\n\n"), source: "template" };
}
