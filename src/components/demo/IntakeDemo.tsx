"use client";

import { useRef, useState } from "react";
import { buttonClasses, BookingLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { intakeDemoCopy } from "@/content/intake-demo";
import { defaultIndustry, industries, type IndustryConfig } from "@/lib/intake/industries";
import { draftLimits, intakeLimits } from "@/lib/intake/schema";
import { Badge, ClassificationPanel, ExtractedFields, InboxMessage, StageCard, WorkflowProgress, type StepState } from "./DemoPanels";
import { useIntakeRun } from "./useIntakeRun";

type Review = "pending" | "approved" | "rejected" | "revision";

const inputClasses =
  "w-full rounded-lg border border-line-strong bg-ink-950 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70";

const copy = intakeDemoCopy;

export function IntakeDemo({ live }: { live: boolean }) {
  const [industry, setIndustry] = useState<IndustryConfig>(defaultIndustry);
  const [message, setMessage] = useState(defaultIndustry.sample?.message ?? "");
  const [inputError, setInputError] = useState("");
  const [edits, setEdits] = useState<{ subject?: string; body?: string }>({});
  const [editing, setEditing] = useState(false);
  const [review, setReview] = useState<Review>("pending");
  const [announcement, setAnnouncement] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const { run, start, reset: resetRun, showPreview } = useIntakeRun();

  const running = run.status === "running";
  const { extraction, classification, draft, failure } = run;
  const isSample = message === industry.sample?.message;
  const canPreview = Boolean(industry.sample);
  const canRunLive = live;

  const subject = edits.subject ?? draft?.subject ?? "";
  const body = edits.body ?? draft?.body ?? "";

  const clearReview = () => {
    setEdits({});
    setEditing(false);
    setReview("pending");
  };

  const clearResults = () => {
    resetRun();
    setInputError("");
    clearReview();
  };

  const selectIndustry = (next: IndustryConfig) => {
    clearResults();
    setIndustry(next);
    setMessage(next.sample?.message ?? "");
    setAnnouncement(`${next.label} selected.`);
  };

  const reset = () => {
    selectIndustry(industry);
    setAnnouncement("Demo reset.");
  };

  const onMessageChange = (value: string) => {
    setMessage(value);
    // Results describe the message as it was processed; drop them once it changes.
    if (run.status !== "idle" || inputError) clearResults();
  };

  const scrollToResults = () => {
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }));
  };

  const processMessage = () => {
    if (!canRunLive) {
      viewPreview();
      return;
    }
    const trimmed = message.trim();
    if (trimmed.length < intakeLimits.messageMin) {
      setInputError(trimmed ? "Please write a little more so there's something to process." : "Please enter a customer inquiry first.");
      return;
    }
    setInputError("");
    clearReview();
    void start(industry, message);
    scrollToResults();
  };

  const viewPreview = () => {
    if (!industry.sample) return;
    // A preview describes the original sample, so the message must match it.
    setMessage(industry.sample.message);
    setInputError("");
    clearReview();
    void showPreview(industry, industry.sample.message);
    scrollToResults();
  };

  const decide = (decision: Review) => {
    setEditing(false);
    setReview(decision);
  };

  const failedAt = failure?.stage;
  const stateOf = (doneFlag: boolean, stage: "received" | "extraction" | "classification" | "draft", previous: boolean): StepState => {
    if (doneFlag) return "done";
    if (failedAt === stage) return "failed";
    return running && previous ? "active" : "pending";
  };
  const reviewLabel = review === "approved" ? "Approved" : review === "rejected" ? "Rejected" : review === "revision" ? "Revision Requested" : "Awaiting Human Approval";
  const steps: { label: string; state: StepState }[] = [
    { label: "Inquiry Received", state: stateOf(run.received, "received", true) },
    { label: "Information Extracted", state: stateOf(Boolean(extraction), "extraction", run.received) },
    { label: "Request Classified", state: stateOf(Boolean(classification), "classification", Boolean(extraction)) },
    { label: "Response Drafted", state: stateOf(Boolean(draft), "draft", Boolean(classification)) },
    { label: reviewLabel, state: review !== "pending" ? "done" : run.status === "done" ? "waiting" : "pending" },
  ];

  const preview = run.mode === "preview";
  const aiBadge = preview ? "Precomputed" : "AI extracted";
  const decided = review !== "pending";
  const draftInvalid = !subject.trim() || !body.trim();
  const showResults = run.status !== "idle";
  const runDisabled = running || (!canRunLive && !canPreview);
  const showNotice = industry.id === "custom" || canRunLive;

  const status = decided
    ? copy.review[review]
    : running
      ? extraction
        ? "Information extracted. Drafting a response."
        : "Processing the inquiry."
      : failure
        ? failure.message
        : run.status === "done"
          ? `${preview ? "Example preview shown." : "Processing complete."} A response draft is awaiting your review.`
          : announcement;

  return (
    <div className="space-y-6">
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      <div className="rounded-2xl border border-line bg-ink-800/70 p-5 sm:p-6">
        <WorkflowProgress steps={steps} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* LEFT: industry + inquiry */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <fieldset>
            <legend className="mb-3 font-display text-lg font-bold text-fg">Choose an industry</legend>
            <div className="grid grid-cols-2 gap-3">
              {industries.map((i) => {
                const selected = i.id === industry.id;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => selectIndustry(i)}
                    aria-pressed={selected}
                    className={`rounded-xl border p-3.5 text-left transition-colors ${selected ? "border-accent-400 bg-accent-600/15" : "border-line bg-ink-800 hover:border-accent-400/50"}`}
                  >
                    <span className="flex items-start justify-between">
                      <Icon name={i.icon} className={`size-5 ${selected ? "text-accent-300" : "text-fg-muted"}`} />
                      {selected ? <Icon name="check" className="size-4 text-accent-300" /> : null}
                    </span>
                    <span className="mt-2 block text-sm font-semibold text-fg">{i.label}</span>
                    <span className="mt-1 block text-xs leading-snug text-fg-muted">{i.blurb}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="rounded-2xl border border-line bg-ink-800 p-5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <label htmlFor="demo-message" className="font-display text-base font-bold text-fg">
                Customer inquiry
              </label>
              <span className="font-mono text-[11px] text-fg-subtle">
                {message.length}/{intakeLimits.message}
              </span>
            </div>
            {industry.sample ? <p className="mb-2 text-xs text-fg-muted">Fictional example from: {industry.sample.source}. {canRunLive ? "Feel free to edit it." : ""}</p> : null}
            {showNotice ? (
              <p id="demo-notice" className="mb-3 flex gap-2 rounded-lg border border-warn/30 bg-warn/10 p-2.5 text-xs leading-relaxed text-fg">
                <Icon name="alert" className="mt-0.5 size-3.5 shrink-0 text-warn" />
                {copy.customNotice}
              </p>
            ) : null}
            <textarea
              id="demo-message"
              value={message}
              rows={8}
              maxLength={intakeLimits.message}
              readOnly={!canRunLive}
              disabled={running}
              placeholder="Example: Hi, I'd like a quote for…"
              aria-invalid={Boolean(inputError)}
              aria-describedby={[inputError ? "demo-input-error" : "", showNotice ? "demo-notice" : ""].filter(Boolean).join(" ") || undefined}
              onChange={(e) => onMessageChange(e.target.value)}
              className={`${inputClasses} resize-y leading-relaxed`}
            />
            {inputError ? (
              <p id="demo-input-error" className="mt-2 text-sm text-danger">
                {inputError}
              </p>
            ) : null}
            {!canRunLive ? <p className="mt-3 text-xs leading-relaxed text-fg-muted">{copy.offlineNotice}</p> : null}

            <button type="button" onClick={processMessage} disabled={runDisabled} className={buttonClasses({ size: "lg", className: "mt-4 w-full" })}>
              {running ? (
                <>
                  <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing…
                </>
              ) : (
                <>
                  <Icon name={canRunLive ? "play" : "eye"} className="size-4" />
                  {canRunLive ? "Run AI Automation" : "View Example Preview"}
                </>
              )}
            </button>
            {showResults ? (
              <button type="button" onClick={reset} className={buttonClasses({ variant: "ghost", className: "mt-3 w-full" })}>
                <Icon name="refresh" className="size-4" />
                {running ? "Cancel and Reset" : "Reset Demo"}
              </button>
            ) : null}
          </div>
        </div>

        {/* RIGHT: results */}
        <div ref={resultsRef} aria-busy={running} className="scroll-mt-24 space-y-5">
          {!showResults ? (
            <div className="grid min-h-[24rem] place-items-center rounded-2xl border border-dashed border-line-strong bg-ink-800/40 p-8 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-xl bg-ink-700 text-cyan-400">
                  <Icon name="sparkle" className="size-6" />
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-fg">Results appear here</h2>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  Click <strong className="text-fg">{canRunLive ? "Run AI Automation" : "View Example Preview"}</strong> to watch the inquiry become organized details and a draft reply for your team to review.
                </p>
              </div>
            </div>
          ) : null}

          {showResults ? <h2 className="sr-only">Processing results</h2> : null}

          {preview ? (
            <div className="rounded-2xl border border-warn/40 bg-warn/10 p-4 text-sm leading-relaxed text-fg">
              <p className="font-bold">{copy.previewLabel}</p>
              <p className="mt-1 text-fg-muted">{copy.previewExplainer}</p>
            </div>
          ) : null}

          {showResults && (run.received || running) ? <InboxMessage industry={industry} message={message} extraction={extraction} fictional={isSample} /> : null}

          {extraction ? <ExtractedFields industry={industry} extraction={extraction} aiBadge={aiBadge} /> : null}
          {classification ? <ClassificationPanel classification={classification} /> : null}

          {running ? (
            <div aria-hidden className="rounded-2xl border border-line bg-ink-800 p-5">
              <p className="flex items-center gap-3 text-sm font-semibold text-fg">
                <span className="size-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                {extraction ? "Drafting a response…" : "Reading the inquiry and extracting details…"}
              </p>
            </div>
          ) : null}

          {failure ? (
            <div role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 p-5 text-sm leading-relaxed text-fg">
              <p className="flex items-center gap-2 font-semibold">
                <Icon name="alert" className="size-5 shrink-0 text-danger" />
                This step didn&apos;t complete
              </p>
              <p className="mt-1 text-fg-muted">{failure.message}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {failure.retryable ? (
                  <button type="button" onClick={processMessage} className={buttonClasses({})}>
                    <Icon name="refresh" className="size-4" />
                    Try Again
                  </button>
                ) : null}
                {canPreview ? (
                  <button type="button" onClick={viewPreview} className={buttonClasses({ variant: "secondary" })}>
                    <Icon name="eye" className="size-4" />
                    View Example Preview
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {draft ? (
            <StageCard
              step={4}
              title={draft.source === "ai" ? "AI-Generated Draft — Awaiting Human Approval" : preview ? "Sample Draft — Awaiting Human Approval" : "Template Reply — Awaiting Human Approval"}
              icon="mail"
              badge={decided ? <Badge>{reviewLabel}</Badge> : undefined}
            >
              <div className="divide-y divide-line text-sm">
                <div className="flex items-center gap-3 px-5 py-2.5">
                  <label htmlFor="draft-subject" className="w-14 shrink-0 text-fg-muted">
                    Subject
                  </label>
                  {editing ? (
                    <input id="draft-subject" value={subject} maxLength={draftLimits.subject} onChange={(e) => setEdits({ ...edits, subject: e.target.value })} className={inputClasses} />
                  ) : (
                    <output id="draft-subject" className="font-semibold text-fg">
                      {subject}
                    </output>
                  )}
                </div>
                <div className="px-5 py-4">
                  {editing ? (
                    <>
                      <label htmlFor="draft-body" className="sr-only">
                        Response body
                      </label>
                      <textarea id="draft-body" value={body} rows={12} maxLength={draftLimits.body} onChange={(e) => setEdits({ ...edits, body: e.target.value })} className={`${inputClasses} resize-y leading-relaxed`} />
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed text-fg">{body}</p>
                  )}
                </div>
              </div>
            </StageCard>
          ) : null}

          {draft ? (
            <StageCard step={5} title="Human review and approval" icon="eye">
              <div className="p-5">
                {decided ? (
                  <div className={`demo-in mb-4 rounded-xl border p-4 text-sm leading-relaxed text-fg ${review === "approved" ? "border-ok/40 bg-ok/10" : "border-warn/40 bg-warn/10"}`}>
                    <p>{copy.review[review]}</p>
                    <BookingLink size="md" className="mt-3" />
                  </div>
                ) : (
                  <p className="mb-4 text-sm leading-relaxed text-fg-muted">AI did the preparation. A person decides what happens next.</p>
                )}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button type="button" onClick={() => decide("approved")} disabled={review === "approved" || draftInvalid} className={buttonClasses({ className: "px-2" })}>
                    <Icon name="check" className="size-4" />
                    Approve Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(!editing);
                      setReview("pending"); // a changed draft needs a fresh decision
                    }}
                    disabled={editing && draftInvalid}
                    aria-pressed={editing}
                    className={buttonClasses({ variant: "secondary", className: "px-2" })}
                  >
                    <Icon name={editing ? "check" : "pencil"} className="size-4" />
                    {editing ? "Done Editing" : "Edit Draft"}
                  </button>
                  <button type="button" onClick={() => decide("revision")} disabled={review === "revision"} className={buttonClasses({ variant: "secondary", className: "px-2" })}>
                    <Icon name="refresh" className="size-4" />
                    Request Revision
                  </button>
                  <button type="button" onClick={() => decide("rejected")} disabled={review === "rejected"} className={buttonClasses({ variant: "secondary", className: "px-2" })}>
                    <Icon name="close" className="size-4" />
                    Reject Draft
                  </button>
                </div>
                <p className="mt-3 text-xs text-fg-muted">{copy.review.footnote}</p>
              </div>
            </StageCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
