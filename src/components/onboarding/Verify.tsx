"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/SectionHeader";
import { onboardingApi } from "./api";
import { ErrorText, inputClass } from "./fields";
import type { ErrorKind } from "./Screens";

type Props = { maskedEmail: string | null; onVerified: () => void; onFatal: (kind: ErrorKind) => void; mockCode?: string };

const fatalKinds: Record<string, ErrorKind> = { session_expired: "session_expired", no_session: "session_expired", revoked_link: "revoked_link", expired_link: "expired_link" };

export function Verify({ maskedEmail, onVerified, onFatal, mockCode }: Props) {
  const [stage, setStage] = useState<"intro" | "code">("intro");
  const [email, setEmail] = useState(maskedEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => headingRef.current?.focus(), []);
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function handleError(code: string, retryAfterSeconds?: number, attemptsRemaining?: number) {
    if (fatalKinds[code]) return onFatal(fatalKinds[code]);
    if (code === "network") return setError("We couldn't connect. Check your internet connection and try again.");
    if (code === "rate_limited") {
      const minutes = Math.max(1, Math.ceil((retryAfterSeconds ?? 60) / 60));
      return setError(`Too many attempts. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`);
    }
    if (code === "invalid_code") return setError(attemptsRemaining !== undefined ? `That code isn't right. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} left.` : "That code isn't right. Please check it and try again.");
    if (code === "code_expired") return setError("That code has expired. Please request a new one.");
    setError("Verification isn't available right now. Please try again in a few minutes.");
  }

  async function send() {
    if (pending) return;
    setPending(true);
    setError("");
    const r = await onboardingApi.sendCode();
    setPending(false);
    if (!r.ok) return handleError(r.code, r.retryAfterSeconds);
    if (r.maskedEmail) setEmail(r.maskedEmail);
    setResendIn(r.resendAfterSeconds);
    setStage("code");
    setTimeout(() => codeRef.current?.focus(), 0);
  }

  async function confirm() {
    if (pending) return;
    const value = code.replace(/\s+/g, "");
    if (!/^\d{6}$/.test(value)) {
      setError("Please enter the 6-digit code from the email.");
      codeRef.current?.focus();
      return;
    }
    setPending(true);
    setError("");
    const r = await onboardingApi.confirmCode(value);
    setPending(false);
    if (!r.ok) {
      handleError(r.code, r.retryAfterSeconds, r.attemptsRemaining);
      codeRef.current?.focus();
      return;
    }
    onVerified();
  }

  return (
    <section aria-labelledby="verify-title" className="demo-in mx-auto max-w-xl">
      <Eyebrow>Security check</Eyebrow>
      <h1 id="verify-title" ref={headingRef} tabIndex={-1} className="font-display text-3xl font-extrabold text-fg outline-none sm:text-4xl">
        Confirm it&apos;s you
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-fg-muted">
        To protect your project details, we&apos;ll email a 6-digit code to the contact address on your project{email ? <> (<span className="font-semibold text-fg">{email}</span>)</> : null}.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-ink-800/50 p-5 sm:p-6">
        {stage === "intro" ? (
          <>
            {error ? (
              <p role="alert" className="mb-4 flex items-start gap-1.5 text-sm text-danger">
                <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            ) : null}
            <button type="button" onClick={send} disabled={pending} className={buttonClasses({ size: "lg", className: "w-full sm:w-auto" })}>
              <Icon name="mail" className="size-4" />
              {pending ? "Sending…" : "Email Me a Code"}
            </button>
          </>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              confirm();
            }}
          >
            <label htmlFor="code" className="mb-2 block text-sm font-semibold text-fg">
              Verification code
            </label>
            <input
              ref={codeRef}
              id="code"
              name="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/[^\d\s]/g, "").slice(0, 7));
                setError("");
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={7}
              aria-invalid={Boolean(error)}
              aria-describedby={["code-hint", error ? "code-error" : ""].filter(Boolean).join(" ")}
              className={`${inputClass(Boolean(error))} max-w-[12rem] text-center font-mono text-xl tracking-[0.4em]`}
            />
            <p id="code-hint" className="mt-2 text-xs text-fg-subtle">
              The code expires after a few minutes. Check your spam folder if it doesn&apos;t arrive.
              {mockCode ? <span className="ml-1 text-warn">Development mock: use {mockCode}.</span> : null}
            </p>
            <div role="alert">
              <ErrorText id="code" error={error} />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" disabled={pending} className={buttonClasses({ size: "lg" })}>
                {pending ? "Checking…" : "Verify and Continue"}
                <Icon name="arrowRight" className="size-4" />
              </button>
              <button type="button" onClick={send} disabled={pending || resendIn > 0} className={buttonClasses({ variant: "ghost" })}>
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
