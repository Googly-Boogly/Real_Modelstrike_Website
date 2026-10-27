// Shared by the server action (source of truth) and the client form (option
// lists, limits, and early feedback). Keep this file dependency-free so it can
// be unit-tested with plain Node.

export const industryOptions = [
  "HVAC",
  "Plumbing",
  "Electrical",
  "Other home service",
  "Other",
] as const;

export const limits = {
  name: 100,
  email: 254,
  company: 150,
  message: 4000,
  messageMin: 10,
} as const;

export type ContactSubmission = {
  name: string;
  email: string;
  company: string;
  industry: (typeof industryOptions)[number] | "";
  message: string;
};

export type ContactField = keyof ContactSubmission;
export type FieldErrors = Partial<Record<ContactField, string>>;

export type ValidationResult = { ok: true; data: ContactSubmission } | { ok: false; errors: FieldErrors; values: Partial<ContactSubmission> };

// Pragmatic check: one "@", no whitespace, a dot in the domain, no leading/trailing dot.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

// Strip control characters (keeping newlines/tabs in the message) and normalise whitespace.
function clean(value: unknown, multiline = false): string {
  if (typeof value !== "string") return "";
  let v = value.normalize("NFC").replace(/\r\n?/g, "\n");
  v = multiline ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") : v.replace(/[\u0000-\u001F\u007F]/g, " ");
  if (!multiline) v = v.replace(/\s+/g, " ");
  return v.trim();
}

export function validateContact(input: Record<string, unknown>): ValidationResult {
  const values = {
    name: clean(input.name),
    email: clean(input.email).toLowerCase(),
    company: clean(input.company),
    industry: clean(input.industry),
    message: clean(input.message, true),
  };
  const errors: FieldErrors = {};

  if (!values.name) errors.name = "Please enter your name.";
  else if (values.name.length > limits.name) errors.name = `Please keep this under ${limits.name} characters.`;

  if (!values.email) errors.email = "Please enter your business email.";
  else if (values.email.length > limits.email || !EMAIL_RE.test(values.email)) errors.email = "Please enter a valid email address.";

  if (!values.company) errors.company = "Please enter your company name.";
  else if (values.company.length > limits.company) errors.company = `Please keep this under ${limits.company} characters.`;

  if (values.industry && !(industryOptions as readonly string[]).includes(values.industry)) errors.industry = "Please choose an option from the list.";

  if (!values.message) errors.message = "Please tell us what you'd like to automate.";
  else if (values.message.length < limits.messageMin) errors.message = "Please add a little more detail.";
  else if (values.message.length > limits.message) errors.message = `Please keep this under ${limits.message} characters.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors, values: values as Partial<ContactSubmission> };
  return { ok: true, data: values as ContactSubmission };
}

/** Plain-text rendering for email bodies and logs-free delivery. Never HTML. */
export function formatPlainText(s: ContactSubmission, submittedAt: string): string {
  return [
    "New consultation request from modelstrike.ai",
    "",
    `Name:      ${s.name}`,
    `Email:     ${s.email}`,
    `Company:   ${s.company}`,
    `Industry:  ${s.industry || "(not specified)"}`,
    `Submitted: ${submittedAt}`,
    "",
    "What they'd like to automate:",
    s.message,
  ].join("\n");
}
