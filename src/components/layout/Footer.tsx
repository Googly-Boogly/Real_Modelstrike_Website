import Link from "next/link";
import { cta, footerNav, site } from "@/content/site";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Section";
import { CurrentYear } from "./CurrentYear";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink-950">
      <Container className="py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm font-semibold text-fg">{site.legalName}</p>
            <p className="mt-1 text-sm text-fg-muted">{site.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed text-fg-subtle">
              Custom AI automations that help businesses handle customer inquiries, reduce manual work, and connect their software.
            </p>
            <ButtonLink href={cta.href} variant="secondary" className="mt-6" arrow>
              {cta.navLabel}
            </ButtonLink>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerNav.map((group) => (
              <nav key={group.heading} aria-label={`Footer — ${group.heading}`}>
                <h2 className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-fg-subtle">{group.heading}</h2>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-sm text-fg-muted transition-colors hover:text-fg">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  {group.heading === "Company" && site.contactEmail ? (
                    <li>
                      <a href={`mailto:${site.contactEmail}`} className="text-sm text-fg-muted transition-colors hover:text-fg">
                        {site.contactEmail}
                      </a>
                    </li>
                  ) : null}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CurrentYear /> {site.legalName}. All rights reserved.
          </p>
          <p>
            <Link href="/privacy" className="hover:text-fg">
              Privacy Policy
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
