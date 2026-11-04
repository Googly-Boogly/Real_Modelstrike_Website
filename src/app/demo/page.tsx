import { connection } from "next/server";
import { ConsultationCTA } from "@/components/demo/ConsultationCTA";
import { DemoExperience } from "@/components/demo/DemoExperience";
import { GuidedDemoButton } from "@/components/demo/GuidedDemo";
import { ROICalculator } from "@/components/demo/ROICalculator";
import { BookingLink, ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Container, Section } from "@/components/ui/Section";
import { Eyebrow, SectionHeader } from "@/components/ui/SectionHeader";
import { intakeDemoCopy } from "@/content/intake-demo";
import { isAiConfigured } from "@/lib/intake/ai";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({ ...intakeDemoCopy.meta, path: "/demo" });

export default async function DemoPage() {
  // Render per request so live vs. simulated mode reflects runtime configuration.
  await connection();
  const live = isAiConfigured();
  const { hero } = intakeDemoCopy;

  return (
    <>
      <section aria-labelledby="page-title" className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-accent-600/15 blur-3xl" />
        <Container className="relative py-10 sm:py-14">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <h1 id="page-title" className="max-w-4xl font-display text-4xl font-extrabold text-fg sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-fg-muted sm:text-xl">{hero.subtitle}</p>
          <ul className="mt-6 grid max-w-3xl gap-2 sm:grid-cols-3 sm:gap-3">
            {hero.experience.map((e, i) => (
              <li key={e.text} className="flex items-start gap-2.5 text-sm text-fg">
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent-600/15 font-mono text-xs text-accent-300 ring-1 ring-inset ring-accent-400/30">
                  <Icon name={e.icon as IconName} className="size-3.5" />
                  <span className="sr-only">Step {i + 1}</span>
                </span>
                {e.text}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="#demo" size="lg" arrow>
              {hero.primary}
            </ButtonLink>
            <GuidedDemoButton />
            <BookingLink variant="secondary" label="Book Free Consultation" />
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-fg-muted">
            <Icon name="shield" className="size-4 shrink-0 text-ok" />
            {hero.trust}
          </p>
        </Container>
      </section>

      <section id="demo" aria-label="Interactive demo" className="py-10 sm:py-12">
        <Container>
          <DemoExperience live={live} />
        </Container>
      </section>

      <Section id="roi" tone="raised" aria-labelledby="roi-title" className="!py-16 sm:!py-20">
        <div data-tour="roi">
          <SectionHeader
            id="roi-title"
            eyebrow="Business value calculator"
            title="What Could Automation Free Up?"
            body="Adjust the numbers to match your business. Results update as you type."
          />
          <div className="mt-10">
            <ROICalculator />
          </div>
        </div>
      </Section>

      <ConsultationCTA />
    </>
  );
}
