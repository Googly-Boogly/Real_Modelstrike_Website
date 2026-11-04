"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

// Same input treatment as the contact form (components/contact/ContactForm.tsx).
const inputBase =
  "block w-full rounded-lg border bg-ink-950/70 px-3.5 py-3 text-base text-fg placeholder:text-fg-subtle transition-colors focus:outline-none focus-visible:border-accent-400 focus-visible:ring-2 focus-visible:ring-accent-400/30 disabled:opacity-60 sm:text-[0.95rem]";

export function inputClass(invalid: boolean) {
  return `${inputBase} ${invalid ? "border-danger/70" : "border-line-strong hover:border-fg-subtle/60"}`;
}

const selectArrow = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237f8ca3' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
};

type A11y = { id: string; name: string; "aria-invalid": boolean; "aria-describedby"?: string; "aria-required"?: boolean };

const describedBy = (id: string, hint?: ReactNode, error?: string) => [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

export function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-2 flex items-start gap-1.5 text-sm text-danger">
      <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
      <span>{error}</span>
    </p>
  );
}

function Label({ htmlFor, label, required, as: As = "label" }: { htmlFor?: string; label: ReactNode; required?: boolean; as?: "label" | "legend" }) {
  return (
    <As {...(As === "label" ? { htmlFor } : {})} className="mb-2 flex w-full items-baseline justify-between gap-3 text-sm font-semibold text-fg">
      <span>
        {label}
        {required ? (
          <>
            <span aria-hidden className="text-accent-400"> *</span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </span>
      {!required ? <span className="shrink-0 text-xs font-normal text-fg-subtle">Optional</span> : null}
    </As>
  );
}

type FieldProps = { id: string; label: ReactNode; required?: boolean; hint?: ReactNode; error?: string; children: (a11y: A11y) => ReactNode; className?: string };

export function Field({ id, label, required, hint, error, children, className = "" }: FieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} label={label} required={required} />
      {children({ id, name: id, "aria-invalid": Boolean(error), "aria-describedby": describedBy(id, hint, error), ...(required ? { "aria-required": true } : {}) })}
      {hint ? (
        <p id={`${id}-hint`} className="mt-2 text-xs leading-relaxed text-fg-subtle">
          {hint}
        </p>
      ) : null}
      <ErrorText id={id} error={error} />
    </div>
  );
}

type TextProps = {
  id: string;
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  maxLength: number;
  type?: "text" | "email";
  autoComplete?: string;
  placeholder?: string;
  className?: string;
};

export function TextField({ type = "text", value, onChange, maxLength, autoComplete, placeholder, ...field }: TextProps) {
  return (
    <Field {...field}>
      {(a) => (
        <input
          {...a}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          spellCheck={type === "email" ? false : undefined}
          inputMode={type === "email" ? "email" : undefined}
          className={inputClass(Boolean(field.error))}
        />
      )}
    </Field>
  );
}

export function TextArea({ value, onChange, maxLength, placeholder, rows = 5, ...field }: Omit<TextProps, "type" | "autoComplete"> & { rows?: number }) {
  const near = value.length > maxLength * 0.9;
  return (
    <Field {...field}>
      {(a) => (
        <>
          <textarea {...a} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} rows={rows} className={`${inputClass(Boolean(field.error))} resize-y leading-relaxed`} />
          {near ? (
            <p className="mt-1.5 text-right font-mono text-xs text-warn" aria-live="polite">
              {value.length} / {maxLength}
            </p>
          ) : null}
        </>
      )}
    </Field>
  );
}

type Option = { value: string; label: string };

export function SelectField({ value, onChange, options, placeholder = "Select an option", ...field }: Omit<TextProps, "maxLength" | "type" | "autoComplete"> & { options: readonly Option[] }) {
  return (
    <Field {...field}>
      {(a) => (
        <select {...a} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass(Boolean(field.error))} appearance-none bg-[length:1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`} style={selectArrow}>
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/** Multiple selection as a fieldset of checkboxes. The first checkbox carries the field id so error focus lands on the group. */
export function CheckboxGroup({
  id,
  label,
  hint,
  error,
  required,
  options,
  value,
  onChange,
  columns = 2,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  options: readonly Option[];
  value: string[];
  onChange: (value: string[]) => void;
  columns?: 1 | 2 | 3;
}) {
  const toggle = (v: string, on: boolean) => onChange(on ? [...value, v] : value.filter((x) => x !== v));
  const grid = columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <fieldset aria-describedby={describedBy(id, hint, error)} aria-invalid={Boolean(error) || undefined}>
      <Label as="legend" label={label} required={required} />
      {hint ? (
        <p id={`${id}-hint`} className="-mt-0.5 mb-3 text-xs leading-relaxed text-fg-subtle">
          {hint}
        </p>
      ) : null}
      <div className={`grid gap-2.5 ${grid}`}>
        {options.map((o, i) => {
          const checked = value.includes(o.value);
          const optionId = i === 0 ? id : `${id}-${o.value}`;
          return (
            <label
              key={o.value}
              htmlFor={optionId}
              className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-sm leading-snug transition-colors has-[:focus-visible]:border-accent-400 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-400/30 ${
                checked ? "border-accent-400/70 bg-accent-600/10 text-fg" : error ? "border-danger/50 bg-ink-950/50 text-fg-muted hover:text-fg" : "border-line-strong bg-ink-950/50 text-fg-muted hover:border-fg-subtle/60 hover:text-fg"
              }`}
            >
              <input
                id={optionId}
                name={id}
                type="checkbox"
                value={o.value}
                checked={checked}
                onChange={(e) => toggle(o.value, e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-accent-500 focus:outline-none focus-visible:outline-none"
              />
              <span>{o.label}</span>
            </label>
          );
        })}
      </div>
      <ErrorText id={id} error={error} />
    </fieldset>
  );
}

/** A verified value the customer can see but not change (it comes from the project record). */
export function ReadOnlyField({ id, label, value, hint }: { id: string; label: ReactNode; value: string; hint: ReactNode }) {
  return (
    <div>
      <p id={`${id}-label`} className="mb-2 text-sm font-semibold text-fg">
        {label}
      </p>
      <div role="group" aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink-800/60 px-3.5 py-3 text-base text-fg sm:text-[0.95rem]">
        <span className="min-w-0 truncate">{value}</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ok">
          <Icon name="shield" className="size-3.5" />
          Verified
        </span>
      </div>
      <p id={`${id}-hint`} className="mt-2 text-xs leading-relaxed text-fg-subtle">
        {hint}
      </p>
    </div>
  );
}
