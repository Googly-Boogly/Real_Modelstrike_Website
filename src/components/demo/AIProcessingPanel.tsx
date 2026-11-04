import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { InboxItem, ItemResult } from "@/lib/demo/workflow";
import type { IndustryConfig } from "@/lib/intake/industries";
import { composeInquiry } from "@/lib/intake/schema";
import { Panel, Spinner } from "./ui";

type StageState = "pending" | "active" | "done" | "failed";

const stateText: Record<StageState, string> = { pending: "not started", active: "in progress", done: "complete", failed: "failed" };

/** Stage states come straight from the run's real progress; nothing is timed or faked. */
export function stageStates(result: ItemResult | undefined): StageState[] {
  if (!result) return ["pending", "pending", "pending", "pending", "pending"];
  const running = result.status === "processing";
  const failedAt = result.failure?.stage;
  const one = (done: boolean, stage: string | null, previousDone: boolean): StageState => (done ? "done" : failedAt === stage ? "failed" : running && previousDone ? "active" : "pending");
  const read = one(result.received, "received", true);
  const extract = one(Boolean(result.extraction), "extraction", result.received);
  const classify = one(Boolean(result.classification), "classification", Boolean(result.extraction));
  const record = result.classification ? "done" : "pending";
  const draft = one(Boolean(result.draft), "draft", Boolean(result.classification));
  return [read, extract, classify, record, draft];
}

export function recordId(index: number) {
  return `DEMO-${1001 + index}`;
}

export function AIProcessingPanel({
  item,
  industry,
  result,
  recordNumber,
  live,
  onRetry,
  onSimulate,
  onContinue,
}: {
  item: InboxItem | null;
  industry: IndustryConfig;
  result: ItemResult | undefined;
  recordNumber: string;
  live: boolean;
  onRetry: () => void;
  onSimulate: () => void;
  onContinue: () => void;
}) {
  const states = stageStates(result);
  const done = states.filter((s) => s === "done").length;
  const words = item ? composeInquiry(item).split(/\s+/).filter(Boolean).length : 0;
  const extracted = industry.fields.filter((f) => result?.extraction?.fields[f.key]).length;
  const c = result?.classification;

  const stages = [
    { title: "Read Request", body: "Analyzing incoming customer inquiry.", detail: `Read ${words} words from the message.` },
    {
      title: "Extract Information",
      body: "Finding name, contact details, the request, timing and other useful details.",
      detail: `Found ${extracted} of ${industry.fields.length} fields. Anything not in the message is left blank.`,
    },
    { title: "Classify Request", body: "Deciding category, priority, missing information and whether a person must step in.", detail: c ? `${c.category} · ${c.priority}${c.escalation.required ? " · Escalated" : ""}` : "" },
    { title: `Prepare ${industry.terms.record}`, body: "Creating a simulated record in the Demo CRM.", detail: `${recordNumber} drafted in the Demo CRM (simulated).` },
    { title: "Generate Response", body: "Writing a reply draft for an employee to approve.", detail: result?.draft ? (result.draft.source === "ai" ? "Draft ready for review." : "Template reply ready for review.") : "" },
  ];

  const failure = result?.failure;
  const canSimulate = item && !item.custom;

  return (
    <Panel id="panel-processing" title="AI Processing" icon="sparkle" aside={result ? <span className="font-mono text-[11px] text-fg-subtle">{done}/5 stages</span> : null} className="h-full">
      <div className="flex flex-1 flex-col p-4">
        <div
          role="progressbar"
          aria-label="Processing progress"
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={done}
          aria-valuetext={`${done} of 5 stages complete`}
          className="h-1.5 overflow-hidden rounded-full bg-ink-700"
        >
          <div className={`h-full rounded-full transition-[width] duration-500 ${failure ? "bg-danger" : done === 5 ? "bg-ok" : "bg-accent-500"}`} style={{ width: `${(done / 5) * 100}%` }} />
        </div>

        {result?.mode === "simulated" ? (
          <p className="mt-3 rounded-lg border border-warn/40 bg-warn/10 p-2.5 text-xs leading-relaxed text-fg">
            <strong className="font-semibold">Simulated example — not live AI processing.</strong> These are precomputed results for the original sample, run through the same business rules.
          </p>
        ) : null}

        <ol className="mt-4 space-y-1">
          {stages.map((s, i) => {
            const st = states[i];
            return (
              <li key={s.title} className={`flex gap-3 rounded-xl p-2.5 transition-colors ${st === "active" ? "bg-accent-600/10" : ""}`}>
                <span
                  aria-hidden
                  className={`relative grid size-7 shrink-0 place-items-center rounded-full border text-xs ${
                    st === "done" ? "border-ok/60 text-ok" : st === "failed" ? "border-danger/60 text-danger" : st === "active" ? "border-accent-400 text-accent-300" : "border-line-strong text-fg-subtle"
                  }`}
                >
                  {st === "done" ? <Icon name="check" className="demo-in size-3.5" /> : st === "failed" ? <Icon name="close" className="size-3.5" /> : st === "active" ? <Spinner className="size-3 border-accent-300" /> : i + 1}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${st === "pending" ? "text-fg-subtle" : "text-fg"}`}>
                    {s.title}
                    <span className="sr-only"> — {stateText[st]}</span>
                  </p>
                  <p className="text-xs leading-relaxed text-fg-muted">{st === "done" && s.detail ? s.detail : s.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        {result?.extraction ? (
          <div className="demo-in mt-3 rounded-xl border border-accent-500/30 bg-accent-600/10 p-3 text-sm leading-relaxed text-fg">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-accent-300">AI summary</p>
            {result.extraction.summary}
          </div>
        ) : null}

        {failure ? (
          <div role="alert" className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm leading-relaxed text-fg">
            <p className="flex items-center gap-2 font-semibold">
              <Icon name="alert" className="size-4 shrink-0 text-danger" />
              This step didn&apos;t complete
            </p>
            <p className="mt-1 text-fg-muted">{failure.message}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {failure.retryable ? (
                <button type="button" onClick={onRetry} className={buttonClasses({})}>
                  <Icon name="refresh" className="size-4" />
                  Try Again
                </button>
              ) : null}
              {canSimulate ? (
                <button type="button" onClick={onSimulate} className={buttonClasses({ variant: "secondary" })}>
                  <Icon name="eye" className="size-4" />
                  View Simulated Example
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-auto pt-4">
          {!result ? (
            <p className="rounded-xl border border-dashed border-line-strong p-3 text-center text-xs leading-relaxed text-fg-muted">
              {item ? (
                <>
                  Click <strong className="text-fg">Process With AI</strong> to run this request through the workflow{live ? "." : " (simulated example)."}
                </>
              ) : (
                "Select a request from the inbox to begin."
              )}
            </p>
          ) : (
            <p className="flex items-start gap-2 text-xs leading-relaxed text-fg-muted">
              <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-ok" />
              Human approval required. Nothing is sent automatically.
            </p>
          )}
          {result?.draft && result.status !== "processing" ? (
            <button type="button" onClick={onContinue} className={buttonClasses({ variant: "secondary", className: "mt-3 w-full lg:hidden" })}>
              View {industry.terms.record}
              <Icon name="arrowRight" className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
