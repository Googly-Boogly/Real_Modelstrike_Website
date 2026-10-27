import type { IconName } from "@/components/ui/Icon";

export type Industry = {
  id: string;
  icon: IconName;
  name: string;
  summary: string;
  /** Repetitive work that commonly shows up in this kind of business. */
  workflows: string[];
  /** Potential automations — examples, not delivered projects. */
  ideas: string[];
};

export const industries: Industry[] = [
  {
    id: "hvac",
    icon: "fan",
    name: "HVAC Companies",
    summary: "Organize customer service requests, classify inquiries, and streamline administrative workflows.",
    workflows: [
      "Sorting repair, maintenance, and installation requests",
      "Spotting urgent no-heat or no-cooling calls in a busy inbox",
      "Re-entering customer and equipment details into job software",
      "Following up on seasonal maintenance reminders",
    ],
    ideas: [
      "Classify inquiries by service type and urgency as they arrive",
      "Extract equipment, symptoms, and preferred times into a work item",
      "Draft confirmation replies for office staff to approve",
    ],
  },
  {
    id: "plumbing",
    icon: "droplet",
    name: "Plumbing Companies",
    summary: "Process incoming service inquiries, capture customer information, and create organized work requests.",
    workflows: [
      "Separating emergencies like leaks from routine requests",
      "Collecting addresses, access notes, and photos from customers",
      "Copying request details into scheduling or dispatch tools",
      "Answering the same questions about service areas and availability",
    ],
    ideas: [
      "Turn emails and form submissions into structured work requests",
      "Flag likely emergencies for immediate human attention",
      "Prepare customer records in your CRM automatically",
    ],
  },
  {
    id: "electrical",
    icon: "bolt",
    name: "Electrical Contractors",
    summary: "Streamline administrative intake, customer communications, and information management.",
    workflows: [
      "Triaging service calls, quote requests, and project inquiries",
      "Gathering job details before a site visit or estimate",
      "Keeping customer communication consistent across the team",
      "Organizing job documents, permits, and notes",
    ],
    ideas: [
      "Route quote requests and service calls to the right person",
      "Summarize long customer emails into the key job details",
      "Build an internal assistant for policies, price sheets, and procedures",
    ],
  },
  {
    id: "other",
    icon: "briefcase",
    name: "Other Service Businesses",
    summary: "Develop custom automations for repetitive workflows and existing software systems.",
    workflows: [
      "Manual data entry between email, spreadsheets, and business software",
      "Inquiries that need sorting before anyone can respond",
      "Documents that need to be read, summarized, or filed",
      "Recurring reports assembled by hand",
    ],
    ideas: [
      "Assess where automation could realistically save time",
      "Connect the tools you already use",
      "Build an assistant for a specific, well-defined task",
    ],
  },
];
