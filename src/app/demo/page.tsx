import { connection } from "next/server";
import { IntakeDemo } from "@/components/demo/IntakeDemo";
import { CTASection } from "@/components/sections/CTASection";
import { BookingLink, ButtonLink } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Container, Section } from "@/components/ui/Section";
import { Eyebrow, SectionHeader } from "@/components/ui/SectionHeader";
import { intakeDemoCopy } from "@/content/intake-demo";
import { booking } from "@/content/site";
import { isAiConfigured } from "@/lib/intake/ai";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({ ...intakeDemoCopy.meta, path: "/demo" });

export default async function DemoPage() {
  // Render per request so live vs. preview mode reflects runtime configuration.
  await connection();
  const live = isAiConfigured();
  const { hero, benefits, comparison, finalCta, afterDemo } = intakeDemoCopy;

  return (
    <>
      <section aria-labelledby="page-title" className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-accent-600/15 blur-3xl" />
        <Container className="relative py-12 sm:py-16">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <h1 id="page-title" className="max-w-4xl font-display text-4xl font-extrabold text-fg sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-fg sm:text-xl">{hero.subtitle}</p>
          <p className="mt-3 max-w-3xl leading-relaxed text-fg-muted">{hero.body}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#demo" size="lg" arrow>
              {hero.primary}
            </ButtonLink>
            <BookingLink variant="secondary" label={booking.external ? undefined : "Book a Free Consultation"} />
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-fg-muted">
            <Icon name="shield" className="size-4 shrink-0 text-ok" />
            {hero.trust}
          </p>
        </Container>
      </section>

      <section id="demo" aria-label="Interactive demo" className="py-10 sm:py-14">
        <Container>
          <IntakeDemo live={live} />

          <div className="ring-gradient relative mt-10 overflow-hidden rounded-3xl bg-ink-800 px-6 py-10 sm:px-10">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-accent-600/20 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-fg sm:text-3xl">{afterDemo.title}</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-fg-muted">{afterDemo.body}</p>
              </div>
              <div className="flex flex-col gap-3">
                <BookingLink />
                <ButtonLink href={afterDemo.secondary.href} size="lg" variant="secondary">
                  {afterDemo.secondary.label}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Section tone="raised" aria-labelledby="benefits-title">
        <SectionHeader id="benefits-title" title={benefits.title} />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.items.map((b) => (
            <li key={b.title} className="rounded-2xl border border-line bg-ink-900/60 p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-accent-600/15 text-accent-300 ring-1 ring-inset ring-accent-400/30">
                <Icon name={b.icon as IconName} className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-fg">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{b.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section aria-labelledby="comparison-title">
        <SectionHeader id="comparison-title" eyebrow={comparison.eyebrow} title={comparison.title} />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-ink-800/50 p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-fg">{comparison.before.title}</h3>
            <p className="mt-2 text-sm text-fg-muted">{comparison.before.intro}</p>
            <ol className="mt-5 space-y-2.5">
              {comparison.before.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm text-fg-muted">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong font-mono text-xs text-fg-subtle">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="ring-gradient rounded-2xl bg-ink-800 p-6 sm:p-8">
            <h3 className="font-display text-xl font-bold text-fg">{comparison.after.title}</h3>
            <p className="mt-2 text-sm text-fg-muted">{comparison.after.intro}</p>
            <ol className="mt-5 space-y-2.5">
              {comparison.after.steps.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm text-fg">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-accent-400/50 bg-accent-600/15 font-mono text-xs text-accent-300">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <p className="mt-5 flex gap-2.5 rounded-xl border border-ok/30 bg-ok/10 p-3.5 text-sm font-medium text-fg">
              <Icon name="check" className="mt-0.5 size-4 shrink-0 text-ok" />
              {comparison.after.outro}
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm text-fg-subtle">{comparison.note}</p>
      </Section>

      <CTASection title={finalCta.title} body={finalCta.body} primary={{ label: booking.label, href: booking.href }} secondary={afterDemo.secondary} />
    </>
  );
}
