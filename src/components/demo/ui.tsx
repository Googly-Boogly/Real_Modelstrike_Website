import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { ItemResult, RunMode } from "@/lib/demo/workflow";
import type { Priority } from "@/lib/intake/schema";

export const inputClasses =
  "w-full rounded-lg border border-line-strong bg-ink-950 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70";

export function Panel({ id, title, icon, aside, children, className = "", ...rest }: { id: string; title: ReactNode; icon: IconName; aside?: ReactNode; children: ReactNode; className?: string; "data-tour"?: string }) {
  return (
    <section aria-labelledby={id} className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-ink-800 ${className}`} {...rest}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 id={id} className="flex items-center gap-2 font-display text-sm font-bold text-fg">
          <span className="grid size-7 place-items-center rounded-lg bg-accent-600/15 text-accent-300 ring-1 ring-inset ring-accent-400/30">
            <Icon name={icon} className="size-4" />
          </span>
          {title}
        </h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function Chip({ tone = "neutral", children, className = "" }: { tone?: "neutral" | "accent" | "ok" | "warn" | "danger"; children: ReactNode; className?: string }) {
  const tones = {
    neutral: "border-line-strong bg-ink-700 text-fg-muted",
    accent: "border-accent-400/40 bg-accent-600/15 text-accent-300",
    ok: "border-ok/40 bg-ok/10 text-ok",
    warn: "border-warn/40 bg-warn/10 text-warn",
    danger: "border-danger/50 bg-danger/10 text-danger",
  };
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]} ${className}`}>{children}</span>;
}

const priorityTone: Record<Priority, "neutral" | "warn" | "danger"> = { "Routine Review": "neutral", "Review Soon": "warn", "Immediate Review": "danger" };

export function PriorityChip({ priority }: { priority: Priority }) {
  return (
    <Chip tone={priorityTone[priority]}>
      <span className="sr-only">Priority: </span>
      {priority}
    </Chip>
  );
}

export function StatusChip({ result }: { result: ItemResult | undefined }) {
  if (!result) return <Chip tone="accent">New Request</Chip>;
  switch (result.status) {
    case "processing":
      return (
        <Chip tone="accent">
          <span aria-hidden className="size-2.5 animate-spin rounded-full border border-accent-300 border-t-transparent" />
          Processing
        </Chip>
      );
    case "review_ready":
      return <Chip tone="warn">Awaiting Review</Chip>;
    case "approved":
      return <Chip tone="ok">Approved</Chip>;
    case "rejected":
      return <Chip>Rejected</Chip>;
    case "error":
      return <Chip tone="danger">Needs Retry</Chip>;
  }
}

export function ModeChip({ mode }: { mode: RunMode }) {
  return mode === "live" ? (
    <Chip tone="ok">
      <span aria-hidden className="size-1.5 rounded-full bg-ok" />
      Live AI
    </Chip>
  ) : (
    <Chip tone="warn">Simulated Example</Chip>
  );
}

export function Spinner({ className = "size-4 border-accent-300" }: { className?: string }) {
  return <span aria-hidden className={`inline-block shrink-0 animate-spin rounded-full border-2 border-t-transparent ${className}`} />;
}
