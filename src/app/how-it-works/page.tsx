import { CTASection } from "@/components/sections/CTASection";
import { PageHero } from "@/components/sections/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { engagementSteps } from "@/content/process";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "How It Works",
  description:
    "How a ModelStrike AI automation engagement works: consultation, assessment, written proposal, implementation, testing and deployment, and ongoing support.",
  path: "/how-it-works",
});

const faqs = [
  {
    q: "Do I need technical knowledge to work with you?",
    a: "No. We need to understand how your business works; we handle the technical side and explain decisions in plain language.",
  },
  {
    q: "How long does a project take?",
    a: "It depends on the workflow and the software involved. You'll get an estimated timeline in the proposal, after we've assessed what's needed.",
  },
  {
    q: "Will we have to replace our current software?",
    a: "Usually not. We aim to work with the tools you already use wherever suitable integrations are available, and we'll tell you if something can't be connected.",
  },
  {
    q: "Does the AI act on its own?",
    a: "Only as much as you decide. For anything that affects customers or money we recommend a human review step, and we design the permissions around that.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="A clear process from first conversation to working automation."
        body="Every engagement follows the same steps. Nothing gets built until you've seen and agreed to a written proposal — and the scope, timeline, and pricing are specific to your project."
      >
        <ButtonLink href="/contact" size="lg" arrow>
          Start with a free consultation
        </ButtonLink>
      </PageHero>

      <Section aria-labelledby="steps-title">
        <h2 id="steps-title" className="sr-only">
          Engagement steps
        </h2>
        <ol className="relative mx-auto max-w-5xl">
          <span aria-hidden className="absolute bottom-0 left-[1.4rem] top-0 w-px bg-linear-to-b from-accent-500 via-line-strong to-transparent sm:left-[1.9rem]" />
          {engagementSteps.map((step, i) => (
            <li key={step.title} className="reveal relative grid grid-cols-[3rem_1fr] gap-5 pb-14 last:pb-0 sm:grid-cols-[4rem_1fr] sm:gap-8">
              <span className="relative z-10 grid size-11 place-items-center rounded-full border border-accent-400/60 bg-ink-900 font-mono text-sm font-semibold text-accent-300 shadow-[0_0_0_6px_var(--color-ink-900)] sm:size-[3.75rem] sm:text-base">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="rounded-2xl border border-line bg-ink-800/70 p-6 sm:p-8">
                <h3 className="font-display text-2xl font-bold text-fg">{step.title}</h3>
                <p className="mt-2 text-lg text-fg-muted">{step.summary}</p>
                <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
                  <ul className="space-y-2.5">
                    {step.details.map((d) => (
                      <li key={d} className="flex gap-2.5 leading-relaxed text-fg-muted">
                        <Icon name="check" className="mt-1 size-4 shrink-0 text-cyan-400" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <div className="rounded-xl border border-line-strong bg-ink-900 p-4">
                    <p className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-subtle">
                      <Icon name="user" className="size-3.5" />
                      Your part
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-fg">{step.you}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="raised" aria-labelledby="faq-title">
        <SectionHeader id="faq-title" eyebrow="Questions" title="Common questions" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-ink-900 p-6 open:border-line-strong">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-display text-lg font-bold text-fg [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Icon name="arrowRight" className="mt-1 size-4 shrink-0 rotate-90 text-accent-400 transition-transform group-open:-rotate-90" />
                </summary>
                <p className="mt-3 leading-relaxed text-fg-muted">{f.a}</p>
              </details>
            ))}
          </div>
      </Section>

      <CTASection title="Ready for step one?" body="The initial consultation is free and there's no obligation. Tell us what's slowing your team down and we'll take it from there." secondary={null} primary={{ label: "Request a Free Consultation", href: "/contact" }} />
    </>
  );
}
