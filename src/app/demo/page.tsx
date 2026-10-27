import { connection } from "next/server";
import { IntakeDemo } from "@/components/demo/IntakeDemo";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Section";
import { intakeDemoCopy } from "@/content/intake-demo";
import { isAiConfigured } from "@/lib/intake/analyze";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Live Demo — AI Customer Intake",
  description: intakeDemoCopy.subtitle,
  path: "/demo",
});

export default async function DemoPage() {
  // Render per request so live vs. simulated mode reflects runtime configuration.
  await connection();
  const live = isAiConfigured();
  const { cta } = intakeDemoCopy;

  return (
    <>
      <section aria-labelledby="page-title" className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-accent-600/15 blur-3xl" />
        <Container className="relative py-12 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.14em] text-cyan-300">
            <Icon name="sparkle" className="size-3.5" />
            Interactive Demonstration
          </span>
          <h1 id="page-title" className="mt-5 max-w-4xl font-display text-4xl font-extrabold text-fg sm:text-5xl lg:leading-[1.05]">
            {intakeDemoCopy.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-fg-muted sm:text-xl">{intakeDemoCopy.subtitle}</p>
          <p className="mt-6 flex max-w-3xl gap-2.5 text-sm leading-relaxed text-fg-subtle">
            <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
            {intakeDemoCopy.disclaimer}
          </p>
        </Container>
      </section>

      <section aria-label="Demo" className="py-10 sm:py-14">
        <Container>
          <IntakeDemo live={live} />
        </Container>
      </section>

      <section aria-labelledby="cta-title" className="pb-20 sm:pb-28">
        <Container>
          <div className="ring-gradient relative overflow-hidden rounded-3xl bg-ink-800 px-6 py-12 sm:px-12 sm:py-16">
            <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent-600/20 blur-3xl" />
            <div className="relative grid items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
              <div>
                <h2 id="cta-title" className="font-display text-3xl font-extrabold text-fg sm:text-4xl">
                  {cta.title}
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">{cta.body}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <ButtonLink href={cta.primary.href} size="lg" arrow>
                  {cta.primary.label}
                </ButtonLink>
                <ButtonLink href={cta.secondary.href} size="lg" variant="secondary">
                  {cta.secondary.label}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
