// Copy and fictional sample data for the /demo AI customer intake page.
// No real customer or company.

import type { IntakeAnalysis, IntakeEmail } from "@/lib/intake/schema";

export const intakeDemoCopy = {
  title: "ModelStrike AI Customer Intake Demo",
  subtitle: "See how AI can turn incoming customer emails into organized service requests and ready-to-review responses.",
  disclaimer: "This demonstration uses fictional customer information. No emails are sent, and no real service appointments are created.",
  approved: "Response approved! In a real implementation, this could be sent through your company's email system after employee approval.",
  cta: {
    title: "Want This Automation for Your Business?",
    body: "ModelStrike builds custom AI automations that help businesses handle customer inquiries, organize information, and reduce repetitive administrative work.",
    primary: { label: "Request a Free Consultation", href: "/contact" },
    secondary: { label: "Back to Home", href: "/" },
  },
};

export type SampleEmail = IntakeEmail & { id: string; label: string; receivedAt: string };

export const sampleEmails: SampleEmail[] = [
  {
    id: "ac",
    label: "AC not cooling",
    receivedAt: "Today, 9:14 AM",
    fromName: "Sarah Mitchell",
    fromEmail: "sarah@example.com",
    subject: "Air Conditioner Not Working",
    body: `Hi,

My air conditioner stopped cooling yesterday, and the house is getting pretty warm.

I live in Minneapolis and was wondering if someone could come out Wednesday afternoon to take a look.

My phone number is 612-555-0147.

Please let me know if that's possible.

Thanks,
Sarah Mitchell`,
  },
  {
    id: "furnace",
    label: "No heat, urgent",
    receivedAt: "Today, 6:02 AM",
    fromName: "David Okafor",
    fromEmail: "d.okafor@example.net",
    subject: "Furnace stopped — no heat",
    body: `Hello,

Our furnace quit sometime overnight and it's 54 degrees inside. We have a newborn at home so this is pretty urgent.

We're at 418 Elm Street in St. Paul. Any time today works — the sooner the better. You can reach me at 651-555-0193.

David`,
  },
  {
    id: "vague",
    label: "Incomplete inquiry",
    receivedAt: "Yesterday, 4:37 PM",
    fromName: "Priya Shah",
    fromEmail: "priya.shah@example.org",
    subject: "Question",
    body: `Hi there,

Do you guys do maintenance on heat pumps? Ours is making a rattling noise. Not sure if it's serious.

Priya`,
  },
];

/**
 * Prerecorded result for the first sample, used only when no AI provider is
 * configured. The UI labels it as simulated and locks the email so it can't
 * be mistaken for an analysis of edited text.
 */
export const simulatedAnalysis: IntakeAnalysis = {
  isServiceRequest: true,
  customerName: "Sarah Mitchell",
  email: "sarah@example.com",
  phone: "612-555-0147",
  location: "Minneapolis",
  serviceType: "Air Conditioning Repair",
  problem: "AC stopped cooling",
  preferredAppointment: "Wednesday afternoon",
  priority: "Normal",
  summary:
    "Sarah Mitchell reports that her air conditioner has stopped cooling. She is requesting a repair appointment on Wednesday afternoon in Minneapolis.",
  replySubject: "Re: Air Conditioner Not Working",
  replyBody: `Hi Sarah,

Thank you for reaching out!

I'm sorry to hear that your air conditioner isn't cooling properly.

We've received your request for AC repair and noted that Wednesday afternoon would work best for you.

A member of our team will review availability and follow up to confirm a suitable appointment time.

We appreciate you contacting us and look forward to helping you get your air conditioning working again.

Best regards,
Customer Service Team`,
};
