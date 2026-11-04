import { BookingLink, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Container } from "@/components/ui/Section";
import { intakeDemoCopy } from "@/content/intake-demo";

export function ConsultationCTA() {
  const { cta } = intakeDemoCopy;
  return (
    <section id="consultation" aria-labelledby="consultation-title" className="py-16 sm:py-24">
      <Container>
        <div data-tour="cta" className="ring-gradient relative overflow-hidden rounded-3xl bg-ink-800 px-6 py-12 sm:px-12 sm:py-16">
          <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent-600/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 id="consultation-title" className="font-display text-3xl font-extrabold text-fg sm:text-4xl lg:text-5xl lg:leading-[1.08]">
                {cta.title}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">{cta.body}</p>
              <ul className="mt-6 space-y-2 text-sm text-fg">
                {cta.points.map((p) => (
                  <li key={p} className="flex gap-2.5">
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-ok" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-accent-400/30 bg-ink-900/70 p-6">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-cyan-400">{cta.offer.eyebrow}</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-fg">{cta.offer.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{cta.offer.note}</p>
              <div className="mt-5 flex flex-col gap-3">
                <BookingLink label="Book a Free Consultation" />
                <ButtonLink href={cta.secondary.href} size="lg" variant="secondary">
                  {cta.secondary.label}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
