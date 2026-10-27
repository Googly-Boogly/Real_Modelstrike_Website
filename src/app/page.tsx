import Link from "next/link";
import { AutomationDemo } from "@/components/home/AutomationDemo";
import { WorkflowVisual } from "@/components/home/WorkflowVisual";
import { CTASection } from "@/components/sections/CTASection";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Container, Section } from "@/components/ui/Section";
import { Eyebrow, SectionHeader } from "@/components/ui/SectionHeader";
import { aboutTeaser, demoIntro, hero, industriesIntro, problem, processIntro, servicesIntro, why } from "@/content/home";
import { industries } from "@/content/industries";
import { featuredServices } from "@/content/services";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "ModelStrike | AI Automation & Custom Software Development",
  description: site.description,
  path: "/",
});

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      legalName: site.legalName,
      url: site.url,
      logo: `${site.url}/icon.svg`,
      description: site.description,
      ...(site.contactEmail ? { email: site.contactEmail } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      name: site.name,
      url: site.url,
      publisher: { "@id": `${site.url}/#organization` },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={orgJsonLd} />

      {/* HERO */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
        <div aria-hidden className="pointer-events-none absolute -top-48 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-accent-600/15 blur-3xl" />
        <Container className="relative grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.08fr_1fr] lg:gap-16 lg:py-28">
          <div>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
            <h1 id="hero-title" className="font-display text-[2.6rem] font-extrabold leading-[1.04] text-fg sm:text-6xl lg:text-[4.1rem]">
              AI Automation That Takes <span className="text-gradient">Busywork</span> Off Your Plate.
            </h1>
            <div className="mt-6 max-w-xl space-y-3 text-lg leading-relaxed text-fg-muted">
              {hero.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={hero.primaryCta.href} size="lg" arrow>
                {hero.primaryCta.label}
              </ButtonLink>
              <ButtonLink href={hero.secondaryCta.href} size="lg" variant="secondary">
                {hero.secondaryCta.label}
              </ButtonLink>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
              {["Customer intake", "Workflow automation", "Custom AI agents", "Integrations"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Icon name="check" className="size-4 text-cyan-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <WorkflowVisual />
        </Container>
      </section>

      {/* PROBLEM */}
      <Section tone="raised" aria-labelledby="problem-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader
              id="problem-title"
              eyebrow={problem.eyebrow}
              title={problem.title}
              body={
                <div className="space-y-4">
                  {problem.body.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              }
            />
          </div>
          <div>
            <ul className="divide-y divide-line border-y border-line">
              {problem.items.map((item, i) => (
                <li key={item.title} className="reveal grid grid-cols-[auto_1fr] gap-5 py-8 sm:gap-7">
                  <div className="flex flex-col items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-xl border border-line-strong bg-ink-900 text-accent-400">
                      <Icon name={item.icon} className="size-5" />
                    </span>
                    <span className="font-mono text-xs text-fg-subtle">0{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold text-fg sm:text-2xl">{item.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-fg-muted sm:text-lg">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-8 flex gap-3 rounded-xl border border-accent-500/30 bg-accent-600/10 p-5 leading-relaxed text-fg">
              <Icon name="sparkle" className="mt-0.5 size-5 shrink-0 text-cyan-400" />
              {problem.transition}
            </p>
          </div>
        </div>
      </Section>

      {/* SERVICES */}
      <Section aria-labelledby="services-title">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader id="services-title" eyebrow={servicesIntro.eyebrow} title={servicesIntro.title} body={servicesIntro.body} />
          <ButtonLink href="/services" variant="secondary" arrow className="self-start lg:self-auto">
            All services
          </ButtonLink>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {featuredServices.map((s, i) => (
            <article key={s.id} className="reveal group relative flex flex-col bg-ink-900 p-7 transition-colors hover:bg-ink-800 sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-accent-600/30 to-cyan-500/10 text-accent-300 ring-1 ring-inset ring-accent-400/30">
                  <Icon name={s.icon} className="size-6" />
                </span>
                <span className="font-mono text-xs text-fg-subtle">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-6 font-display text-2xl font-bold text-fg">{s.name}</h3>
              <p className="mt-3 leading-relaxed text-fg-muted">{s.summary}</p>
              <ul className="mt-6 grid gap-2 text-sm text-fg-muted sm:grid-cols-2">
                {s.highlights.map((h) => (
                  <li key={h} className="flex gap-2">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-cyan-400" />
                    {h}
                  </li>
                ))}
              </ul>
              <Link
                href={`/services#${s.id}`}
                className="mt-8 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-accent-400 hover:text-accent-300"
              >
                Learn More<span className="sr-only"> about {s.name}</span>
                <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-fg-subtle">
          Every automation is scoped to your workflow. Results depend on your processes and software — we&apos;ll be clear about what&apos;s realistic before you commit.
        </p>
      </Section>

      {/* DEMO */}
      <Section tone="raised" aria-labelledby="demo-title" className="overflow-hidden">
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <SectionHeader id="demo-title" eyebrow={demoIntro.eyebrow} title={demoIntro.title} body={demoIntro.body} />
          <div className="mt-12">
            <AutomationDemo />
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section aria-labelledby="process-title">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader id="process-title" eyebrow={processIntro.eyebrow} title={processIntro.title} body={processIntro.body} />
          <ButtonLink href="/how-it-works" variant="secondary" arrow className="self-start lg:self-auto">
            The full process
          </ButtonLink>
        </div>
        <div className="mt-16">
          <ProcessTimeline />
        </div>
      </Section>

      {/* INDUSTRIES */}
      <Section tone="raised" aria-labelledby="industries-title">
        <SectionHeader id="industries-title" eyebrow={industriesIntro.eyebrow} title={industriesIntro.title} body={industriesIntro.body} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((ind) => (
            <Link
              key={ind.id}
              href={`/industries#${ind.id}`}
              className="reveal group flex flex-col rounded-2xl border border-line bg-ink-900 p-6 transition-colors hover:border-accent-400/50"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-ink-700 text-cyan-400">
                <Icon name={ind.icon} className="size-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-fg">{ind.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-fg-muted">{ind.summary}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400 group-hover:text-accent-300">
                Example workflows
                <Icon name="arrowRight" className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* WHY */}
      <Section aria-labelledby="why-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <SectionHeader id="why-title" eyebrow={why.eyebrow} title={why.title} body={why.body} />
          <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {why.items.map((item) => (
              <div key={item.title} className="reveal border-t border-line-strong pt-6">
                <dt className="flex items-center gap-3 font-display text-lg font-bold text-fg">
                  <Icon name={item.icon} className="size-5 text-accent-400" />
                  {item.title}
                </dt>
                <dd className="mt-3 leading-relaxed text-fg-muted">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* ABOUT */}
      <Section tone="raised" aria-labelledby="about-title">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-20">
          <div>
            <SectionHeader id="about-title" eyebrow={aboutTeaser.eyebrow} title={aboutTeaser.title} />
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-fg-muted">
              {aboutTeaser.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <ButtonLink href={aboutTeaser.cta.href} variant="secondary" arrow className="mt-8">
              {aboutTeaser.cta.label}
            </ButtonLink>
          </div>
          <blockquote className="reveal relative rounded-2xl border border-line-strong bg-ink-900 p-8 sm:p-10">
            <span aria-hidden className="absolute -top-5 left-8 font-display text-7xl leading-none text-accent-500/60">
              &ldquo;
            </span>
            <p className="font-display text-2xl font-bold leading-snug text-fg sm:text-3xl">{aboutTeaser.quote}</p>
            <footer className="mt-6 font-mono text-xs uppercase tracking-[0.16em] text-fg-subtle">— {site.legalName}</footer>
          </blockquote>
        </div>
      </Section>

      <CTASection />
    </>
  );
}
