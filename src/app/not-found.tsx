import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center py-24">
      <p className="font-mono text-sm text-cyan-400">404</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold text-fg sm:text-5xl">This page doesn&apos;t exist.</h1>
      <p className="mt-4 max-w-lg text-lg text-fg-muted">The link may be outdated, or the page may have moved.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/" arrow>
          Back to home
        </ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Contact us
        </ButtonLink>
      </div>
    </Container>
  );
}
