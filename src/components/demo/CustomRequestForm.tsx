import { useId, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { InboxItem } from "@/lib/demo/workflow";
import { intakeLimits, senderLimits, validateIntakeRequest } from "@/lib/intake/schema";
import { inputClasses } from "./ui";

export type CustomDraft = { name: string; email: string; subject: string; body: string };

export function CustomRequestForm({
  industryId,
  customerTerm,
  initial,
  live,
  busy,
  onSubmit,
  onCancel,
}: {
  industryId: string;
  customerTerm: string;
  initial: CustomDraft;
  live: boolean;
  busy: boolean;
  onSubmit: (item: Omit<InboxItem, "id">) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof CustomDraft) => (e: { target: { value: string } }) => {
    setForm({ ...form, [key]: e.target.value });
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // The same validation the server runs, for immediate feedback.
    const check = validateIntakeRequest({ industry: industryId, message: form.body, customer_name: form.name, customer_email: form.email, subject: form.subject });
    if (!check.ok) {
      setError(check.message);
      return;
    }
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    onSubmit({ name: form.name.trim() || null, email: form.email.trim() || null, subject: form.subject.trim(), body: form.body.trim(), receivedAt: time, custom: true });
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Custom request" className="space-y-3 border-t border-line bg-ink-900/40 p-4">
      <p id={`${id}-notice`} className="flex gap-2 rounded-lg border border-warn/30 bg-warn/10 p-2.5 text-xs leading-relaxed text-fg">
        <Icon name="alert" className="mt-0.5 size-3.5 shrink-0 text-warn" />
        Please use fictional details. Don&apos;t enter confidential, financial, medical, or other sensitive information. Nothing you type is saved or sent to anyone.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1 block text-xs font-medium text-fg-muted">
            {customerTerm} name <span className="text-fg-subtle">(optional)</span>
          </label>
          <input id={`${id}-name`} value={form.name} onChange={set("name")} maxLength={senderLimits.name} autoComplete="off" className={inputClasses} />
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="mb-1 block text-xs font-medium text-fg-muted">
            {customerTerm} email <span className="text-fg-subtle">(optional)</span>
          </label>
          <input id={`${id}-email`} type="email" value={form.email} onChange={set("email")} maxLength={senderLimits.email} autoComplete="off" placeholder="name@example.com" className={inputClasses} />
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-subject`} className="mb-1 block text-xs font-medium text-fg-muted">
          Subject <span className="text-fg-subtle">(optional)</span>
        </label>
        <input id={`${id}-subject`} value={form.subject} onChange={set("subject")} maxLength={senderLimits.subject} autoComplete="off" className={inputClasses} />
      </div>
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label htmlFor={`${id}-body`} className="text-xs font-medium text-fg-muted">
            Message
          </label>
          <span className="font-mono text-[11px] text-fg-subtle">
            {form.body.length}/{intakeLimits.message}
          </span>
        </div>
        <textarea
          id={`${id}-body`}
          value={form.body}
          onChange={set("body")}
          rows={7}
          maxLength={intakeLimits.message}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-notice${error ? ` ${id}-error` : ""}`}
          placeholder="Example: Hi, my water heater is making a popping noise…"
          className={`${inputClasses} resize-y leading-relaxed`}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      {!live ? <p className="text-xs leading-relaxed text-fg-muted">Live AI is turned off right now, so custom messages can&apos;t be processed. The samples still show a labelled simulated example.</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
        <button type="submit" disabled={!live || busy} className={buttonClasses({ className: "flex-1" })}>
          <Icon name="sparkle" className="size-4" />
          Process Custom Request
        </button>
        <button type="button" onClick={onCancel} className={buttonClasses({ variant: "secondary" })}>
          Cancel
        </button>
      </div>
    </form>
  );
}
