import type { ReactNode } from "react";
import { Container } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeader";

export function PageHero({ eyebrow, title, body, children }: { eyebrow: string; title: ReactNode; body: ReactNode; children?: ReactNode }) {
  return (
    <section aria-labelledby="page-title" className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-accent-600/15 blur-3xl" />
      <Container className="relative py-16 sm:py-24">
        <div className="max-w-3xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 id="page-title" className="font-display text-4xl font-extrabold text-fg sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            {title}
          </h1>
          <div className="mt-6 text-lg leading-relaxed text-fg-muted sm:text-xl">{body}</div>
          {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
