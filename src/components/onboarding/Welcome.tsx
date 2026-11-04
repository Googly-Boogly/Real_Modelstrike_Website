"use client";

import { useEffect, useRef } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/SectionHeader";
import { onboardingCopy } from "@/content/onboarding";
import type { ProjectContext } from "@/lib/onboarding/backend";

const c = onboardingCopy.welcome;

export function Welcome({ project, onStart }: { project: ProjectContext; onStart: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  const rows: [string, string][] = [
    ["Company", project.company],
    ["Project", project.projectName],
    ["Primary Contact", project.contact.name || "—"],
  ];

  return (
    <section aria-labelledby="welcome-title" className="demo-in">
      <Eyebrow>{c.eyebrow}</Eyebrow>
      <h1 id="welcome-title" ref={headingRef} tabIndex={-1} className="font-display text-4xl font-extrabold text-fg outline-none sm:text-5xl">
        <span className="text-gradient">{c.title}</span>
      </h1>
      <p className="mt-5 text-lg font-medium text-fg sm:text-xl">{c.intro}</p>
      {c.body.map((p) => (
        <p key={p} className="mt-3 text-lg leading-relaxed text-fg-muted">
          {p}
        </p>
      ))}

      <div className="ring-gradient mt-8 rounded-2xl bg-ink-800/70 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-fg-subtle">Your project</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ok/10 px-2.5 py-1 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ok ring-1 ring-inset ring-ok/30">
            <Icon name="shield" className="size-3.5" />
            Verified invitation
          </span>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          {rows.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs text-fg-subtle">{k}</dt>
              <dd className="mt-1 break-words font-semibold text-fg">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button type="button" onClick={onStart} className={buttonClasses({ size: "lg" })}>
          {c.start}
          <Icon name="arrowRight" className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </button>
        <p className="inline-flex items-center gap-2 text-sm text-fg-muted">
          <Icon name="clock" className="size-4 text-cyan-400" />
          {c.time}
        </p>
      </div>

      <div className="mt-10 space-y-2 border-t border-line pt-6 text-sm leading-relaxed text-fg-subtle">
        <p>{c.use}</p>
        <p className="flex items-start gap-2 text-fg-muted">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-warn" />
          {c.caution}
        </p>
      </div>
    </section>
  );
}
