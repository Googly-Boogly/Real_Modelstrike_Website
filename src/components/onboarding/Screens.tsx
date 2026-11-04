"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ONBOARDING_CONTACT_EMAIL, onboardingCopy } from "@/content/onboarding";

const mailto = `mailto:${ONBOARDING_CONTACT_EMAIL}?subject=${encodeURIComponent("Onboarding questionnaire")}`;

export function ContactLink() {
  return (
    <a href={mailto} className="font-semibold text-accent-400 underline underline-offset-2 hover:text-accent-300">
      {ONBOARDING_CONTACT_EMAIL}
    </a>
  );
}

function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => ref.current?.focus(), []);
  return ref;
}

export function Loading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-fg-muted">
      <span aria-hidden className="size-8 animate-spin rounded-full border-2 border-line-strong border-t-accent-400" />
      <p>{label}</p>
    </div>
  );
}

export type ErrorKind =
  | "missing_token"
  | "invalid_link"
  | "expired_link"
  | "revoked_link"
  | "session_expired"
  | "rate_limited"
  | "network"
  | "unavailable"
  | "unknown";

const errorCopy: Record<ErrorKind, { icon: IconName; tone: "danger" | "warn"; title: string; body: ReactNode; retry?: boolean }> = {
  missing_token: {
    icon: "unlink",
    tone: "warn",
    title: "Open your invitation link",
    body: (
      <>
        This page needs the personal link from your ModelStrike welcome email. Please open the email and click <strong className="text-fg">Complete Your Onboarding Questionnaire</strong>. If you
        can&apos;t find it, contact us at <ContactLink /> and we&apos;ll send a new invitation.
      </>
    ),
  },
  invalid_link: { icon: "unlink", tone: "danger", title: "This link isn't valid", body: <InvalidBody /> },
  expired_link: { icon: "clock", tone: "danger", title: "This link has expired", body: <InvalidBody /> },
  revoked_link: { icon: "unlink", tone: "danger", title: "This link isn't valid", body: <InvalidBody /> },
  session_expired: {
    icon: "clock",
    tone: "warn",
    title: "Your secure session has ended",
    body: (
      <>
        For your security, onboarding sessions time out. Please reopen the link from your welcome email to continue. If the link no longer works, contact us at <ContactLink />.
      </>
    ),
  },
  rate_limited: {
    icon: "clock",
    tone: "warn",
    title: "Too many attempts",
    body: (
      <>
        Please wait a few minutes, then reopen the link from your welcome email. If you need help, contact us at <ContactLink />.
      </>
    ),
  },
  network: {
    icon: "unlink",
    tone: "warn",
    title: "We couldn't connect",
    body: "Please check your internet connection and try again.",
    retry: true,
  },
  unavailable: {
    icon: "alert",
    tone: "warn",
    title: "Onboarding is temporarily unavailable",
    body: (
      <>
        Our onboarding system can&apos;t be reached right now. Please try again in a few minutes. If this continues, contact us at <ContactLink />.
      </>
    ),
    retry: true,
  },
  unknown: {
    icon: "alert",
    tone: "warn",
    title: "Something went wrong",
    body: (
      <>
        We couldn&apos;t load your questionnaire. Please try again, or contact us at <ContactLink />.
      </>
    ),
    retry: true,
  },
};

function InvalidBody() {
  return (
    <>
      {onboardingCopy.invalidLink}
      <span className="mt-3 block">
        Email: <ContactLink />
      </span>
    </>
  );
}

export function ErrorScreen({ kind, onRetry }: { kind: ErrorKind; onRetry?: () => void }) {
  const c = errorCopy[kind];
  const ref = useFocusOnMount<HTMLHeadingElement>();
  return (
    <section aria-labelledby="status-title" className="demo-in mx-auto max-w-xl py-6 text-center sm:py-12">
      <span className={`mx-auto grid size-14 place-items-center rounded-full ring-1 ring-inset ${c.tone === "danger" ? "bg-danger/10 text-danger ring-danger/30" : "bg-warn/10 text-warn ring-warn/30"}`}>
        <Icon name={c.icon} className="size-7" />
      </span>
      <h1 id="status-title" ref={ref} tabIndex={-1} className="mt-6 font-display text-3xl font-extrabold text-fg outline-none sm:text-4xl">
        {c.title}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-fg-muted">{c.body}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {c.retry && onRetry ? (
          <button type="button" onClick={onRetry} className={buttonClasses({ size: "lg" })}>
            <Icon name="refresh" className="size-4" />
            Try Again
          </button>
        ) : null}
        <a href={mailto} className={buttonClasses({ variant: c.retry && onRetry ? "secondary" : "primary", size: "lg" })}>
          <Icon name="mail" className="size-4" />
          Contact ModelStrike
        </a>
      </div>
    </section>
  );
}

export function Submitted({ submittedAt, alreadySubmitted }: { submittedAt: string; alreadySubmitted: boolean }) {
  const c = onboardingCopy.success;
  const ref = useFocusOnMount<HTMLHeadingElement>();
  const when = submittedAt && !Number.isNaN(Date.parse(submittedAt)) ? new Date(submittedAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) : null;
  return (
    <section aria-labelledby="success-title" className="demo-in">
      <div className="rounded-2xl border border-ok/30 bg-ok/5 p-6 sm:p-8">
        <span className="grid size-12 place-items-center rounded-full bg-ok/15 text-ok">
          <Icon name="check" className="size-7" />
        </span>
        <h1 id="success-title" ref={ref} tabIndex={-1} className="mt-5 font-display text-3xl font-extrabold text-fg outline-none sm:text-4xl">
          {c.title}
        </h1>
        <div role="status" className="mt-4 space-y-3 text-lg leading-relaxed text-fg-muted">
          {alreadySubmitted ? <p>{c.already}</p> : c.body.map((p) => <p key={p}>{p}</p>)}
          {when ? <p className="font-mono text-sm text-fg-subtle">Submitted {when}</p> : null}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-ink-800/50 p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-fg">What&apos;s Next?</h2>
        <ol className="mt-5 space-y-4">
          {c.next.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-600/15 font-mono text-sm text-accent-300 ring-1 ring-inset ring-accent-400/30">{i + 1}</span>
              <span className="pt-1 leading-relaxed text-fg">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8 border-t border-line pt-6">
          <h2 className="text-sm font-semibold text-fg">Questions?</h2>
          <p className="mt-1 text-fg-muted">
            Email: <ContactLink />
          </p>
        </div>
      </div>

      <a href="https://modelstrike.ai" className={buttonClasses({ size: "lg", className: "mt-8" })}>
        {c.button}
        <Icon name="arrowRight" className="size-4" />
      </a>
    </section>
  );
}
