import { processOverview } from "@/content/process";
import { Icon } from "@/components/ui/Icon";

/** Four connected steps: horizontal on desktop, vertical rail on mobile. */
export function ProcessTimeline() {
  return (
    <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-6">
      <span aria-hidden className="absolute bottom-6 left-6 top-6 w-px bg-linear-to-b from-accent-500/70 via-line-strong to-transparent lg:hidden" />
      <span aria-hidden className="absolute left-6 right-6 top-6 hidden h-px bg-linear-to-r from-accent-500/80 via-cyan-400/50 to-line-strong lg:block" />
      {processOverview.map((step, i) => (
        <li key={step.title} className="reveal relative flex gap-5 lg:block">
          <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-xl border border-line-strong bg-ink-900 text-accent-400 shadow-[0_0_0_6px_var(--color-ink-900)]">
            <Icon name={step.icon} className="size-5" />
          </span>
          <div className="lg:mt-6">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-cyan-400">Step {String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-2 font-display text-xl font-bold text-fg">{step.title}</h3>
            <p className="mt-2 leading-relaxed text-fg-muted">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
