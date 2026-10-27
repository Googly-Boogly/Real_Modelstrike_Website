import { CTASection } from "@/components/sections/CTASection";
import { PageHero } from "@/components/sections/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Container, Section } from "@/components/ui/Section";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { industries } from "@/content/industries";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "AI Automation for Home-Service Businesses",
  description:
    "AI automation for HVAC companies, plumbers, electrical contractors, and other service businesses — organize customer inquiries, reduce data entry, and streamline office work.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <>
      <PageHero
        eyebrow="Industries"
        title="AI automation for businesses that have work to get done."
        body="We're focusing first on home-service businesses — HVAC, plumbing, and electrical — where customer intake and office administration take up a big part of every day. The workflows below are examples of what could be automated, not results from past clients."
      >
        <ButtonLink href="/contact" size="lg" arrow>
          Book a Free Consultation
        </ButtonLink>
      </PageHero>

      <div>
        {industries.map((ind, i) => (
          <section key={ind.id} id={ind.id} aria-labelledby={`${ind.id}-title`} className={`py-20 sm:py-24 ${i % 2 ? "border-y border-line bg-ink-800" : ""}`}>
            <Container>
              <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
                <div>
                  <span className="grid size-14 place-items-center rounded-2xl border border-line-strong bg-ink-900 text-cyan-400">
                    <Icon name={ind.icon} className="size-7" />
                  </span>
                  <h2 id={`${ind.id}-title`} className="mt-6 font-display text-3xl font-bold text-fg sm:text-4xl">
                    {ind.name}
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-fg-muted">{ind.summary}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-ink-950/50 p-6 sm:p-7">
                    <h3 className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-fg-subtle">Repetitive work we often see</h3>
                    <ul className="mt-5 space-y-3">
                      {ind.workflows.map((w) => (
                        <li key={w} className="flex gap-3 leading-relaxed text-fg-muted">
                          <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-fg-subtle" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="ring-gradient rounded-2xl bg-ink-700/40 p-6 sm:p-7">
                    <h3 className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-cyan-400">Automation ideas</h3>
                    <ul className="mt-5 space-y-3">
                      {ind.ideas.map((idea) => (
                        <li key={idea} className="flex gap-3 leading-relaxed text-fg">
                          <Icon name="sparkle" className="mt-1 size-4 shrink-0 text-accent-400" />
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Container>
          </section>
        ))}
      </div>

      <Section aria-labelledby="other-title">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <SectionHeader
            id="other-title"
            eyebrow="Not on the list?"
            title="Your industry doesn't need to be listed."
            body="Repetitive inquiries, re-typed data, and disconnected software show up in almost every business. If your team spends hours on routine administrative work, we can assess whether automation is a practical fit — and tell you honestly if it isn't."
          />
          <div className="flex lg:justify-end">
            <ButtonLink href="/contact" size="lg" variant="secondary" arrow>
              Tell us about your workflow
            </ButtonLink>
          </div>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
