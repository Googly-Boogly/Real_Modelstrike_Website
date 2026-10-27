"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { submitContact } from "@/app/contact/actions";
import { initialContactState } from "@/app/contact/state";
import { Icon } from "@/components/ui/Icon";
import { buttonClasses } from "@/components/ui/Button";
import { CalEmbed } from "./CalEmbed";
import { industryOptions, limits, type ContactField } from "@/lib/contact/schema";

const inputBase =
  "block w-full rounded-lg border bg-ink-950/70 px-3.5 py-3 text-[0.95rem] text-fg placeholder:text-fg-subtle transition-colors focus:outline-none focus-visible:border-accent-400 focus-visible:ring-2 focus-visible:ring-accent-400/30 disabled:opacity-60";

function inputClass(invalid: boolean) {
  return `${inputBase} ${invalid ? "border-danger/70" : "border-line-strong hover:border-fg-subtle/60"}`;
}

type FieldProps = {
  id: ContactField;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: (a11y: { id: string; name: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
};

function Field({ id, label, required, error, hint, children }: FieldProps) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-2 flex items-baseline justify-between text-sm font-semibold text-fg">
        <span>
          {label}
          {required ? <span className="text-accent-400"> *</span> : null}
        </span>
        {!required ? <span className="text-xs font-normal text-fg-subtle">Optional</span> : null}
      </label>
      {children({ id, name: id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {hint ? (
        <p id={`${id}-hint`} className="mt-2 text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-2 flex items-center gap-1.5 text-sm text-danger">
          <Icon name="alert" className="size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

type ContactFormProps = {
  enabled: boolean;
  /** Cal.com event shown as the next step once the request is sent. */
  calLink?: string;
};

export function ContactForm({ enabled, calLink }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitContact, initialContactState);
  const formRef = useRef<HTMLFormElement>(null);
  const startedRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  // Record when the visitor started; re-arms after each remount of the form.
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, [state]);

  // Move focus to the first invalid field, or to the status message.
  useEffect(() => {
    if (state.status === "idle") return;
    const firstInvalid = state.status === "error" ? Object.keys(state.fieldErrors ?? {})[0] : undefined;
    const target = firstInvalid ? formRef.current?.querySelector<HTMLElement>(`#${firstInvalid}`) : statusRef.current;
    target?.focus();
  }, [state]);

  if (state.status === "success") {
    const received = (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-2xl border border-ok/30 bg-ok/10 p-6 outline-none sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">
            <Icon name="check" className="size-6" />
          </span>
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-ok">Request received</p>
            <h2 className="mt-2 font-display text-xl font-bold text-fg sm:text-2xl">Thanks — your request is on its way.</h2>
            <p className="mt-2 leading-relaxed text-fg-muted">
              {state.confirmed
                ? "We've sent a confirmation to your email and will follow up there."
                : "We'll reply to the email address you provided."}
              {calLink ? " Next, pick a time for your consultation call below." : " We'll be in touch to arrange a time to talk."}
            </p>
          </div>
        </div>
      </div>
    );
    if (!calLink) return received;
    return (
      <div className="space-y-10">
        {received}
        <section id="schedule" aria-labelledby="schedule-title">
          <h2 id="schedule-title" className="font-display text-2xl font-bold text-fg">
            Book your free consultation
          </h2>
          <p className="mt-2 text-fg-muted">Choose a time that works for you. You&apos;ll get a calendar invite and confirmation from Cal.com by email.</p>
          <div className="mt-6">
            <CalEmbed calLink={calLink} prefill={state.booker} />
          </div>
        </section>
      </div>
    );
  }

  const disabled = !enabled || pending;
  // Remount fields after each error response so defaultValue reflects what was submitted.
  const formKey = state.status === "error" ? JSON.stringify(values) + state.message : "initial";

  return (
    <form ref={formRef} key={formKey} action={formAction} className="space-y-6" aria-describedby="form-required-note">
      {state.status === "error" ? (
        <div ref={statusRef} tabIndex={-1} role="alert" className="flex gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-fg outline-none">
          <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-danger" />
          <p>{state.message}</p>
        </div>
      ) : null}

      {/* Anti-spam: honeypot (hidden from people and assistive tech) and start time. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input ref={startedRef} type="hidden" name="startedAt" defaultValue="" />

      <fieldset disabled={disabled} className="space-y-6">
        <legend className="sr-only">Consultation request</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field id="name" label="Full Name" required error={errors.name}>
            {(a) => <input {...a} type="text" autoComplete="name" required maxLength={limits.name} defaultValue={values.name} className={inputClass(Boolean(errors.name))} />}
          </Field>
          <Field id="email" label="Business Email" required error={errors.email}>
            {(a) => (
              <input {...a} type="email" autoComplete="email" inputMode="email" required maxLength={limits.email} defaultValue={values.email} className={inputClass(Boolean(errors.email))} />
            )}
          </Field>
          <Field id="company" label="Company Name" required error={errors.company}>
            {(a) => <input {...a} type="text" autoComplete="organization" required maxLength={limits.company} defaultValue={values.company} className={inputClass(Boolean(errors.company))} />}
          </Field>
          <Field id="industry" label="Industry" error={errors.industry}>
            {(a) => (
              <select {...a} defaultValue={values.industry ?? ""} className={`${inputClass(Boolean(errors.industry))} appearance-none bg-[length:1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237f8ca3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}>
                <option value="">Select an industry</option>
                {industryOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <Field id="message" label="What would you like to automate?" required error={errors.message} hint="For example: “We get 40+ service emails a day and someone re-types each one into our job software.”">
          {(a) => (
            <textarea {...a} required rows={6} minLength={limits.messageMin} maxLength={limits.message} defaultValue={values.message} className={`${inputClass(Boolean(errors.message))} resize-y`} />
          )}
        </Field>

        <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p id="form-required-note" className="text-xs leading-relaxed text-fg-subtle">
            <span className="text-accent-400">*</span> Required. We use your details only to respond to this request — see our{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-fg">
              Privacy Policy
            </Link>
            .
          </p>
          <button type="submit" className={buttonClasses({ size: "lg", className: "shrink-0" })}>
            {pending ? (
              <>
                <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sending…
              </>
            ) : (
              <>
                {calLink ? "Continue to Scheduling" : "Request a Free Consultation"}
                <Icon name="arrowRight" className="size-4" />
              </>
            )}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
