import { cta } from "@/content/site";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-ink-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-ink-900/65">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Primary" className="hidden lg:block">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ButtonLink href={cta.href} className="whitespace-nowrap">
              {cta.navLabel}
            </ButtonLink>
          </div>
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
