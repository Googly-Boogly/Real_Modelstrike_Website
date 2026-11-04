// One intake engine, configured per industry. To add an industry, add an entry
// here (plus previews for its samples in src/content/intake-previews.ts): the
// prompt, output schema, rules, record layout and UI wording all derive from it.
// Dependency-free so it can be shared by the browser, the server and node:test.

import type { IconName } from "@/components/ui/Icon";
import type { Signal } from "./schema.ts";

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
  /** Opening line of a template reply. */
  thanks: string;
};

/**
 * Priority rules, decided in code. Any group in `immediate` whose signals are
 * all present → Immediate Review; any signal in `soon` → Review Soon.
 * A safety keyword in the message always means Immediate Review.
 */
export type PriorityRules = { immediate: Signal[][]; soon: Signal[] };

/** A fictional message in the demo inbox. */
export type InboxSample = {
  id: string;
  name: string | null;
  email: string | null;
  subject: string;
  receivedAt: string;
  body: string;
};

export type IndustryTerms = {
  customer: string;
  inbox: string;
  record: string;
  response: string;
  /** The workflow in this industry's words, shown under the selector. */
  workflow: string[];
};

export type IndustryConfig = {
  id: string;
  label: string;
  icon: IconName;
  blurb: string;
  /** Describes the fictional business to the model. */
  business: string;
  /** Sign-off on drafted replies. */
  signature: string;
  terms: IndustryTerms;
  fields: FieldDef[];
  categories: CategoryDef[];
  priority: PriorityRules;
  /** Ask for a phone number even when an email address was provided. */
  preferPhone?: boolean;
  /** Questions that always apply to this kind of request. */
  standingQuestions?: string[];
  samples: InboxSample[];
};

const coreFields: FieldDef[] = [
  { key: "customer_name", label: "Name", icon: "user", grounding: "verbatim", hint: "The customer's name as they wrote it, in the From line or the message.", followUp: "your name" },
  { key: "email", label: "Email", icon: "mail", grounding: "verbatim", hint: "The customer's email address, exactly as written." },
  { key: "phone", label: "Phone", icon: "phone", grounding: "verbatim", hint: "The customer's phone number, exactly as written." },
];

export const coreFieldKeys = new Set(coreFields.map((f) => f.key));

export const industries: IndustryConfig[] = [
  {
    id: "hvac",
    label: "HVAC / Home Services",
    icon: "fan",
    blurb: "Repair and maintenance requests become ready-to-schedule service records.",
    business: "a fictional HVAC and home-services company",
    signature: "Customer Service Team",
    preferPhone: true,
    terms: {
      customer: "Customer",
      inbox: "Customer Inbox",
      record: "Customer Record",
      response: "Customer Response",
      workflow: ["Customer inquiry", "AI extraction", "Service classification", "Customer record", "Draft response", "Employee approval"],
    },
    fields: [
      ...coreFields,
      { key: "service_requested", label: "Requested service", icon: "wrench", grounding: "interpreted", hint: 'A short service label, e.g. "Air Conditioning Repair".' },
      { key: "problem", label: "Issue", icon: "alert", grounding: "interpreted", hint: "The issue in under 12 words." },
      { key: "location", label: "Service address", icon: "pin", grounding: "verbatim", hint: "City, address or area, exactly as written.", followUp: "the service address" },
      { key: "preferred_time", label: "Preferred time", icon: "calendar", grounding: "verbatim", hint: "The timing the customer asked for, exactly as written. It is a preference, not a booking." },
    ],
    categories: [
      { id: "cooling_repair", label: "Air Conditioning Repair", department: "Service Dispatch", when: "air conditioning or cooling is broken or not working", action: "Call the customer to confirm details and offer available times.", thanks: "Thank you for contacting us about your air conditioning." },
      { id: "heating_repair", label: "Heating Repair", department: "Service Dispatch", when: "a furnace, boiler, heat pump or heating is broken or not working", action: "Call the customer to confirm details and offer available times.", thanks: "Thank you for contacting us about your heating system." },
      { id: "maintenance", label: "Routine Maintenance", department: "Service Scheduling", when: "routine tune-ups, inspections or seasonal maintenance", action: "Offer available maintenance windows.", thanks: "Thank you for reaching out about maintenance for your system." },
      { id: "installation", label: "Installation or Replacement", department: "Sales", when: "new or replacement equipment", action: "Arrange a sales conversation to scope the project.", thanks: "Thank you for your interest in new equipment." },
      { id: "other", label: "General Question", department: "Customer Service", when: "anything else", action: "Review the question and reply.", thanks: "Thank you for getting in touch." },
    ],
    priority: { immediate: [["safety_risk"], ["service_outage", "vulnerable_people"]], soon: ["active_damage", "service_outage", "vulnerable_people", "stated_deadline"] },
    samples: [
      {
        id: "hvac-ac",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        subject: "Air Conditioner Not Working",
        receivedAt: "8:12 AM",
        body: "Hello,\n\nMy air conditioner stopped working this morning. It's getting hot inside the house.\n\nCould someone come tomorrow?\n\nThanks,\nSarah",
      },
      {
        id: "hvac-maintenance",
        name: "Michael Smith",
        email: "m.smith@example.com",
        subject: "Annual AC Maintenance",
        receivedAt: "8:47 AM",
        body: "Hi there,\n\nI'd like to set up our annual AC tune-up before the summer. We're at 1820 Maple Avenue, Edina. Weekday mornings work best for us.\n\nMy cell is (612) 555-0148.\n\nThanks,\nMichael Smith",
      },
      {
        id: "hvac-furnace",
        name: "Emily Davis",
        email: "emily.davis@example.com",
        subject: "Furnace Failure",
        receivedAt: "9:05 AM",
        body: "Our furnace stopped working overnight and the house is down to 58 degrees. We have a newborn at home.\n\nWe're at 47 Birch Lane, St. Paul. Please call 651-555-0192 as soon as you can.\n\nEmily Davis",
      },
      {
        id: "hvac-emergency",
        name: "D. Patel",
        email: "dpatel@example.com",
        subject: "Do you offer emergency service?",
        receivedAt: "9:31 AM",
        body: "Hi, there's a burning smell coming from our vents whenever the heat kicks on. Do you offer emergency service?\n\nThe address is 3305 Lake Street, Minneapolis.",
      },
    ],
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: "briefcase",
    blurb: "Client emails become organized intake records with documents and deadlines flagged.",
    business: "a fictional accounting firm. You see only the message: you have no access to any client's records",
    signature: "Client Services Team",
    terms: {
      customer: "Client",
      inbox: "Client Inbox",
      record: "Client Intake Record",
      response: "Follow-Up Draft",
      workflow: ["Client inquiry", "AI extraction", "Document classification", "Client intake record", "Follow-up draft", "Employee approval"],
    },
    fields: [
      ...coreFields,
      { key: "services_requested", label: "Service needed", icon: "file", grounding: "interpreted", hint: 'The services asked about, e.g. "Bookkeeping, quarterly tax preparation".' },
      { key: "documents", label: "Documents mentioned", icon: "copy", grounding: "interpreted", hint: "Tax forms or documents the client mentions, e.g. W-2, 1099." },
      { key: "deadline", label: "Deadline or timing", icon: "calendar", grounding: "verbatim", hint: "Any deadline or timing, exactly as written." },
      { key: "company_size", label: "Company size", icon: "agent", grounding: "verbatim", hint: 'Company size as written, e.g. "eight employees".' },
      { key: "existing_software", label: "Existing software", icon: "database", grounding: "verbatim", hint: "Accounting or business software they name." },
    ],
    categories: [
      { id: "missing_documents", label: "Missing Tax Documents", department: "Tax Team", when: "a document the client needs is missing, late or incorrect", action: "Have the tax team reply with next steps for the missing document.", thanks: "Thank you for letting us know about the missing document." },
      { id: "document_submission", label: "Document Submission Question", department: "Client Services", when: "how or where to send documents", action: "Reply with the firm's approved secure upload instructions.", thanks: "Thank you for getting your documents together." },
      { id: "bookkeeping", label: "Bookkeeping Inquiry", department: "Bookkeeping Team", when: "bookkeeping, reconciliation or ledger questions", action: "Assign to the bookkeeping team for review.", thanks: "Thank you for your bookkeeping question." },
      { id: "new_client", label: "New Client Onboarding", department: "New Business Team", when: "a prospective client asking about services or getting started", action: "Schedule an introductory call with the new business team.", thanks: "Thank you for considering our firm." },
      { id: "other", label: "General Question", department: "Front Office", when: "anything else", action: "Review the question and reply.", thanks: "Thank you for getting in touch." },
    ],
    priority: { immediate: [["safety_risk"]], soon: ["stated_deadline"] },
    samples: [
      {
        id: "acct-missing",
        name: "Robert Chen",
        email: "robert.chen@example.com",
        subject: "Missing 1099 for my tax return",
        receivedAt: "7:58 AM",
        body: "Hi,\n\nI'm finishing my 2025 tax return and I still haven't received a 1099-NEC from one of my clients. The filing deadline is April 15. What should I do, and do you need anything else from me?\n\nRobert Chen",
      },
      {
        id: "acct-onboarding",
        name: "Lisa Moreno",
        email: "lisa@example.com",
        subject: "Looking for a new accounting firm",
        receivedAt: "8:30 AM",
        body: "Hello,\n\nI own a small bakery with eight employees, and we're looking for a new accounting firm for bookkeeping and quarterly tax preparation. We currently use QuickBooks.\n\nWhat does getting started with you look like?\n\nLisa Moreno\nMoreno Bakery",
      },
      {
        id: "acct-bookkeeping",
        name: null,
        email: "jkline@example.com",
        subject: "Reconciliation doesn't match",
        receivedAt: "9:14 AM",
        body: "Quick question: our March bank reconciliation in Xero is off from the statement by a few hundred dollars. Can someone on the bookkeeping team take a look?",
      },
      {
        id: "acct-documents",
        name: "Angela Brooks",
        email: "angela.b@example.com",
        subject: "How do I send my documents?",
        receivedAt: "9:52 AM",
        body: "Hi,\n\nI have my W-2 forms, mortgage interest statement, and receipts ready. What's the best way to send them to you securely? I'd rather not email them.\n\nThanks,\nAngela",
      },
    ],
  },
  {
    id: "property",
    label: "Property Management",
    icon: "droplet",
    blurb: "Tenant messages become structured work-order drafts.",
    business: "a fictional property management company",
    signature: "Maintenance Team",
    terms: {
      customer: "Tenant",
      inbox: "Tenant Requests",
      record: "Work-Order Draft",
      response: "Tenant Response",
      workflow: ["Tenant request", "AI extraction", "Maintenance classification", "Work-order draft", "Tenant response", "Employee approval"],
    },
    fields: [
      ...coreFields,
      { key: "property_address", label: "Property", icon: "pin", grounding: "verbatim", hint: "Property address as written, without the unit.", followUp: "the property address" },
      { key: "unit", label: "Unit", icon: "inbox", grounding: "verbatim", hint: "Unit or apartment number as written.", followUp: "your unit number" },
      { key: "maintenance_problem", label: "Problem", icon: "wrench", grounding: "interpreted", hint: "The problem in under 12 words." },
      { key: "entry_permission", label: "Entry permission", icon: "shield", grounding: "interpreted", hint: "Whether the tenant says maintenance may enter when they are not home. Null unless stated.", followUp: "whether maintenance may enter the unit if you are not home" },
      { key: "relevant_details", label: "Details", icon: "file", grounding: "interpreted", hint: "Other useful details from the message: when it started, what is affected." },
    ],
    categories: [
      { id: "plumbing", label: "Plumbing", department: "Maintenance Coordination", when: "leaks, clogs, toilets, sinks, water heaters", action: "Create a work order for a plumber and arrange access with the tenant.", thanks: "Thank you for reporting the plumbing problem." },
      { id: "hvac", label: "Heating / Cooling", department: "Maintenance Coordination", when: "heat, air conditioning or ventilation problems", action: "Create a work order for an HVAC technician and arrange access.", thanks: "Thank you for letting us know about the heating or cooling problem." },
      { id: "appliance", label: "Appliance Repair", department: "Maintenance Coordination", when: "dishwasher, fridge, stove, washer or dryer", action: "Create a work order and confirm the appliance details with the tenant.", thanks: "Thank you for reporting the appliance problem." },
      { id: "general_maintenance", label: "Routine Maintenance", department: "Maintenance Coordination", when: "non-urgent repairs and upkeep", action: "Add to the next scheduled maintenance visit for the building.", thanks: "Thank you for the maintenance request." },
      { id: "other", label: "General Question", department: "Property Office", when: "lease, billing or anything else", action: "Review the question and reply.", thanks: "Thank you for getting in touch." },
    ],
    priority: { immediate: [["safety_risk"], ["service_outage", "vulnerable_people"]], soon: ["active_damage", "service_outage", "vulnerable_people"] },
    samples: [
      {
        id: "prop-leak",
        name: "Maria Lopez",
        email: "maria.lopez@example.com",
        subject: "Kitchen sink leaking",
        receivedAt: "7:44 AM",
        body: "Hi, I'm a tenant at 245 Oak Street, unit 3. Our kitchen sink has been leaking since yesterday and water is collecting under the cabinet. Can someone arrange maintenance?\n\nMaria",
      },
      {
        id: "prop-heat",
        name: "James Wilson",
        email: "jwilson@example.com",
        subject: "No heat in my apartment",
        receivedAt: "8:20 AM",
        body: "The heat in my apartment (Unit 12B, 900 Pine Court) hasn't worked since last night. The thermostat is on but nothing comes out of the vents. My elderly mother lives with me.\n\nPlease call me at 612-555-0134.\n\nJames Wilson",
      },
      {
        id: "prop-routine",
        name: "Priya Shah",
        email: "priya.shah@example.com",
        subject: "Noisy bathroom fan",
        receivedAt: "9:02 AM",
        body: "Hi, the bathroom exhaust fan in unit 7 at 245 Oak Street has gotten really loud. Not urgent; whenever maintenance is in the building is fine. You can go in if I'm not home.\n\nThanks,\nPriya Shah",
      },
      {
        id: "prop-incomplete",
        name: null,
        email: "tenant4471@example.com",
        subject: "dishwasher",
        receivedAt: "9:40 AM",
        body: "The dishwasher isn't draining again. Can someone come look?",
      },
    ],
  },
];

export const defaultIndustry = industries[0];

export function getIndustry(id: unknown): IndustryConfig | undefined {
  return industries.find((i) => i.id === id);
}
