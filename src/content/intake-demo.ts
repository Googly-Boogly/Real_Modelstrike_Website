// Copy for the /demo page. Fictional examples live in src/lib/intake/industries.ts.

export const intakeDemoCopy = {
  meta: {
    title: "Interactive AI Automation Demo",
    description: "Experience AI business automation in action. See how ModelStrike organizes customer inquiries, extracts information, and prepares responses for human approval.",
  },
  hero: {
    eyebrow: "Interactive Demonstration",
    title: "See AI Automation in Action",
    subtitle: "Watch how AI can turn incoming customer requests into organized information, prioritized tasks, and ready-to-review responses—in seconds.",
    body: "Choose an industry, try a sample customer inquiry, and see how ModelStrike could automate the repetitive work your team handles every day.",
    primary: "Try the Interactive Demo",
    trust: "No account required. No emails sent. Demo data only.",
  },
  customNotice: "Please use fictional examples. Do not enter confidential, financial, medical, or other sensitive information.",
  previewLabel: "Example Preview — Not Live AI Processing",
  previewExplainer: "This is a precomputed sample for the original example message. No AI model processed anything just now.",
  offlineNotice: "Live AI isn't turned on right now, so you can view a precomputed example. Your own text can't be processed until it's back.",
  review: {
    approved: "Approved for demonstration. In a production system, an authorized workflow could now send this response.",
    rejected: "Rejected for demonstration. Nothing would be sent, and the request would stay with your team to handle directly.",
    revision: "Revision requested for demonstration. In a production system, the draft would go back for changes before anyone could approve it.",
    footnote: "These controls work only inside this demonstration. No email is sent and no record is created.",
  },
  afterDemo: {
    title: "Want This Automation for Your Business?",
    body: "ModelStrike builds custom AI automation that works with your existing processes and software. Tell us what your team spends time doing manually, and we'll explore whether automation could help.",
    secondary: { label: "Tell Us What You Want to Automate", href: "/contact" },
  },
  benefits: {
    title: "Less Administrative Work. More Time for Your Business.",
    items: [
      { icon: "database", title: "Organize Customer Inquiries", body: "Turn incoming requests into structured information without manually copying every detail." },
      { icon: "refresh", title: "Reduce Repetitive Work", body: "Prepare routine classifications, summaries, and response drafts." },
      { icon: "check", title: "Improve Response Consistency", body: "Help employees respond using relevant information and approved business procedures." },
      { icon: "shield", title: "Keep Humans in Control", body: "Employees can review important decisions and communications before anything is sent." },
    ],
  },
  comparison: {
    eyebrow: "Before and after",
    title: "How the Workflow Changes",
    note: "An illustration of a typical intake process. The demo above isn't connected to any real business's systems.",
    before: {
      title: "Before ModelStrike",
      intro: "A customer sends an email. An employee must:",
      steps: ["Open the message.", "Read the inquiry.", "Identify the customer's needs.", "Copy information into another system.", "Decide who should handle the request.", "Write a response.", "Send the response."],
    },
    after: {
      title: "With ModelStrike",
      intro: "The automation:",
      steps: ["Reads the inquiry.", "Extracts structured information.", "Suggests categorization and routing.", "Prepares a response.", "Presents the results for employee approval."],
      outro: "The employee reviews and completes the process.",
    },
  },
  finalCta: {
    title: "See What Your Team Could Stop Doing by Hand",
    body: "Bring one repetitive process to a conversation. We'll tell you honestly whether automation is a practical fit.",
  },
} as const;
