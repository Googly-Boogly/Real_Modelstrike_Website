// Fictional data for the simulated intake demo. No real customer or company.

export const demo = {
  company: "Northwind Heating & Air (fictional)",
  customer: { name: "Jordan Rivera", channel: "Website contact form", receivedAt: "Today, 8:42 AM" },
  message: "My air conditioner stopped working this morning. Can someone come out tomorrow afternoon?",
  extraction: [
    ["service", "HVAC Repair"],
    ["issue", "Air conditioner not working"],
    ["urgency", "High"],
    ["preferred_appointment", "Tomorrow afternoon"],
  ] as [string, string][],
  actions: [
    { label: "Created structured work item", detail: "WR-1042 · AC repair · High priority" },
    { label: "Prepared CRM record", detail: "Contact + job details ready to sync" },
    { label: "Drafted customer response", detail: "Confirms request, asks for address" },
    { label: "Notified service coordinator", detail: "Assigned to the dispatch queue" },
  ],
  workItem: {
    id: "WR-1042",
    title: "AC not working — repair visit",
    fields: [
      ["Customer", "Jordan Rivera"],
      ["Service", "HVAC Repair"],
      ["Urgency", "High"],
      ["Requested", "Tomorrow afternoon"],
      ["Source", "Website form"],
    ] as [string, string][],
  },
  draftReply:
    "Hi Jordan, thanks for reaching out — sorry to hear your AC stopped working. We've received your request for a repair visit tomorrow afternoon. Could you reply with your service address? A coordinator will confirm your appointment window shortly.",
};

export const demoSteps = [
  { id: "incoming", label: "Incoming request", caption: "A customer message arrives through the website form." },
  { id: "analysis", label: "AI analysis", caption: "The AI reads the message and extracts structured details." },
  { id: "automation", label: "Workflow automation", caption: "The workflow prepares records, a reply, and a notification." },
  { id: "review", label: "Employee review", caption: "A team member reviews everything before it's sent." },
] as const;

export type DemoStepId = (typeof demoSteps)[number]["id"];
