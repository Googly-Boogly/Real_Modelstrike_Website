import { useId, useMemo, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { IndustryConfig } from "@/lib/intake/industries";
import type { Classification, Extraction, Priority } from "@/lib/intake/schema";

export type StepState = "done" | "active" | "waiting" | "failed" | "pending";

const stateText: Record<StepState, string> = { done: "completed", active: "in progress", waiting: "waiting for you", failed: "failed", pending: "not started" };

export function WorkflowProgress({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <ol aria-label="Workflow progress" className="grid gap-2 sm:grid-cols-5 sm:gap-0">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center">
          {i > 0 ? <span aria-hidden className={`absolute -left-1/2 top-4 hidden h-px w-full transition-colors duration-500 sm:block ${s.state === "pending" ? "bg-line-strong" : "bg-ok/50"}`} /> : null}
          <span
            aria-hidden
            className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
              s.state === "done"
                ? "border-ok/60 bg-ink-900 text-ok"
                : s.state === "failed"
                  ? "border-danger/60 bg-ink-900 text-danger"
                  : s.state === "pending"
                    ? "border-line-strong bg-ink-900 text-fg-subtle"
                    : "border-accent-400 bg-ink-900 text-accent-300"
            }`}
          >
            {s.state === "done" ? (
              <Icon name="check" className="demo-in size-4" />
            ) : s.state === "failed" ? (
              <Icon name="close" className="size-4" />
            ) : s.state === "waiting" ? (
              <Icon name="clock" className="size-4" />
            ) : s.state === "active" ? (
              <span className="size-3.5 animate-spin rounded-full border-2 border-accent-300 border-t-transparent" />
            ) : (
              <span className="size-2 rounded-full border border-current" />
            )}
          </span>
          <span className={`text-sm font-medium ${s.state === "pending" ? "text-fg-subtle" : "text-fg"}`}>
            {s.label}
            <span className="sr-only"> — {stateText[s.state]}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function StageCard({ step, title, icon, badge, children }: { step: number; title: string; icon: IconName; badge?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="demo-in overflow-hidden rounded-2xl border border-line bg-ink-800 shadow-xl shadow-black/20">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h3 id={id} className="flex items-center gap-2.5 font-display text-base font-bold text-fg">
          <span className="grid size-8 place-items-center rounded-lg bg-accent-600/15 text-accent-300 ring-1 ring-inset ring-accent-400/30">
            <Icon name={icon} className="size-4" />
          </span>
          <span>
            <span className="mr-1.5 font-mono text-xs font-medium text-fg-subtle">{step}.</span>{" "}
            {title}
          </span>
        </h3>
        {badge}
      </header>
      {children}
    </section>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-line-strong px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-fg-muted">{children}</span>;
}

/** Splits a message into plain and highlighted runs for each value found in it. */
function highlight(message: string, values: string[]) {
  const ranges: [number, number][] = [];
  const lower = message.toLowerCase();
  for (const value of values) {
    const at = lower.indexOf(value.toLowerCase());
    if (at >= 0) ranges.push([at, at + value.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const parts: { text: string; marked: boolean }[] = [];
  let cursor = 0;
  for (const [from, to] of ranges) {
    if (from < cursor) continue;
    if (from > cursor) parts.push({ text: message.slice(cursor, from), marked: false });
    parts.push({ text: message.slice(from, to), marked: true });
    cursor = to;
  }
  if (cursor < message.length) parts.push({ text: message.slice(cursor), marked: false });
  return parts;
}

export function InboxMessage({ industry, message, extraction, fictional }: { industry: IndustryConfig; message: string; extraction: Extraction | null; fictional: boolean }) {
  const parts = useMemo(() => {
    const verbatim = industry.fields.filter((f) => f.grounding === "verbatim").flatMap((f) => extraction?.fields[f.key] ?? []);
    return highlight(message, verbatim);
  }, [industry, message, extraction]);

  return (
    <StageCard step={1} title="New customer inquiry received" icon="inbox" badge={<Badge>Received</Badge>}>
      <div className="p-5">
        <p className="mb-3 text-xs text-fg-subtle">
          Source: {industry.sample?.source ?? "Visitor example"}
          {fictional ? " · Fictional example" : " · Visitor-written example"}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
          {parts.map((p, i) =>
            p.marked ? (
              <mark key={i} className="rounded bg-cyan-400/15 px-0.5 text-cyan-300 ring-1 ring-inset ring-cyan-400/30">
                {p.text}
              </mark>
            ) : (
              <span key={i}>{p.text}</span>
            ),
          )}
        </p>
      </div>
    </StageCard>
  );
}

export function ExtractedFields({ industry, extraction, aiBadge }: { industry: IndustryConfig; extraction: Extraction; aiBadge: string }) {
  return (
    <StageCard step={2} title="Information extracted" icon="sparkle" badge={<Badge>{aiBadge}</Badge>}>
      <div className="p-5">
        <p className="rounded-xl border border-accent-500/30 bg-accent-600/10 p-3.5 text-sm leading-relaxed text-fg">
          <span className="sr-only">Summary: </span>
          {extraction.summary}
        </p>
        <dl className="mt-2 divide-y divide-line">
          {industry.fields.map((f) => {
            const value = extraction.fields[f.key];
            return (
              <div key={f.key} className="grid grid-cols-[auto_1fr] items-start gap-x-3 py-2.5 sm:grid-cols-[auto_10rem_1fr]">
                <Icon name={f.icon} className="mt-0.5 size-4 text-fg-subtle" />
                <dt className="text-sm text-fg-muted">{f.label}</dt>
                <dd className="col-start-2 text-sm font-medium text-fg sm:col-start-3">
                  {value ? (
                    <>
                      {value}
                      {f.key === "preferred_time" ? <span className="ml-2 text-xs font-normal text-fg-muted">(requested, not booked)</span> : null}
                    </>
                  ) : (
                    <span className="font-normal italic text-fg-muted">Not provided</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </StageCard>
  );
}

const priorityStyles: Record<Priority, string> = {
  "Routine Review": "border-line-strong bg-ink-700 text-fg-muted",
  "Review Soon": "border-warn/40 bg-warn/10 text-warn",
  "Immediate Review": "border-danger/50 bg-danger/10 text-danger",
};

export function ClassificationPanel({ classification: c }: { classification: Classification }) {
  return (
    <StageCard step={3} title="Categorized and prioritized" icon="workflow" badge={<Badge>Business rules</Badge>}>
      <dl className="grid gap-x-6 gap-y-4 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-fg-muted">Category</dt>
          <dd className="mt-1 font-semibold text-fg">{c.category}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Suggested routing</dt>
          <dd className="mt-1 font-semibold text-fg">{c.department}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-fg-muted">Proposed priority</dt>
          <dd className="mt-1">
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[c.priority]}`}>{c.priority}</span>
            <ul className="mt-2 space-y-1 text-fg-muted">
              {c.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-fg-muted">A proposal for an employee to confirm, not a safety assessment.</p>
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted">Missing information</dt>
          <dd className="mt-1 font-semibold text-fg">{c.missing.length > 0 ? c.missing.join(", ") : "Nothing required is missing"}</dd>
        </div>
        <div>
          <dt className="text-fg-muted">Recommended next action</dt>
          <dd className="mt-1 font-semibold text-fg">{c.next_action}</dd>
        </div>
      </dl>
    </StageCard>
  );
}
