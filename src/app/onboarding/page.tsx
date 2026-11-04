import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/layout/Logo";
import { OnboardingApp } from "@/components/onboarding/OnboardingApp";
import { Icon } from "@/components/ui/Icon";
import { ONBOARDING_CONTACT_EMAIL, onboardingCopy } from "@/content/onboarding";
import { site } from "@/content/site";

// Private, invitation-only page: never indexed, no canonical/Open Graph, not in the sitemap or navigation.
export const metadata: Metadata = {
  title: { absolute: `${onboardingCopy.meta.title} | ${site.name}` },
  description: onboardingCopy.meta.description,
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

export default function OnboardingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-96" />
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] max-w-full -translate-x-1/2 rounded-full bg-accent-600/10 blur-3xl" />

      <header className="relative border-b border-line/80 bg-ink-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Branding only: no site navigation inside the questionnaire. */}
          <span className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-[1.05rem] font-bold tracking-tight text-fg">
              Model<span className="text-accent-400">Strike</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-fg-subtle">
            <Icon name="shield" className="size-3.5 text-ok" />
            Customer onboarding
          </span>
        </div>
      </header>

      <div className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <OnboardingApp />
      </div>

      <footer className="relative border-t border-line bg-ink-950">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {site.legalName}</p>
          <p className="flex gap-4">
            <a href={`mailto:${ONBOARDING_CONTACT_EMAIL}`} className="hover:text-fg">
              {ONBOARDING_CONTACT_EMAIL}
            </a>
            <Link href="/privacy" className="hover:text-fg" target="_blank" rel="noopener">
              Privacy Policy<span className="sr-only"> (opens in a new tab)</span>
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
