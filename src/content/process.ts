import type { IconName } from "@/components/ui/Icon";

export type ProcessStep = { title: string; body: string; icon: IconName };

/** The short, four-step version used on the homepage. */
export const processOverview: ProcessStep[] = [
  {
    title: "Discover",
    icon: "search",
    body: "We learn how your business operates and identify repetitive tasks that may benefit from automation.",
  },
  {
    title: "Design",
    icon: "blueprint",
    body: "We develop a practical automation plan based on your existing workflows and software.",
  },
  {
    title: "Build",
    icon: "code",
    body: "We develop, integrate, and test the automation.",
  },
  {
    title: "Maintain",
    icon: "refresh",
    body: "We help monitor, maintain, and improve the automation over time.",
  },
];

export type EngagementStep = {
  title: string;
  summary: string;
  details: string[];
  /** What we need from the customer at this stage. */
  you: string;
};

/** The detailed engagement process used on /how-it-works. */
export const engagementSteps: EngagementStep[] = [
  {
    title: "Initial Consultation",
    summary: "Understand the business and existing workflow.",
    details: [
      "A conversation about how your business runs day to day",
      "Where repetitive work piles up and what it costs your team in time",
      "Which software you already use",
    ],
    you: "Tell us about the work that slows you down. No preparation or technical knowledge needed.",
  },
  {
    title: "Automation Assessment",
    summary: "Identify promising opportunities and technical requirements.",
    details: [
      "Review the specific workflows worth automating first",
      "Check what your existing tools support — APIs, integrations, exports",
      "Note data-handling, permission, and review requirements",
      "Be candid about anything that isn't a good fit for AI",
    ],
    you: "Share example inquiries, documents, or screenshots of the current process.",
  },
  {
    title: "Proposal",
    summary: "Define scope, integrations, deliverables, timeline, and pricing.",
    details: [
      "A written scope describing what will be built and what won't",
      "The systems involved and how data will move between them",
      "Deliverables, an estimated timeline, and pricing",
      "Support options after launch",
    ],
    you: "Review the proposal and ask questions. Nothing starts until you agree to it.",
  },
  {
    title: "Implementation",
    summary: "Build the agreed solution.",
    details: [
      "Develop the automation and connect it to your systems",
      "Use the minimum access each integration needs",
      "Share progress and check decisions with you along the way",
    ],
    you: "Provide access to the agreed tools and answer questions as they come up.",
  },
  {
    title: "Testing and Deployment",
    summary: "Validate the workflow with appropriate test data before rollout.",
    details: [
      "Test against realistic sample data and edge cases",
      "Start with human review of AI output where appropriate",
      "Roll out gradually and confirm results with your team",
      "Provide documentation for how the workflow operates",
    ],
    you: "Try the workflow, flag anything unexpected, and approve the go-live.",
  },
  {
    title: "Ongoing Support",
    summary: "Provide maintenance services according to the customer agreement.",
    details: [
      "Monitor the automation and fix issues",
      "Update integrations when connected software changes",
      "Recommend and build improvements over time",
    ],
    you: "Let us know when your process changes or something doesn't look right.",
  },
];
