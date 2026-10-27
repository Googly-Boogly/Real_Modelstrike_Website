import type { IconName } from "@/components/ui/Icon";

export const about = {
  eyebrow: "About",
  title: "AI Engineering Focused on Practical Results.",
  intro:
    "ModelStrike LLC is an AI automation and custom software development company. We help businesses use artificial intelligence in their everyday operations — handling customer inquiries, reducing manual data entry, and connecting the software they already rely on.",
  sections: [
    {
      heading: "What we do",
      body: [
        "We design, build, and maintain custom AI-powered automations. That includes intake workflows that organize customer requests, automations that move information between business systems, and AI assistants built for specific, well-defined tasks.",
        "We combine AI engineering, conventional software development, and system integration. AI is used where it genuinely helps — reading, classifying, extracting, drafting — and dependable, conventional code does the rest.",
      ],
    },
    {
      heading: "Why practical AI",
      body: [
        "A lot of AI tooling is impressive in a demo and frustrating in daily use. We think the most valuable automations are often the unglamorous ones: the inbox that sorts itself, the record that no longer needs retyping, the report that assembles on schedule.",
        "So we start with the business problem, not the technology. If a workflow isn't a good fit for AI, we'll say so.",
      ],
    },
    {
      heading: "How we build",
      body: [
        "Every automation is scoped in writing before work begins, built against your real tools, and tested with realistic data before rollout. Where AI output affects customers or money, we design in a human review step by default.",
        "We document what we build so you understand how it works, and we offer ongoing maintenance so it keeps working as your software and business change.",
      ],
    },
  ],
  principles: [
    {
      icon: "shield" as IconName,
      title: "Least-privilege access",
      body: "Each automation gets only the permissions its job requires, and credentials are handled through secure channels.",
    },
    {
      icon: "eye" as IconName,
      title: "Humans stay in control",
      body: "AI prepares the work; your team approves what matters. Review steps are part of the design, not an afterthought.",
    },
    {
      icon: "check" as IconName,
      title: "Tested before it ships",
      body: "We validate workflows against sample data and edge cases before they touch live operations.",
    },
    {
      icon: "file" as IconName,
      title: "Clear documentation",
      body: "You'll know what was built, what it connects to, and how it behaves when something unexpected happens.",
    },
  ],
};
