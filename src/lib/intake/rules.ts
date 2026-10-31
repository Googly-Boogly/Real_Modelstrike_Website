// Stage 3: business rules. Priority, routing and next steps are decided here in
// plain code. The model only reports what the message says, so it can't invent
// a policy, and a keyword match can raise priority if it misses a safety signal.

import type { IndustryConfig } from "./industries.ts";
import type { Classification, Extraction, Priority, Signal } from "./schema.ts";

const SAFETY_TERMS = /\b(gas (smell|leak)|smell(s|ing)? (of )?gas|carbon monoxide|co detector|sparks?|sparking|smoke|fire|burning smell|flood(ed|ing)?|sewage|electrical shock|ceiling (collapse|falling))\b/i;

const signalReasons: Record<Signal, string> = {
  safety_risk: "The message mentions a possible safety concern.",
  active_damage: "The message describes damage that may be getting worse.",
  service_outage: "The message describes something that has stopped working.",
  vulnerable_people: "The message mentions people who may be especially affected.",
  stated_deadline: "The customer mentioned a specific timeframe.",
};

export function classify(industry: IndustryConfig, extraction: Extraction, message: string): Classification {
  if (!extraction.is_customer_inquiry) {
    return {
      category: "Not a Customer Inquiry",
      department: "Front Desk",
      priority: "Routine Review",
      reasons: ["This doesn't look like a customer request."],
      missing: [],
      questions: [],
      next_action: "An employee should glance at this and decide whether it needs a reply.",
    };
  }

  const category = industry.categories.find((c) => c.id === extraction.request_type) ?? industry.categories[industry.categories.length - 1];
  const reasons = extraction.signals.map((s) => signalReasons[s]);
  const keywordSafety = SAFETY_TERMS.test(message);
  if (keywordSafety && !extraction.signals.includes("safety_risk")) reasons.unshift(signalReasons.safety_risk);

  let priority: Priority = "Routine Review";
  if (extraction.signals.includes("safety_risk") || keywordSafety) priority = "Immediate Review";
  else if (extraction.signals.length > 0) priority = "Review Soon";
  if (reasons.length === 0) reasons.push("No urgent details were found in the message.");

  const { fields } = extraction;
  const missing: string[] = [];
  const questions: string[] = [];
  for (const f of industry.fields) {
    if (f.followUp && !fields[f.key]) {
      missing.push(f.label);
      questions.push(f.followUp);
    }
  }
  if (!fields.email && !fields.phone) {
    missing.push("Contact details");
    questions.push("the best phone number or email address to reach you");
  } else if (industry.preferPhone && !fields.phone) {
    missing.push("Phone");
    questions.push("the best phone number to reach you");
  }

  const next_action =
    priority === "Immediate Review"
      ? "Have an employee review this right away and decide how to respond."
      : missing.length > 0 && !fields.email && !fields.phone
        ? "Hold the reply until contact details are found, then follow up."
        : category.action;

  return {
    category: category.label,
    department: category.department,
    priority,
    reasons,
    missing,
    questions: [...questions, ...(industry.standingQuestions ?? [])].slice(0, 3),
    next_action,
  };
}
