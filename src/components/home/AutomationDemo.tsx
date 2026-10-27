"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { demo, demoSteps, type DemoStepId } from "@/content/demo";
import { Icon } from "@/components/ui/Icon";

const STEP_MS = 4200;

function Label({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-fg-subtle">{children}</p>;
}

function MessageCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-xl border border-line-strong bg-ink-900 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-ink-700 text-sm font-semibold text-accent-300">JR</span>
          <div>
            <p className="text-sm font-semibold text-fg">{demo.customer.name}</p>
            <p className="text-xs text-fg-subtle">{demo.customer.channel}</p>
          </div>
        </div>
        <p className="font-mono text-[11px] text-fg-subtle">{demo.customer.receivedAt}</p>
      </div>
      <p className={`mt-4 leading-relaxed text-fg ${compact ? "text-sm" : "text-base sm:text-lg"}`}>&ldquo;{demo.message}&rdquo;</p>
    </div>
  );
}

function StepPanel({ id }: { id: DemoStepId }) {
  switch (id) {
    case "incoming":
      return (
        <div className="space-y-4">
          <Label>New inquiry · {demo.company}</Label>
          <MessageCard />
          <p className="flex items-center gap-2 text-sm text-fg-muted">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-cyan-400" />
            Waiting in the inbox. Without automation, someone reads, sorts, and re-types this by hand.
          </p>
        </div>
      );
    case "analysis":
      return (
        <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-3">
            <Label>Input</Label>
            <MessageCard compact />
          </div>
          <div className="space-y-3">
            <Label>Structured extraction</Label>
            <pre className="overflow-x-auto rounded-xl border border-line-strong bg-ink-950 p-4 font-mono text-[13px] leading-7">
              <code>
                <span className="text-fg-subtle">{"{"}</span>
                {"\n"}
                {demo.extraction.map(([k, v], i) => (
                  <span key={k} className="demo-in block" style={{ animationDelay: `${150 + i * 180}ms` }}>
                    {"  "}
                    <span className="text-accent-300">&quot;{k}&quot;</span>
                    <span className="text-fg-subtle">: </span>
                    <span className={k === "urgency" ? "text-warn" : "text-cyan-300"}>&quot;{v}&quot;</span>
                    <span className="text-fg-subtle">{i < demo.extraction.length - 1 ? "," : ""}</span>
                  </span>
                ))}
                <span className="text-fg-subtle">{"}"}</span>
              </code>
            </pre>
          </div>
        </div>
      );
    case "automation":
      return (
        <div className="space-y-4">
          <Label>Workflow actions</Label>
          <ol className="space-y-3">
            {demo.actions.map((a, i) => (
              <li
                key={a.label}
                className="demo-in flex items-start gap-3 rounded-xl border border-line-strong bg-ink-900 p-4"
                style={{ animationDelay: `${150 + i * 260}ms` }}
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ok/15 text-ok">
                  <Icon name="check" className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">{a.label}</p>
                  <p className="mt-0.5 font-mono text-xs text-fg-muted">{a.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );
    case "review":
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label>Work item</Label>
            <div className="rounded-xl border border-line-strong bg-ink-900 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs text-accent-300">{demo.workItem.id}</p>
                <span className="rounded-full bg-warn/15 px-2 py-0.5 text-[11px] font-semibold text-warn">High</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-fg">{demo.workItem.title}</p>
              <dl className="mt-3 space-y-1.5 text-sm">
                {demo.workItem.fields.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-t border-line pt-1.5">
                    <dt className="text-fg-subtle">{k}</dt>
                    <dd className="text-right text-fg-muted">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Drafted response</Label>
            <div className="rounded-xl border border-line-strong bg-ink-900 p-4">
              <p className="text-sm leading-relaxed text-fg">{demo.draftReply}</p>
              <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-fg-muted">
                <Icon name="user" className="size-4 text-accent-400" />
                Awaiting approval — nothing is sent until a team member reviews it.
              </div>
            </div>
          </div>
        </div>
      );
  }
}

export function AutomationDemo() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const last = demoSteps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (active >= last) {
      const t = setTimeout(() => setPlaying(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActive((i) => Math.min(i + 1, last)), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, active, last]);

  const select = (i: number, focus = false) => {
    setPlaying(false);
    setActive(i);
    if (focus) tabRefs.current[i]?.focus();
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = {
      ArrowDown: active + 1,
      ArrowRight: active + 1,
      ArrowUp: active - 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: last,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    select((keys[e.key] + demoSteps.length) % demoSteps.length, true);
  };

  const togglePlay = () => {
    if (playing) return setPlaying(false);
    if (active >= last) setActive(0);
    setPlaying(true);
  };

  const step = demoSteps[active];

  return (
    <div className="ring-gradient overflow-hidden rounded-2xl bg-ink-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-warn">
            Simulated demo
          </span>
          <span className="text-xs text-fg-subtle">Fictional data · no live AI calls</span>
        </div>
        <button
          type="button"
          onClick={togglePlay}
          className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-accent-400/60 hover:bg-ink-700"
        >
          <Icon name={playing ? "pause" : "play"} className="size-3.5" />
          {playing ? "Pause" : active >= last ? "Replay walkthrough" : "Play walkthrough"}
        </button>
      </div>

      <div className="grid lg:grid-cols-[17rem_1fr]">
        <div role="tablist" aria-label="Demo steps" aria-orientation="vertical" className="flex gap-1 overflow-x-auto border-b border-line p-3 lg:flex-col lg:border-b-0 lg:border-r lg:p-4">
          {demoSteps.map((s, i) => {
            const selected = i === active;
            const done = i < active;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={`demo-tab-${s.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="demo-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => select(i)}
                onKeyDown={onTabKey}
                className={`relative flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors lg:min-w-0 ${
                  selected ? "bg-ink-700 text-fg" : "text-fg-muted hover:bg-ink-700/50 hover:text-fg"
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full border font-mono text-xs font-semibold ${
                    selected ? "border-accent-400 bg-accent-600 text-white" : done ? "border-ok/50 text-ok" : "border-line-strong text-fg-subtle"
                  }`}
                >
                  {done ? <Icon name="check" className="size-3.5" /> : i + 1}
                </span>
                <span className="text-sm font-semibold">{s.label}</span>
                {selected && playing ? (
                  <span aria-hidden className="absolute inset-x-3 bottom-1 h-0.5 overflow-hidden rounded bg-line-strong">
                    <span key={active} className="demo-progress block h-full bg-cyan-400" style={{ animationDuration: `${STEP_MS}ms` }} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div
          id="demo-panel"
          role="tabpanel"
          aria-labelledby={`demo-tab-${step.id}`}
          aria-live={playing ? "polite" : "off"}
          className="min-h-[27rem] p-4 sm:p-6"
        >
          <p className="mb-5 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Step {active + 1}.</span> {step.caption}
          </p>
          <div key={step.id} className="demo-in">
            <StepPanel id={step.id} />
          </div>
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => select(Math.max(active - 1, 0))}
              disabled={active === 0}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-fg-muted hover:text-fg disabled:opacity-40"
            >
              <Icon name="arrowRight" className="size-4 rotate-180" />
              Back
            </button>
            <button
              type="button"
              onClick={() => select(Math.min(active + 1, last))}
              disabled={active === last}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink-700 px-3 py-2 text-sm font-semibold text-fg hover:bg-ink-600 disabled:opacity-40"
            >
              Next step
              <Icon name="arrowRight" className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
