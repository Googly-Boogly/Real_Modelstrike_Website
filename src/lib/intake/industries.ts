// One intake engine, configured per industry. To add an industry, add an entry
// here (plus an optional preview in src/content/intake-previews.ts): the prompt,
// output schema, routing rules and UI all derive from this config.
// Dependency-free so it can be shared by the browser, the server and node:test.

import type { IconName } from "@/components/ui/Icon";

export type FieldDef = {
  key: string;
  label: string;
  /** Instruction for the model. */
  hint: string;
  icon: IconName;
  /** "verbatim" values must appear in the message; "interpreted" ones may be rephrased. */
  grounding: "verbatim" | "interpreted";
  /** Asked for in the draft reply when the customer didn't provide it. */
  followUp?: string;
};

export type CategoryDef = {
  id: string;
  label: string;
  department: string;
  /** Hint for the model. */
  when: string;
  action: string;
};

export type IndustryConfig = {
  id: string;
  label: string;
  icon: IconName;
  blurb: string;
  /** Describes the fictional business to the model. */
  business: string;
  fields: FieldDef[];
  categories: CategoryDef[];
  /** Ask for a phone number even when an email address was provided. */
  preferPhone?: boolean;
  /** Questions that always apply to this kind of request. */
  standingQuestions?: string[];
  sample: { source: string; message: string } | null;
};

const coreFields: FieldDef[] = [
  { key: "customer_name", label: "Customer", icon: "user", grounding: "verbatim", hint: "The customer's name as they wrote it.", followUp: "your name" },
  { key: "email", label: "Email", icon: "mail", grounding: "verbatim", hint: "The customer's email address, exactly as written." },
  { key: "phone", label: "Phone", icon: "phone", grounding: "verbatim", hint: "The customer's phone number, exactly as written." },
];

export const industries: IndustryConfig[] = [
  {
    id: "hvac",
    label: "HVAC / Home Services",
    icon: "fan",
    blurb: "Repair and maintenance requests become ready-to-schedule jobs.",
    business: "a fictional HVAC and home-services company",
    preferPhone: true,
    fields: [
      ...coreFields,
      { key: "service_requested", label: "Service", icon: "wrench", grounding: "interpreted", hint: 'A short service label, e.g. "Air Conditioning Repair".' },
      { key: "problem", label: "Problem", icon: "alert", grounding: "interpreted", hint: "The issue in under 12 words." },
      { key: "location", label: "Location", icon: "pin", grounding: "verbatim", hint: "City, address or area, exactly as written.", followUp: "the service address" },
      { key: "preferred_time", label: "Requested time", icon: "calendar", grounding: "verbatim", hint: "The timing the customer asked for, exactly as written. It is a preference, not a booking." },
    ],
    categories: [
      { id: "repair", label: "HVAC Service Request", department: "Customer Service", when: "something is broken or not working", action: "Contact the customer to confirm availability." },
      { id: "maintenance", label: "Maintenance Request", department: "Service Scheduling", when: "routine tune-ups or inspections", action: "Offer available maintenance windows." },
      { id: "installation", label: "Installation or Replacement", department: "Sales", when: "new or replacement equipment", action: "Arrange a sales conversation to scope the project." },
      { id: "other", label: "General Question", department: "Customer Service", when: "anything else", action: "Review the question and reply." },
    ],
    sample: {
      source: "Website contact form",
      message:
        "Hi, my air conditioner stopped cooling yesterday. I'm located in Minneapolis, and I was wondering if someone could come look at it tomorrow afternoon. My name is Sarah Johnson, and you can reach me at sarah@example.com.",
    },
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: "briefcase",
    blurb: "New-client inquiries are qualified and routed to the right team.",
    business: "a fictional accounting firm. You see only the message: you have no access to any client's records",
    standingQuestions: ["your business's legal structure", "when you would like to get started"],
    fields: [
      ...coreFields,
      { key: "services_requested", label: "Services requested", icon: "file", grounding: "interpreted", hint: 'The services asked for, e.g. "Bookkeeping, quarterly tax preparation".' },
      { key: "company_size", label: "Company size", icon: "agent", grounding: "verbatim", hint: 'Company size as written, e.g. "eight employees".' },
      { key: "existing_software", label: "Existing software", icon: "database", grounding: "verbatim", hint: "Accounting or business software they name." },
      { key: "customer_needs", label: "Customer needs", icon: "search", grounding: "interpreted", hint: "What they need, in under 15 words." },
    ],
    categories: [
      { id: "new_client", label: "New Client Inquiry", department: "New Business Team", when: "a prospective client asking about services", action: "Schedule an introductory call with the new business team." },
      { id: "existing_client", label: "Existing Client Request", department: "Client Services", when: "someone who says they are already a client", action: "Route to the client's account manager." },
      { id: "other", label: "General Question", department: "Front Office", when: "anything else", action: "Review the question and reply." },
    ],
    sample: {
      source: "Email inbox",
      message:
        "Hello, I'm looking for an accounting firm to handle bookkeeping and quarterly tax preparation for my small business. We have eight employees and use QuickBooks. Could someone contact me about your services?",
    },
  },
  {
    id: "property",
    label: "Property Management",
    icon: "droplet",
    blurb: "Tenant messages become structured maintenance requests.",
    business: "a fictional property management company",
    standingQuestions: ["whether maintenance may enter the unit if you are not home"],
    fields: [
      ...coreFields,
      { key: "property_address", label: "Property", icon: "pin", grounding: "verbatim", hint: "Property address as written, without the unit.", followUp: "the property address" },
      { key: "unit", label: "Unit", icon: "inbox", grounding: "verbatim", hint: "Unit or apartment number as written.", followUp: "your unit number" },
      { key: "maintenance_problem", label: "Maintenance problem", icon: "wrench", grounding: "interpreted", hint: "The problem in under 12 words." },
      { key: "relevant_details", label: "Relevant details", icon: "file", grounding: "interpreted", hint: "Other useful details from the message: when it started, what is affected." },
    ],
    categories: [
      { id: "maintenance", label: "Maintenance Request", department: "Maintenance Coordination", when: "repairs or building problems", action: "Create a work order and contact the tenant to arrange access." },
      { id: "lease_billing", label: "Lease or Billing Question", department: "Property Office", when: "rent, lease or billing questions", action: "Review the account question and reply." },
      { id: "other", label: "General Question", department: "Property Office", when: "anything else", action: "Review the question and reply." },
    ],
    sample: {
      source: "Tenant portal",
      message: "Hi, I'm a tenant at 245 Oak Street, unit 3. Our kitchen sink has been leaking since yesterday and water is collecting under the cabinet. Can someone arrange maintenance?",
    },
  },
  {
    id: "custom",
    label: "Try Your Own Example",
    icon: "pencil",
    blurb: "Write a fictional inquiry for any kind of business.",
    business: "a fictional small business of unspecified type. Infer the kind of business only from the message",
    fields: [
      ...coreFields,
      { key: "organization", label: "Organization", icon: "briefcase", grounding: "verbatim", hint: "The customer's company or organization, as written." },
      { key: "service_requested", label: "Service", icon: "wrench", grounding: "interpreted", hint: "A short label for what they want." },
      { key: "problem", label: "Details", icon: "file", grounding: "interpreted", hint: "The request in under 15 words." },
      { key: "location", label: "Location", icon: "pin", grounding: "verbatim", hint: "City, address or area, exactly as written." },
      { key: "preferred_time", label: "Requested time", icon: "calendar", grounding: "verbatim", hint: "The timing the customer asked for, exactly as written. It is a preference, not a booking." },
    ],
    categories: [
      { id: "service_request", label: "Service Request", department: "Customer Service", when: "asks for work to be done", action: "Contact the customer to confirm next steps." },
      { id: "sales_inquiry", label: "Sales Inquiry", department: "Sales", when: "asks about products, services or pricing", action: "Follow up with information about the relevant service." },
      { id: "support", label: "Support Issue", department: "Customer Support", when: "reports a problem with something already purchased", action: "Review the issue and reply." },
      { id: "billing", label: "Billing Question", department: "Accounts", when: "invoices or payments", action: "Review the account question and reply." },
      { id: "other", label: "General Question", department: "Customer Service", when: "anything else", action: "Review the question and reply." },
    ],
    sample: null,
  },
];

export const defaultIndustry = industries[0];

export function getIndustry(id: unknown): IndustryConfig | undefined {
  return industries.find((i) => i.id === id);
}
