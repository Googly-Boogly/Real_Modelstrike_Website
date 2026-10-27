import type { IconName } from "@/components/ui/Icon";

export type Service = {
  id: string;
  icon: IconName;
  name: string;
  /** One-line summary used on cards. */
  summary: string;
  /** Short bullet list used on homepage cards. */
  highlights: string[];
  problem: string;
  whatItDoes: string;
  useCases: string[];
  integrations: string[];
  process: string[];
  involvement: string[];
  /** Shown on the homepage service grid. Maintenance is folded into integrations there. */
  featured: boolean;
};

export const services: Service[] = [
  {
    id: "intake",
    icon: "inbox",
    name: "AI Customer Intake",
    summary:
      "Automatically sort, understand, and organize incoming customer inquiries so nothing sits unread and every request reaches the right person.",
    highlights: [
      "Email and web-form classification",
      "Information extraction",
      "CRM record creation",
      "Drafted replies and staff notifications",
    ],
    problem:
      "Customer requests arrive by email, website form, and voicemail transcripts. Someone has to read each one, figure out what the customer needs, copy the details into your software, and decide who should follow up. On a busy day, that queue grows faster than anyone can work through it.",
    whatItDoes:
      "An intake automation reads each new inquiry, pulls out the details that matter — service needed, urgency, location, preferred time — and turns it into a structured work item. It can create or update a record in your CRM, prepare a draft reply for your team to review, and notify the right employee.",
    useCases: [
      "Classifying incoming emails by service type and urgency",
      "Turning website form submissions into organized work requests",
      "Extracting names, addresses, and appointment preferences",
      "Creating or updating CRM contacts and jobs",
      "Drafting customer replies for staff approval",
      "Alerting the on-call technician or office manager",
    ],
    integrations: ["Shared inboxes (Gmail, Outlook)", "Website forms", "CRMs and field-service platforms", "Team chat and SMS notifications"],
    process: [
      "Map how inquiries arrive today and where they need to go",
      "Define the categories, fields, and routing rules that fit your business",
      "Build and test the automation against sample inquiries",
      "Roll out with a human review step, then adjust based on real use",
    ],
    involvement: [
      "Walk us through how your team handles requests today",
      "Share example inquiries (with personal details removed where needed)",
      "Grant access to the tools the automation will connect to",
      "Review drafts and categorizations during testing",
    ],
    featured: true,
  },
  {
    id: "workflow",
    icon: "workflow",
    name: "Business Workflow Automation",
    summary:
      "Connect the software you already use and take routine administrative steps — data entry, routing, reminders, reports — off your team's plate.",
    highlights: ["Data entry between systems", "Document processing", "Routing and internal notifications", "Scheduled reporting"],
    problem:
      "A lot of office work is moving information from one place to another: retyping invoice details, copying job notes into spreadsheets, forwarding documents, and assembling the same weekly report. It's necessary, but it doesn't need a person's judgment every time.",
    whatItDoes:
      "We automate the repetitive steps between your systems. AI handles the parts that used to require reading — like pulling fields from a document or deciding which queue a request belongs in — while conventional automation moves the data reliably from step to step.",
    useCases: [
      "Copying information between email, spreadsheets, and business software",
      "Extracting fields from invoices, quotes, and forms",
      "Routing requests to the right team or queue",
      "Sending internal notifications when something needs attention",
      "Transferring routine information between systems on a schedule",
      "Generating recurring summary reports",
    ],
    integrations: ["Spreadsheets (Google Sheets, Excel)", "Accounting and invoicing tools", "Document storage", "Business APIs and webhooks"],
    process: [
      "Identify the steps that repeat and the rules behind them",
      "Design a workflow that keeps people in control of exceptions",
      "Build, connect, and test with realistic data",
      "Deploy gradually and monitor results",
    ],
    involvement: [
      "Explain the current process, including the exceptions",
      "Provide sample documents or records for testing",
      "Confirm which steps should require human approval",
      "Give feedback during the testing period",
    ],
    featured: true,
  },
  {
    id: "agents",
    icon: "agent",
    name: "Custom AI Agents",
    summary:
      "AI assistants built for a specific job in your business — with tools and permissions scoped to exactly what that job requires.",
    highlights: ["Internal knowledge assistants", "Customer-support assistants", "Document research", "Task and workflow coordination"],
    problem:
      "Your team spends time searching for answers that already exist somewhere — in manuals, past jobs, policies, or price sheets — and answering the same customer questions over and over.",
    whatItDoes:
      "A custom AI agent is an assistant designed around one clearly defined task. It can look up information in your documents, answer questions, help prepare work, or coordinate steps across tools. We decide together what it's allowed to access and do, and keep a person in the loop wherever decisions matter.",
    useCases: [
      "An internal assistant that answers questions from your manuals and policies",
      "A support assistant that helps answer common customer questions",
      "Researching and summarizing long documents",
      "Coordinating multi-step workflows across tools",
      "Retrieving job, customer, or product information on request",
      "Helping staff prepare quotes, notes, or follow-ups",
    ],
    integrations: ["Document libraries and knowledge bases", "Internal databases", "CRMs and ticketing tools", "Chat interfaces for staff or customers"],
    process: [
      "Define the agent's job, boundaries, and success criteria",
      "Decide which data and tools it can use — and which it can't",
      "Build and evaluate it against real questions and tasks",
      "Launch to a small group first, then expand",
    ],
    involvement: [
      "Help define what the agent should and shouldn't do",
      "Provide the documents or data it should draw from",
      "Test it with the questions your team and customers actually ask",
      "Decide on approval steps for any actions it takes",
    ],
    featured: true,
  },
  {
    id: "integrations",
    icon: "plug",
    name: "AI Integrations & Maintenance",
    summary:
      "Add AI capabilities to the software you already run, and keep those workflows monitored, maintained, and improving.",
    highlights: ["CRM and email integrations", "Internal databases and business APIs", "Automation monitoring", "Ongoing improvements"],
    problem:
      "Most businesses don't want another app to log into. They want the tools they already pay for to do more — and they need someone to keep the connections working when those tools change.",
    whatItDoes:
      "We connect AI functionality directly to your existing systems through their available APIs and integrations, so results appear where your team already works. Where a direct integration isn't available, we'll tell you and look at practical alternatives.",
    useCases: [
      "Connecting AI classification or extraction to your CRM",
      "Adding AI-drafted replies inside your email workflow",
      "Reading from and writing to internal databases",
      "Linking business systems that don't talk to each other",
    ],
    integrations: ["CRMs", "Email platforms", "Internal databases", "Business APIs and webhooks"],
    process: [
      "Review the systems you use and what integrations they support",
      "Design the connection and the data each side needs",
      "Build with appropriate access controls and test end to end",
      "Hand over documentation and an agreed support plan",
    ],
    involvement: [
      "Share which software you use and who administers it",
      "Arrange API access or admin credentials through a secure channel",
      "Confirm how data should flow between systems",
      "Approve the integration before it goes live",
    ],
    featured: true,
  },
  {
    id: "maintenance",
    icon: "wrench",
    name: "Automation Maintenance",
    summary:
      "Ongoing care for the automations we build: monitoring, fixes when connected software changes, and improvements as your business evolves.",
    highlights: ["Monitoring", "Fixes when connected tools change", "Prompt and rule tuning", "New use cases over time"],
    problem:
      "Automations depend on other software. When a vendor changes an API, a form gets a new field, or your process changes, an unattended automation can quietly stop doing its job.",
    whatItDoes:
      "Maintenance keeps your workflows healthy. We monitor for errors, update integrations when connected software changes, tune AI instructions based on real results, and help you extend the automation when new needs come up — according to the terms of your support agreement.",
    useCases: [
      "Monitoring automations for failures and unusual results",
      "Updating integrations after a software vendor makes changes",
      "Improving classification or extraction accuracy over time",
      "Adding new categories, fields, or routing rules",
    ],
    integrations: ["Error alerts and logs", "The systems your automation already connects to"],
    process: [
      "Agree on what's monitored and how issues are reported",
      "Respond to problems according to the support agreement",
      "Review performance periodically and recommend improvements",
    ],
    involvement: [
      "Let us know when your process or software changes",
      "Flag results that don't look right",
      "Join occasional check-ins to prioritize improvements",
    ],
    featured: false,
  },
];

export const featuredServices = services.filter((s) => s.featured);
