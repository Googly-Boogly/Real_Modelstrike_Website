// The only module that reads NEXT_PUBLIC_* env vars. Empty values hide the
// related UI instead of rendering placeholders.

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://modelstrike.ai";

/** Accepts `user/event` or a full https://cal.com/user/event URL; anything else is ignored. */
function resolveCalLink(): string {
  const raw = (process.env.NEXT_PUBLIC_CAL_LINK ?? "").trim().replace(/^https:\/\/(app\.)?cal\.com\//, "").replace(/^\/+|\/+$/g, "");
  return /^[\w.-]+(\/[\w.-]+)*$/.test(raw) ? raw : "";
}

export const site = {
  name: "ModelStrike",
  legalName: "ModelStrike LLC",
  tagline: "AI Automation & Custom Software Development",
  url: rawSiteUrl.replace(/\/+$/, ""),
  description:
    "ModelStrike builds custom AI automations that help businesses streamline customer inquiries, connect software, and reduce repetitive administrative work.",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || null,
  /** Cal.com event (`user/event`) for booking the consultation call; empty = no calendar. */
  calLink: resolveCalLink(),
} as const;

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Live Demo", href: "/demo" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Services",
    items: [
      { label: "AI Customer Intake", href: "/services#intake" },
      { label: "Workflow Automation", href: "/services#workflow" },
      { label: "Custom AI Agents", href: "/services#agents" },
      { label: "Integrations", href: "/services#integrations" },
      { label: "Maintenance", href: "/services#maintenance" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "Industries", href: "/industries" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Live Demo", href: "/demo" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    items: [{ label: "Privacy Policy", href: "/privacy" }],
  },
];

export const cta = {
  primaryLabel: "Book a Free Consultation",
  navLabel: "Book a Consultation",
  href: "/contact",
} as const;

/** Length of the Cal.com event when its slug states one, e.g. `modelstrike/30min`. */
const callMinutes = site.calLink.match(/(\d+)min\b/)?.[1];

/** Straight to the existing Cal.com event when configured, otherwise the contact page. */
export const booking = {
  href: site.calLink ? `https://cal.com/${site.calLink}` : cta.href,
  external: Boolean(site.calLink),
  label: callMinutes ? `Book a Free ${callMinutes}-Minute Consultation` : cta.primaryLabel,
};
