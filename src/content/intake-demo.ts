// Copy for the /demo page. Fictional inbox samples live in src/lib/intake/industries.ts.

export const intakeDemoCopy = {
  meta: {
    title: "Interactive AI Automation Demo",
    description:
      "See AI automation in action. Watch ModelStrike turn customer inquiries into organized records and draft replies for your team to approve — for HVAC, accounting and property management.",
  },
  hero: {
    eyebrow: "Interactive Demonstration",
    title: "See AI Automation in Action",
    subtitle: "Experience how ModelStrike transforms incoming customer requests into organized, actionable information—reducing repetitive work while keeping your team in control.",
    primary: "Launch Interactive Demo",
    experience: [
      { icon: "inbox", text: "Pick a customer request from a sample inbox" },
      { icon: "sparkle", text: "Watch AI extract, classify and organize it" },
      { icon: "check", text: "Review, edit and approve the reply yourself" },
    ],
    trust: "About 3 minutes. No account required. Fictional data only. No emails are ever sent.",
  },
  cta: {
    title: "Ready to Automate Your Business?",
    body: "ModelStrike builds custom AI automation solutions that reduce repetitive work and integrate with your existing business processes.",
    points: ["Built around your inbox, forms and software", "Your team approves anything customers see", "Scoped in writing before work begins"],
    offer: {
      eyebrow: "Founding customer offer",
      title: "Founding Customer Pilot — Starting at $950",
      note: "Final pricing depends on the project scope we agree on together after the consultation.",
    },
    secondary: { label: "Discuss Automation for Your Business", href: "/contact" },
  },
} as const;
