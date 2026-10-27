import { CTASection } from "@/components/sections/CTASection";
import { PageHero } from "@/components/sections/PageHero";
import { Icon } from "@/components/ui/Icon";
import { Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { about } from "@/content/about";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "About",
  description:
    "ModelStrike LLC is an AI automation and custom software development company helping businesses use AI in everyday operations — practical, security-conscious, and built around real workflows.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow={about.eyebrow} title={about.title} body={about.intro} />

      <Section aria-labelledby="about-detail">
        <h2 id="about-detail" className="sr-only">
          About ModelStrike
        </h2>
        <div className="mx-auto max-w-4xl divide-y divide-line">
          {about.sections.map((s) => (
            <div key={s.heading} className="reveal grid gap-4 py-10 first:pt-0 last:pb-0 md:grid-cols-[13rem_1fr] md:gap-10">
              <h3 className="font-display text-xl font-bold text-fg">{s.heading}</h3>
              <div className="space-y-4 text-lg leading-relaxed text-fg-muted">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="raised" aria-labelledby="principles-title">
        <SectionHeader
          id="principles-title"
          eyebrow="Engineering principles"
          title="Reliable, security-conscious by default."
          body="Automations touch customer information and business systems, so we treat access, review, and testing as part of the job — not extras."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {about.principles.map((p) => (
            <div key={p.title} className="reveal rounded-2xl border border-line bg-ink-900 p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-ink-700 text-accent-400">
                <Icon name={p.icon} className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-fg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTASection />
    </>
  );
}
