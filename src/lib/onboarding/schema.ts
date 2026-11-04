// Onboarding questionnaire: option lists, limits, and validation.
// Shared by the browser (inline feedback) and the /api/customer-onboarding
// route handlers (source of truth on this side; the Sales Swarm validates again).
// Dependency-free so it runs under plain `node --test`.

export const QUESTIONNAIRE_VERSION = "onboarding-2026-11-v1";

type Option<V extends string = string> = { value: V; label: string };

const opts = <const T extends readonly Option[]>(list: T) => list;

export const industryOptions = opts([
  { value: "hvac_home_services", label: "HVAC / Home Services" },
  { value: "accounting", label: "Accounting" },
  { value: "property_management", label: "Property Management" },
  { value: "retail", label: "Retail" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
]);

export const challengeOptions = opts([
  { value: "manual_data_entry", label: "Too much manual data entry" },
  { value: "repetitive_admin", label: "Repetitive administrative tasks" },
  { value: "slow_response", label: "Slow customer response times" },
  { value: "information_lost", label: "Information gets lost or overlooked" },
  { value: "system_transfers", label: "Employees spend too much time transferring information between systems" },
  { value: "manual_errors", label: "Frequent manual errors" },
  { value: "tracking_requests", label: "Difficulty tracking customer requests" },
  { value: "other", label: "Other" },
]);

export const softwareOptions = opts([
  { value: "gmail", label: "Gmail" },
  { value: "outlook_m365", label: "Outlook / Microsoft 365" },
  { value: "zoho", label: "Zoho" },
  { value: "quickbooks", label: "QuickBooks" },
  { value: "hubspot", label: "HubSpot" },
  { value: "salesforce", label: "Salesforce" },
  { value: "servicetitan", label: "ServiceTitan" },
  { value: "jobber", label: "Jobber" },
  { value: "housecall_pro", label: "Housecall Pro" },
  { value: "google_sheets", label: "Google Sheets" },
  { value: "excel", label: "Microsoft Excel" },
  { value: "custom", label: "Custom business software" },
  { value: "other", label: "Other" },
]);

export const dataSourceOptions = opts([
  { value: "customer_emails", label: "Customer emails" },
  { value: "website_forms", label: "Website contact forms" },
  { value: "spreadsheets", label: "Internal spreadsheets" },
  { value: "crm", label: "CRM software" },
  { value: "support_tickets", label: "Customer support tickets" },
  { value: "documents", label: "Documents" },
  { value: "other", label: "Other" },
]);

export const volumeOptions = opts([
  { value: "lt_10", label: "Fewer than 10" },
  { value: "10_25", label: "10–25" },
  { value: "26_50", label: "26–50" },
  { value: "51_100", label: "51–100" },
  { value: "gt_100", label: "More than 100" },
  { value: "not_sure", label: "Not sure" },
]);

export const actionOptions = opts([
  { value: "update_customer_record", label: "Create or update a customer record" },
  { value: "draft_email", label: "Draft an email response" },
  { value: "notify_employee", label: "Notify an employee" },
  { value: "categorize", label: "Categorize or prioritize requests" },
  { value: "update_spreadsheet", label: "Update a spreadsheet" },
  { value: "transfer_system", label: "Transfer information into another system" },
  { value: "internal_task", label: "Create an internal task" },
  { value: "other", label: "Other" },
]);

export const limits = {
  name: 100,
  title: 100,
  email: 254,
  shortText: 200,
  longText: 4000,
  longTextMin: 10,
  role: 100,
} as const;

export type Answers = {
  // Step 1 — business (the business name itself comes from the verified record and is never submitted)
  contactName: string;
  jobTitle: string;
  contactEmail: string;
  industry: string;
  industryOther: string;
  // Step 2 — workflow
  processToAutomate: string;
  currentProcess: string;
  challenges: string[];
  challengesOther: string;
  // Step 3 — automation
  software: string[];
  softwareOther: string;
  dataSources: string[];
  dataSourcesOther: string;
  dailyVolume: string;
  actions: string[];
  actionsOther: string;
  actionsNotes: string;
  approverRole: string;
  approverEmail: string;
  // Step 4 — goals
  successCriteria: string;
  additionalNotes: string;
};

export type Field = keyof Answers;
export type FieldErrors = Partial<Record<Field, string>>;

export const emptyAnswers = (): Answers => ({
  contactName: "",
  jobTitle: "",
  contactEmail: "",
  industry: "",
  industryOther: "",
  processToAutomate: "",
  currentProcess: "",
  challenges: [],
  challengesOther: "",
  software: [],
  softwareOther: "",
  dataSources: [],
  dataSourcesOther: "",
  dailyVolume: "",
  actions: [],
  actionsOther: "",
  actionsNotes: "",
  approverRole: "",
  approverEmail: "",
  successCriteria: "",
  additionalNotes: "",
});

const ARRAY_FIELDS = new Set<Field>(["challenges", "software", "dataSources", "actions"]);
const MULTILINE_FIELDS = new Set<Field>(["processToAutomate", "currentProcess", "actionsNotes", "successCriteria", "additionalNotes"]);
export const ANSWER_FIELDS = Object.keys(emptyAnswers()) as Field[];

/** Which fields belong to which of the four steps, in display order. */
export const stepFields: readonly (readonly Field[])[] = [
  ["contactName", "jobTitle", "contactEmail", "industry", "industryOther"],
  ["processToAutomate", "currentProcess", "challenges", "challengesOther"],
  ["software", "softwareOther", "dataSources", "dataSourcesOther", "dailyVolume", "actions", "actionsOther", "actionsNotes", "approverRole", "approverEmail"],
  ["successCriteria", "additionalNotes"],
];

export const stepOf = (field: Field) => stepFields.findIndex((fields) => fields.includes(field));

// Pragmatic check: one "@", no whitespace, a dot in the domain, no empty labels. Same rule as the contact form.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
export const isEmail = (v: string) => v.length <= limits.email && EMAIL_RE.test(v);

/** Strip control characters (keeping newlines in multiline fields) and normalise whitespace. */
export function clean(value: unknown, multiline = false): string {
  if (typeof value !== "string") return "";
  let v = value.normalize("NFC").replace(/\r\n?/g, "\n");
  v = multiline ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n") : v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ");
  return v.trim();
}

function cleanList(value: unknown, allowed: readonly Option[]): string[] | null {
  if (!Array.isArray(value)) return null;
  const known = new Set(allowed.map((o) => o.value));
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !known.has(item)) return null;
    if (!out.includes(item)) out.push(item);
  }
  // Keep the option-list order so the saved record doesn't depend on click order.
  return allowed.map((o) => o.value).filter((v) => out.includes(v));
}

export function normalize(input: Partial<Record<Field, unknown>>): { answers: Answers; invalidLists: Set<Field> } {
  const answers = emptyAnswers();
  const invalidLists = new Set<Field>();
  const lists: Record<string, readonly Option[]> = { challenges: challengeOptions, software: softwareOptions, dataSources: dataSourceOptions, actions: actionOptions };
  for (const field of ANSWER_FIELDS) {
    if (ARRAY_FIELDS.has(field)) {
      const raw = input[field] ?? [];
      const list = cleanList(raw, lists[field]);
      if (list === null) invalidLists.add(field);
      (answers[field] as string[]) = list ?? [];
    } else {
      (answers[field] as string) = clean(input[field], MULTILINE_FIELDS.has(field));
    }
  }
  answers.contactEmail = answers.contactEmail.toLowerCase();
  answers.approverEmail = answers.approverEmail.toLowerCase();
  // Conditional "Other" text is only kept when "Other" is actually selected.
  if (answers.industry !== "other") answers.industryOther = "";
  if (!answers.challenges.includes("other")) answers.challengesOther = "";
  if (!answers.dataSources.includes("other")) answers.dataSourcesOther = "";
  if (!answers.actions.includes("other")) answers.actionsOther = "";
  return { answers, invalidLists };
}

const tooLong = (n: number) => `Please keep this under ${n} characters.`;

function text(errors: FieldErrors, field: Field, value: string, { required, max, min, message }: { required?: boolean; max: number; min?: number; message: string }) {
  if (!value) {
    if (required) errors[field] = message;
  } else if (value.length > max) errors[field] = tooLong(max);
  else if (min && value.length < min) errors[field] = "Please add a little more detail.";
}

function oneOf(errors: FieldErrors, field: Field, value: string, options: readonly Option[], message: string) {
  if (!value) errors[field] = message;
  else if (!options.some((o) => o.value === value)) errors[field] = "Please choose an option from the list.";
}

/** Validates the fields of one step. `answers` must already be normalised. */
export function validateStep(step: number, a: Answers, invalidLists: Set<Field> = new Set()): FieldErrors {
  const e: FieldErrors = {};
  const list = (field: Field, message: string) => {
    if (invalidLists.has(field)) e[field] = "Please choose options from the list.";
    else if ((a[field] as string[]).length === 0) e[field] = message;
  };
  switch (step) {
    case 0:
      text(e, "contactName", a.contactName, { required: true, max: limits.name, message: "Please enter your full name." });
      text(e, "jobTitle", a.jobTitle, { required: true, max: limits.title, message: "Please enter your job title." });
      if (!a.contactEmail) e.contactEmail = "Please enter your contact email.";
      else if (!isEmail(a.contactEmail)) e.contactEmail = "Please enter a valid email address, like name@company.com.";
      oneOf(e, "industry", a.industry, industryOptions, "Please choose your industry.");
      if (a.industry === "other") text(e, "industryOther", a.industryOther, { required: true, max: limits.shortText, message: "Please tell us your industry." });
      break;
    case 1:
      text(e, "processToAutomate", a.processToAutomate, { required: true, max: limits.longText, min: limits.longTextMin, message: "Please describe the process you'd like to automate." });
      text(e, "currentProcess", a.currentProcess, { required: true, max: limits.longText, min: limits.longTextMin, message: "Please describe how this process works today." });
      list("challenges", "Please choose at least one challenge.");
      if (a.challenges.includes("other")) text(e, "challengesOther", a.challengesOther, { required: true, max: limits.shortText, message: "Please describe the other challenge." });
      break;
    case 2:
      list("software", "Please choose at least one, or select Other.");
      text(e, "softwareOther", a.softwareOther, { required: a.software.includes("other"), max: limits.shortText, message: "Please list the other software you use." });
      list("dataSources", "Please choose at least one source.");
      if (a.dataSources.includes("other")) text(e, "dataSourcesOther", a.dataSourcesOther, { required: true, max: limits.shortText, message: "Please describe the other source." });
      oneOf(e, "dailyVolume", a.dailyVolume, volumeOptions, "Please choose an approximate daily volume.");
      list("actions", "Please choose at least one outcome.");
      if (a.actions.includes("other")) text(e, "actionsOther", a.actionsOther, { required: true, max: limits.shortText, message: "Please describe what else should happen." });
      text(e, "actionsNotes", a.actionsNotes, { max: limits.longText, message: "" });
      text(e, "approverRole", a.approverRole, { required: true, max: limits.role, message: "Please tell us who should review AI-generated actions." });
      if (!a.approverEmail) e.approverEmail = "Please enter the reviewer's work email.";
      else if (!isEmail(a.approverEmail)) e.approverEmail = "Please enter a valid email address, like name@company.com.";
      break;
    case 3:
      text(e, "successCriteria", a.successCriteria, { required: true, max: limits.longText, min: limits.longTextMin, message: "Please tell us what success looks like." });
      text(e, "additionalNotes", a.additionalNotes, { max: limits.longText, message: "" });
      break;
  }
  return e;
}

export function validateAll(a: Answers, invalidLists?: Set<Field>): FieldErrors {
  return Object.assign({}, ...stepFields.map((_, i) => validateStep(i, a, invalidLists)));
}

export type SubmissionResult = { ok: true; answers: Answers } | { ok: false; message: string; fieldErrors?: FieldErrors };

/**
 * Server-side validation of a submitted questionnaire. Strict: unknown or
 * missing keys and wrong types are rejected rather than ignored.
 */
export function validateSubmission(input: unknown): SubmissionResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, message: "The questionnaire couldn't be read." };
  const raw = input as Record<string, unknown>;
  const unexpected = Object.keys(raw).filter((k) => !(ANSWER_FIELDS as string[]).includes(k));
  if (unexpected.length > 0) return { ok: false, message: "The questionnaire contained unexpected fields." };
  for (const field of ANSWER_FIELDS) {
    const value = raw[field];
    const typeOk = ARRAY_FIELDS.has(field) ? Array.isArray(value) : typeof value === "string";
    if (!typeOk) return { ok: false, message: "The questionnaire couldn't be read." };
    // Hard caps before any processing (the per-field limits below give friendlier messages).
    if (typeof value === "string" && value.length > limits.longText * 2) return { ok: false, message: "One of the answers is too long." };
    if (Array.isArray(value) && value.length > 20) return { ok: false, message: "The questionnaire couldn't be read." };
  }
  const { answers, invalidLists } = normalize(raw as Partial<Record<Field, unknown>>);
  const fieldErrors = validateAll(answers, invalidLists);
  if (Object.keys(fieldErrors).length > 0) return { ok: false, message: "Some answers need attention.", fieldErrors };
  return { ok: true, answers };
}

const labelOf = (options: readonly Option[], value: string) => options.find((o) => o.value === value)?.label ?? value;
export const labels = {
  industry: (v: string) => labelOf(industryOptions, v),
  challenge: (v: string) => labelOf(challengeOptions, v),
  software: (v: string) => labelOf(softwareOptions, v),
  dataSource: (v: string) => labelOf(dataSourceOptions, v),
  volume: (v: string) => labelOf(volumeOptions, v),
  action: (v: string) => labelOf(actionOptions, v),
};

/**
 * The Sales Swarm payload (snake_case, grouped). The verified business name,
 * customer and project come from the server-side session, never from here.
 * Customer text is data: the Swarm must never treat it as instructions.
 */
export function toBackendPayload(a: Answers) {
  return {
    questionnaire_version: QUESTIONNAIRE_VERSION,
    contact: {
      full_name: a.contactName,
      job_title: a.jobTitle,
      // If this differs from the authorized contact, the Swarm records it as a requested
      // update to verify. It never replaces the project's authorized contact directly.
      preferred_email: a.contactEmail,
    },
    business: { industry: a.industry, industry_other: a.industryOther || null },
    workflow: {
      process_to_automate: a.processToAutomate,
      current_process: a.currentProcess,
      challenges: a.challenges,
      challenges_other: a.challengesOther || null,
    },
    automation: {
      software: a.software,
      software_other: a.softwareOther || null,
      data_sources: a.dataSources,
      data_sources_other: a.dataSourcesOther || null,
      daily_volume: a.dailyVolume,
      desired_actions: a.actions,
      desired_actions_other: a.actionsOther || null,
      desired_actions_notes: a.actionsNotes || null,
      approver: { role: a.approverRole, email: a.approverEmail },
    },
    goals: { success_criteria: a.successCriteria, additional_notes: a.additionalNotes || null },
  };
}

export type BackendPayload = ReturnType<typeof toBackendPayload>;
