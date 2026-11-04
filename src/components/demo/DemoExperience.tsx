"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { tourIdle, tourReducer, type TourTarget } from "@/lib/demo/tour";
import { CUSTOM_ID, phaseLabels, phaseOf, type InboxItem } from "@/lib/demo/workflow";
import { defaultIndustry, industries } from "@/lib/intake/industries";
import { AIProcessingPanel, recordId } from "./AIProcessingPanel";
import { CustomerInbox } from "./CustomerInbox";
import { CustomerMessage } from "./CustomerMessage";
import { CustomerRecord } from "./CustomerRecord";
import { CustomRequestForm, type CustomDraft } from "./CustomRequestForm";
import { GUIDED_DEMO_EVENT, GuidedDemo } from "./GuidedDemo";
import { IndustrySelector } from "./IndustrySelector";
import { ResponseApproval } from "./ResponseApproval";
import { Chip, Panel } from "./ui";
import { useDemoWorkflow } from "./useDemoWorkflow";

const mobileSteps = ["Inquiry", "AI Processing", "Record", "Approval"] as const;
type MobileStep = 1 | 2 | 3 | 4;

const isCompact = () => window.matchMedia("(max-width: 1023px)").matches;

export function DemoExperience({ live }: { live: boolean }) {
  const wf = useDemoWorkflow(defaultIndustry);
  const { state, dispatch, industry } = wf;
  const [composing, setComposing] = useState<CustomDraft | null>(null);
  const [composeKey, setComposeKey] = useState(0);
  const [mobileStep, setMobileStep] = useState<MobileStep>(1);
  const [tour, tourDispatch] = useReducer(tourReducer, tourIdle);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const items: InboxItem[] = state.custom ? [...industry.samples, state.custom] : industry.samples;
  const selectedIndex = items.findIndex((i) => i.id === state.selectedId);
  const selected = selectedIndex >= 0 ? items[selectedIndex] : null;
  const result = selected ? state.results[selected.id] : undefined;
  const phase = phaseOf(state);
  const recordNumber = recordId(selectedIndex >= 0 ? selectedIndex : 0);
  const busy = state.activeRun !== null && state.activeRun.itemId !== selected?.id;
  const anyBusy = state.activeRun !== null;

  const goToStep = useCallback((step: MobileStep) => {
    setMobileStep(step);
    if (isCompact()) requestAnimationFrame(() => dashboardRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  }, []);

  const process = (item: InboxItem) => {
    setComposing(null);
    if (live) void wf.processLive(item);
    else void wf.processSimulated(item);
    if (isCompact()) goToStep(2);
  };

  const selectIndustry = (id: string) => {
    if (id === industry.id) return;
    wf.selectIndustry(id);
    setComposing(null);
    setMobileStep(1);
  };

  const reset = () => {
    wf.reset();
    setComposing(null);
    setMobileStep(1);
  };

  const submitCustom = (draft: Omit<InboxItem, "id">) => {
    const item: InboxItem = { ...draft, id: CUSTOM_ID, custom: true };
    dispatch({ type: "custom", item });
    process(item);
  };

  const openCompose = () => {
    setComposeKey((k) => k + 1);
    setComposing(selected ? { name: selected.name ?? "", email: selected.email ?? "", subject: selected.subject, body: selected.body } : { name: "", email: "", subject: "", body: "" });
  };

  // Guided demo: started from the hero or the toolbar.
  useEffect(() => {
    const start = () => tourDispatch({ type: "start" });
    window.addEventListener(GUIDED_DEMO_EVENT, start);
    return () => window.removeEventListener(GUIDED_DEMO_EVENT, start);
  }, []);

  const onTourEnter = (target: TourTarget) => {
    if (target === "inbox" || target === "process") {
      setComposing(null);
      setMobileStep(1);
      if (target === "process" && !state.selectedId) dispatch({ type: "select", itemId: industry.samples[0].id });
    } else if (target === "record") setMobileStep(3);
    else if (target === "approval") setMobileStep(4);
  };

  // One polite announcement for whatever just changed.
  const announcement =
    phase === "processing"
      ? `Processing the request from ${selected?.name ?? selected?.email ?? "the customer"}.`
      : phase === "review_ready"
        ? `${result?.mode === "simulated" ? "Simulated example shown." : "Processing complete."} A response draft is awaiting employee review.`
        : phase === "approved"
          ? "Draft approved in simulation. No message was sent."
          : phase === "rejected"
            ? "Draft rejected in simulation. No message was sent."
            : phase === "error"
              ? (result?.failure?.message ?? "Something went wrong.")
              : `${industry.label} selected.`;

  const show = (step: MobileStep) => (mobileStep === step ? "" : "hidden lg:flex");
  const newCount = items.filter((i) => !state.results[i.id]).length;

  return (
    <div className="space-y-8">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <IndustrySelector industries={industries} selected={industry} onSelect={selectIndustry} />

      <div ref={dashboardRef} className="scroll-mt-24 rounded-3xl border border-line bg-ink-900/60 p-3 shadow-2xl shadow-black/30 sm:p-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-1 pb-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-fg">2. Automation Dashboard</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              <span>{industry.label} · fictional business</span>
              {live ? (
                <Chip tone="ok">
                  <span aria-hidden className="size-1.5 rounded-full bg-ok" />
                  Live AI processing
                </Chip>
              ) : (
                <Chip tone="warn">Simulated Example Mode — live AI is off</Chip>
              )}
              <Chip tone="accent">
                <span className="sr-only">Status: </span>
                {phaseLabels[phase]}
              </Chip>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => tourDispatch({ type: "start" })} className={buttonClasses({ variant: "secondary", className: "flex-1 sm:flex-none" })}>
              <Icon name="play" className="size-4" />
              Guided Demo
            </button>
            <button type="button" onClick={reset} className={buttonClasses({ variant: "secondary", className: "flex-1 sm:flex-none" })}>
              <Icon name="refresh" className="size-4" />
              {anyBusy ? "Cancel & Reset" : "Reset"}
            </button>
          </div>
        </div>

        {/* Mobile / tablet: one step at a time */}
        <nav aria-label="Demo steps" className="mb-3 lg:hidden">
          <ol className="grid grid-cols-4 gap-1.5">
            {mobileSteps.map((label, i) => {
              const n = (i + 1) as MobileStep;
              const current = mobileStep === n;
              return (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => setMobileStep(n)}
                    aria-current={current ? "step" : undefined}
                    className={`flex min-h-11 w-full flex-col items-center justify-center rounded-lg border px-1 py-1.5 text-[11px] font-semibold leading-tight transition-colors ${current ? "border-accent-400 bg-accent-600/15 text-fg" : "border-line bg-ink-800 text-fg-muted"}`}
                  >
                    <span className="font-mono text-[10px] text-fg-subtle">{n}</span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-4">
          <Panel
            id="panel-inbox"
            title={industry.terms.inbox}
            icon="inbox"
            data-tour="inbox"
            aside={<span className="font-mono text-[11px] text-fg-subtle">{newCount} new</span>}
            className={show(1)}
          >
            <CustomerInbox
              items={items}
              results={state.results}
              selectedId={state.selectedId}
              composing={composing !== null}
              onSelect={(id) => {
                setComposing(null);
                dispatch({ type: "select", itemId: id });
              }}
              onCompose={() => (composing ? setComposing(null) : openCompose())}
            />
            {composing ? (
              <CustomRequestForm
                key={composeKey}
                industryId={industry.id}
                customerTerm={industry.terms.customer}
                initial={composing}
                live={live}
                busy={anyBusy}
                onSubmit={submitCustom}
                onCancel={() => setComposing(null)}
              />
            ) : selected ? (
              <CustomerMessage item={selected} industry={industry} result={result} live={live} busy={busy} onProcess={() => process(selected)} onEdit={openCompose} />
            ) : (
              <p className="border-t border-line p-4 text-center text-sm text-fg-muted">Select a request above to read the full message.</p>
            )}
          </Panel>

          <div className={`${show(2)} flex-col`}>
            <AIProcessingPanel
              item={selected}
              industry={industry}
              result={result}
              recordNumber={recordNumber}
              live={live}
              onRetry={() => selected && process(selected)}
              onSimulate={() => selected && void wf.processSimulated(selected)}
              onContinue={() => goToStep(3)}
            />
          </div>

          <div className={`${show(3)} flex-col`}>
            <CustomerRecord industry={industry} result={result} phase={phase} recordNumber={recordNumber} />
            {result?.draft ? (
              <button type="button" onClick={() => goToStep(4)} className={buttonClasses({ variant: "secondary", className: "mt-3 w-full lg:hidden" })}>
                Review the response
                <Icon name="arrowRight" className="size-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className={`mt-3 lg:mt-4 ${mobileStep === 4 ? "" : "hidden lg:block"}`}>
          <ResponseApproval
            key={`${selected?.id ?? "none"}-${result?.runId ?? 0}-${result?.regenerations ?? 0}`}
            item={selected}
            industry={industry}
            result={result}
            phase={phase}
            live={live}
            busy={anyBusy}
            onEdit={(subject, body) => selected && dispatch({ type: "edit", itemId: selected.id, subject, body })}
            onApprove={() => selected && dispatch({ type: "approve", itemId: selected.id })}
            onReject={(reason) => selected && dispatch({ type: "reject", itemId: selected.id, reason })}
            onReopen={() => selected && dispatch({ type: "reopen", itemId: selected.id })}
            onRegenerate={() => selected && void wf.regenerate(selected)}
          />
        </div>

        {/* Mobile step navigation */}
        <div className="mt-3 flex justify-between gap-2 lg:hidden">
          <button type="button" onClick={() => goToStep(Math.max(1, mobileStep - 1) as MobileStep)} disabled={mobileStep === 1} className={buttonClasses({ variant: "secondary", className: "flex-1" })}>
            Back
          </button>
          <button type="button" onClick={() => goToStep(Math.min(4, mobileStep + 1) as MobileStep)} disabled={mobileStep === 4} className={buttonClasses({ variant: "secondary", className: "flex-1" })}>
            {mobileStep < 4 ? `Next: ${mobileSteps[mobileStep as 1 | 2 | 3]}` : "Next"}
          </button>
        </div>
      </div>

      <GuidedDemo tour={tour} onAction={tourDispatch} onEnter={onTourEnter} />
    </div>
  );
}
