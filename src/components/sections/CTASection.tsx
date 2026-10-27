import { finalCta } from "@/content/home";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

type Props = { title?: string; body?: string; primary?: { label: string; href: string }; secondary?: { label: string; href: string } | null };

export function CTASection({ title = finalCta.title, body = finalCta.body, primary = finalCta.primary, secondary = finalCta.secondary }: Props) {
  return (
    <section aria-labelledby="cta-title" className="py-20 sm:py-28">
      <Container>
        <div className="ring-gradient reveal relative overflow-hidden rounded-3xl bg-ink-800 px-6 py-14 sm:px-12 sm:py-20">
          <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent-600/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative grid items-end gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h2 id="cta-title" className="font-display text-3xl font-extrabold text-fg sm:text-4xl lg:text-5xl lg:leading-[1.08]">
                {title}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">{body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <ButtonLink href={primary.href} size="lg" arrow>
                {primary.label}
              </ButtonLink>
              {secondary ? (
                <ButtonLink href={secondary.href} size="lg" variant="secondary">
                  {secondary.label}
                </ButtonLink>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
