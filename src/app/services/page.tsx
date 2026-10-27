import Link from "next/link";
import { CTASection } from "@/components/sections/CTASection";
import { PageHero } from "@/components/sections/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Section";
import { services } from "@/content/services";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "AI Automation Services",
  description:
    "Custom AI automation services: customer intake automation, business workflow automation, custom AI agents, AI software integrations, and ongoing automation maintenance.",
  path: "/services",
});

const servicesJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: services.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Service",
      name: s.name,
      description: s.summary,
      url: `${site.url}/services#${s.id}`,
      provider: { "@type": "Organization", name: site.legalName, url: site.url },
    },
  })),
};

function Block({ title, items, icon = "check" }: { title: string; items: string[]; icon?: "check" | "plug" | "user" }) {
  return (
    <div>
      <h4 className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-fg-subtle">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-fg-muted">
            <Icon name={icon} className="mt-1 size-4 shrink-0 text-cyan-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={servicesJsonLd} />
      <PageHero
        eyebrow="Services"
        title="AI automation services built around how you work."
        body="We design, build, and maintain practical AI automations for small and midsize businesses — from organizing customer inquiries to connecting the software you already use."
      >
        <ButtonLink href="/contact" size="lg" arrow>
          Book a Free Consultation
        </ButtonLink>
      </PageHero>

      {/* in-page index */}
      <nav aria-label="Services on this page" className="sticky top-16 z-30 border-b border-line bg-ink-900/85 backdrop-blur-xl">
        <Container>
          <ul className="flex gap-1 overflow-x-auto py-2">
            {services.map((s) => (
              <li key={s.id}>
                <Link href={`#${s.id}`} className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-fg-muted hover:bg-ink-700 hover:text-fg">
                  <Icon name={s.icon} className="size-4 text-accent-400" />
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>

      <div>
        {services.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className={`scroll-mt-32 py-20 sm:py-24 ${i % 2 ? "border-y border-line bg-ink-800" : ""}`}>
            <Container>
              <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
                <div className="lg:sticky lg:top-36 lg:self-start">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-accent-600/30 to-cyan-500/10 text-accent-300 ring-1 ring-inset ring-accent-400/30">
                      <Icon name={s.icon} className="size-6" />
                    </span>
                    <span className="font-mono text-xs text-fg-subtle">Service {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h2 id={`${s.id}-title`} className="mt-6 font-display text-3xl font-bold text-fg sm:text-4xl">
                    {s.name}
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-fg-muted">{s.summary}</p>
                  <ButtonLink href="/contact" arrow className="mt-8">
                    Discuss {s.name.replace(/^AI /, "")}
                  </ButtonLink>
                </div>

                <div className="space-y-10">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-2xl border border-line bg-ink-950/60 p-6">
                      <h3 className="flex items-center gap-2 font-display text-base font-bold text-fg">
                        <Icon name="alert" className="size-4 text-warn" />
                        The business problem
                      </h3>
                      <p className="mt-3 leading-relaxed text-fg-muted">{s.problem}</p>
                    </div>
                    <div className="ring-gradient rounded-2xl bg-ink-700/50 p-6">
                      <h3 className="flex items-center gap-2 font-display text-base font-bold text-fg">
                        <Icon name="sparkle" className="size-4 text-cyan-400" />
                        What the automation does
                      </h3>
                      <p className="mt-3 leading-relaxed text-fg-muted">{s.whatItDoes}</p>
                    </div>
                  </div>

                  <div className="grid gap-10 sm:grid-cols-2">
                    <Block title="Example use cases" items={s.useCases} />
                    <Block title="Types of integrations" items={s.integrations} icon="plug" />
                  </div>

                  <div className="grid gap-10 border-t border-line pt-10 sm:grid-cols-2">
                    <div>
                      <h4 className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-fg-subtle">How implementation works</h4>
                      <ol className="mt-4 space-y-3">
                        {s.process.map((step, n) => (
                          <li key={step} className="flex gap-3 text-[0.95rem] leading-relaxed text-fg-muted">
                            <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line-strong font-mono text-[11px] text-accent-300">
                              {n + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <Block title="What we'll need from you" items={s.involvement} icon="user" />
                  </div>
                </div>
              </div>
            </Container>
          </section>
        ))}
      </div>

      <section aria-labelledby="note-title" className="border-t border-line">
        <Container className="py-14">
          <div className="max-w-3xl">
            <h2 id="note-title" className="font-display text-xl font-bold text-fg">
              A note on what we promise
            </h2>
            <p className="mt-3 leading-relaxed text-fg-muted">
              Integrations depend on what your existing software supports, and the time an automation saves depends on your workflow. We&apos;ll assess both before
              proposing anything, and the proposal will describe exactly what will be built. See{" "}
              <Link href="/how-it-works" className="font-semibold text-accent-400 underline-offset-4 hover:underline">
                how an engagement works
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>

      <CTASection title="Not sure which service fits?" body="Most projects combine a few of these. Describe the repetitive work you'd like to reduce, and we'll suggest a practical starting point." secondary={null} primary={{ label: "Request a Free Consultation", href: "/contact" }} />
    </>
  );
}
