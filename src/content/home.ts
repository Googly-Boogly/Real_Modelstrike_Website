import type { IconName } from "@/components/ui/Icon";

export const hero = {
  eyebrow: "AI automation for small and midsize businesses",
  title: "AI Automation That Takes Busywork Off Your Plate.",
  body: [
    "We design and build AI-powered workflows that help businesses handle customer inquiries, automate repetitive tasks, and connect their existing software.",
    "Spend less time on manual work and more time growing your business.",
  ],
  primaryCta: { label: "Book a Free Consultation", href: "/contact" },
  secondaryCta: { label: "Explore Our Services", href: "/services" },
};

export const problem = {
  eyebrow: "The problem",
  title: "Your Team Has Better Things to Do Than Repetitive Work.",
  body: [
    "Businesses spend valuable time managing emails, entering information into software, organizing requests, and performing repetitive administrative tasks.",
    "ModelStrike helps automate those workflows so employees can concentrate on work that requires their expertise.",
  ],
  items: [
    {
      icon: "keyboard" as IconName,
      title: "Too Much Manual Data Entry",
      body: "Employees repeatedly copy information between emails, spreadsheets, CRMs, and other applications.",
    },
    {
      icon: "clock" as IconName,
      title: "Slow Customer Response Times",
      body: "Incoming customer inquiries require sorting, categorization, and follow-up.",
    },
    {
      icon: "unlink" as IconName,
      title: "Disconnected Business Software",
      body: "Important information gets stuck in separate applications, creating unnecessary administrative work.",
    },
  ],
  transition:
    "None of this requires a new platform or a large IT project. We build practical automations that fit into the tools and processes you already have.",
};

export const servicesIntro = {
  eyebrow: "Services",
  title: "AI Solutions Built Around Your Business.",
  body: "Every engagement starts with your workflow, not a product we're trying to sell. These are the kinds of automations we build.",
};

export const demoIntro = {
  eyebrow: "Example automation",
  title: "See How AI Automation Works.",
  body: "Step through a simulated customer inquiry for a fictional HVAC company to see how an intake automation can prepare work for your team.",
};

export const processIntro = {
  eyebrow: "How it works",
  title: "From Repetitive Work to Smarter Workflows.",
  body: "A straightforward process, scoped to your business. Timelines depend on the workflow and the software involved — we'll give you an estimate once we understand both.",
};

export const industriesIntro = {
  eyebrow: "Industries",
  title: "Built for Businesses That Have Work to Get Done.",
  body: "We're starting with home-service businesses, where customer intake and office administration take up a lot of the day. The examples below are potential use cases — and we're happy to assess opportunities in other industries too.",
};

export const why = {
  eyebrow: "Why ModelStrike",
  title: "Practical AI. Built for Real Business Operations.",
  body: "We focus on automations that do a clear job reliably, inside the systems you already depend on.",
  items: [
    {
      icon: "puzzle" as IconName,
      title: "Custom-Built Solutions",
      body: "We design automations around the way your business actually operates, rather than forcing your process into a generic template.",
    },
    {
      icon: "plug" as IconName,
      title: "Integration-Focused",
      body: "We work with your existing business software wherever suitable integrations are available, so results show up where your team already works.",
    },
    {
      icon: "shield" as IconName,
      title: "Security-Conscious Development",
      body: "We design with appropriate permissions, access controls, and reliable software practices — giving each automation only the access it needs.",
    },
    {
      icon: "refresh" as IconName,
      title: "Ongoing Support",
      body: "We offer continued maintenance and improvements for implemented workflows, so they keep working as your tools and business change.",
    },
  ],
};

export const aboutTeaser = {
  eyebrow: "About ModelStrike",
  title: "AI Engineering Focused on Practical Results.",
  body: [
    "ModelStrike is an AI automation and custom software development company focused on helping businesses use artificial intelligence in their everyday operations.",
    "We combine AI engineering, software development, and system integrations to create solutions tailored to real workflows.",
    "Our approach starts with understanding the business problem, then developing an automation that fits the existing process.",
  ],
  quote: "We believe AI should make work easier — not introduce unnecessary complexity.",
  cta: { label: "More about ModelStrike", href: "/about" },
};

export const finalCta = {
  title: "Let's Find Out What Your Business Could Automate.",
  body: "Tell us about the repetitive work slowing down your business. We'll help you explore whether AI automation is a practical solution.",
  primary: { label: "Request a Free Consultation", href: "/contact" },
  secondary: { label: "Contact ModelStrike", href: "/contact#contact-form" },
};
