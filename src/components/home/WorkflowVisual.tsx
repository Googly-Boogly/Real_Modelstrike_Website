import { LogoMark } from "@/components/layout/Logo";
import { Icon, type IconName } from "@/components/ui/Icon";

// Illustrative hero diagram. Pure CSS animation (no client JS); motion is
// removed under prefers-reduced-motion, leaving a complete static diagram.

function Connector({ delay = "0s" }: { delay?: string }) {
  return (
    <div className="relative mx-auto h-9 w-px overflow-hidden bg-line-strong">
      <span
        className="motion-flow absolute inset-x-0 top-0 h-1/3 animate-flow bg-linear-to-b from-transparent via-cyan-400 to-transparent"
        style={{ animationDelay: delay }}
      />
    </div>
  );
}

/** One line in, three lines out — aligned to a three-column grid below it. */
function Fork() {
  return (
    <div className="relative h-10">
      <span className="absolute left-1/2 top-0 h-1/2 w-px bg-line-strong" />
      <span className="absolute left-[16.66%] right-[16.66%] top-1/2 h-px bg-line-strong" />
      {["16.66%", "50%", "83.33%"].map((left, i) => (
        <span key={left} className="absolute top-1/2 h-1/2 w-px overflow-hidden bg-line-strong" style={{ left }}>
          <span
            className="motion-flow absolute inset-x-0 top-0 h-1/2 animate-flow bg-linear-to-b from-transparent via-accent-400 to-transparent"
            style={{ animationDelay: `${1.2 + i * 0.25}s` }}
          />
        </span>
      ))}
    </div>
  );
}

const steps: { label: string; delay: string }[] = [
  { label: "Analyze", delay: "0s" },
  { label: "Extract", delay: "0.4s" },
  { label: "Categorize", delay: "0.8s" },
];

const outputs: { label: string; icon: IconName; note: string }[] = [
  { label: "CRM", icon: "database", note: "Record ready" },
  { label: "Email", icon: "mail", note: "Reply drafted" },
  { label: "Scheduling", icon: "calendar", note: "Slot requested" },
];

export function WorkflowVisual() {
  return (
    <figure className="relative">
      {/* soft accent light behind the panel */}
      <div aria-hidden className="absolute -inset-8 -z-10 rounded-[2rem] bg-[radial-gradient(closest-side,rgb(37_99_235/0.22),transparent)]" />

      <div aria-hidden className="ring-gradient overflow-hidden rounded-2xl bg-ink-800/90 shadow-2xl shadow-black/40 backdrop-blur">
        {/* window chrome */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="size-2.5 rounded-full bg-line-strong" />
            <span className="ml-3 font-mono text-[11px] text-fg-subtle">customer-intake.workflow</span>
          </div>
          <span className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
            Illustrative
          </span>
        </div>

        <div className="bg-dots p-4 sm:p-6">
          {/* 1. inquiry */}
          <div className="rounded-xl border border-line-strong bg-ink-900/90 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
                <span className="grid size-6 place-items-center rounded-md bg-ink-700 text-accent-400">
                  <Icon name="inbox" className="size-3.5" />
                </span>
                Customer inquiry
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-cyan-400">
                <span className="size-1.5 animate-pulse-dot rounded-full bg-cyan-400" />
                New
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-fg">
              &ldquo;My air conditioner stopped working this morning. Can someone come out tomorrow afternoon?&rdquo;
            </p>
          </div>

          <Connector />

          {/* 2. AI node */}
          <div className="ring-gradient rounded-xl bg-ink-700/80 p-4">
            <div className="flex items-center gap-2.5">
              <LogoMark className="size-7" />
              <div>
                <p className="font-display text-sm font-bold text-fg">ModelStrike AI</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-fg-subtle">Processing</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {steps.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 rounded-lg border border-line bg-ink-900/70 px-2 py-2 text-[11px] font-medium text-fg-muted sm:text-xs">
                  <span className="size-1.5 shrink-0 animate-pulse-dot rounded-full bg-ok" style={{ animationDelay: s.delay }} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <Fork />

          {/* 3. business systems */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {outputs.map((o) => (
              <div key={o.label} className="rounded-xl border border-line-strong bg-ink-900/90 p-3 text-center">
                <span className="mx-auto grid size-8 place-items-center rounded-lg bg-ink-700 text-accent-300">
                  <Icon name={o.icon} className="size-4" />
                </span>
                <p className="mt-2 text-xs font-semibold text-fg sm:text-sm">{o.label}</p>
                <p className="mt-1 flex flex-col items-center justify-center gap-0.5 text-[10px] leading-tight text-ok sm:flex-row sm:gap-1 sm:text-[11px]">
                  <Icon name="check" className="size-3 shrink-0" />
                  {o.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="mt-4 text-center text-xs text-fg-subtle">
        Illustrative example workflow — not a live customer integration.
      </figcaption>
    </figure>
  );
}
