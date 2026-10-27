"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { processIntakeEmail } from "@/app/demo/actions";
import { intakeDemoCopy, sampleEmails, simulatedAnalysis, type SampleEmail } from "@/content/intake-demo";
import { Icon, type IconName } from "@/components/ui/Icon";
import { buttonClasses } from "@/components/ui/Button";
import { intakeLimits, type IntakeAnalysis, type Priority } from "@/lib/intake/schema";

type Phase = "idle" | "processing" | "done" | "error";
type StepState = "done" | "active" | "waiting" | "pending";

// Simulated mode only: a brief pause so the transition reads as a process, not a page swap.
const SIMULATED_DELAY_MS = 1200;

const inputClasses =
  "w-full rounded-lg border border-line-strong bg-ink-950 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-accent-400 focus:outline-none disabled:cursor-not-allowed";

const priorityStyles: Record<Priority, string> = {
  Low: "border-line-strong bg-ink-700 text-fg-muted",
  Normal: "border-accent-400/40 bg-accent-600/15 text-accent-300",
  High: "border-warn/40 bg-warn/10 text-warn",
  Emergency: "border-danger/50 bg-danger/10 text-danger",
};

function Card({ title, icon, aside, children, className = "" }: { title: string; icon: IconName; aside?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={`overflow-hidden rounded-2xl border border-line bg-ink-800 shadow-xl shadow-black/20 ${className}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id={id} className="flex items-center gap-2.5 font-display text-lg font-bold text-fg">
          <span className="grid size-8 place-items-center rounded-lg bg-accent-600/15 text-accent-300 ring-1 ring-inset ring-accent-400/30">
            <Icon name={icon} className="size-4" />
          </span>
          {title}
        </h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Workflow({ steps }: { steps: { label: string; state: StepState }[] }) {
  const stateText: Record<StepState, string> = { done: "completed", active: "in progress", waiting: "waiting for you", pending: "not started" };
  return (
    <ol aria-label="Workflow progress" className="grid gap-2 sm:grid-cols-5 sm:gap-0">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center">
          {i > 0 ? (
            <span
              aria-hidden
              className={`absolute top-4 -left-1/2 hidden h-px w-full transition-colors duration-500 sm:block ${s.state === "pending" ? "bg-line-strong" : "bg-ok/50"}`}
            />
          ) : null}
          <span
            aria-hidden
            className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors duration-300 ${
              s.state === "done"
                ? "border-ok/60 bg-ok/15 text-ok"
                : s.state === "active" || s.state === "waiting"
                  ? "border-accent-400 bg-ink-900 text-accent-300"
                  : "border-line-strong bg-ink-900 text-fg-subtle"
            }`}
          >
            {s.state === "done" ? (
              <Icon name="check" key="done" className="demo-in size-4" />
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

function FieldRow({ icon, label, value, children }: { icon: IconName; label: string; value?: string | null; children?: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-start gap-3 py-2.5 sm:grid-cols-[auto_11rem_1fr]">
      <Icon name={icon} className="mt-0.5 size-4 text-fg-subtle" />
      <dt className="text-sm text-fg-muted">{label}</dt>
      <dd className="col-start-2 text-sm font-medium text-fg sm:col-start-3">
        {children ?? (value ? value : <span className="font-normal italic text-fg-subtle">Not provided</span>)}
      </dd>
    </div>
  );
}

export function IntakeDemo({ live }: { live: boolean }) {
  const [sample, setSample] = useState<SampleEmail>(sampleEmails[0]);
  const [subject, setSubject] = useState(sampleEmails[0].subject);
  const [body, setBody] = useState(sampleEmails[0].body);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [approved, setApproved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const clearResults = () => {
    requestId.current += 1; // ignore any in-flight response
    setPhase("idle");
    setError("");
    setAnalysis(null);
    setEditing(false);
    setApproved(false);
  };

  const loadSample = (s: SampleEmail) => {
    clearResults();
    setSample(s);
    setSubject(s.subject);
    setBody(s.body);
    setAnnouncement(`Loaded example: ${s.label}.`);
  };

  const reset = () => {
    loadSample(sampleEmails[0]);
    setAnnouncement("Demo reset to the original example.");
  };

  const onEmailEdit = (update: () => void) => {
    update();
    // Results describe the email as it was processed; drop them once it changes.
    if (phase !== "idle" && phase !== "processing") clearResults();
  };

  const showResults = (a: IntakeAnalysis) => {
    setAnalysis(a);
    setReplySubject(a.replySubject);
    setReplyBody(a.replyBody);
    setPhase("done");
    setAnnouncement("Analysis complete. Customer information and a suggested response are ready for review.");
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const process = async () => {
    const id = ++requestId.current;
    setPhase("processing");
    setError("");
    setAnalysis(null);
    setApproved(false);
    setEditing(false);
    setAnnouncement("Analyzing customer inquiry…");

    if (!live) {
      await new Promise((r) => setTimeout(r, SIMULATED_DELAY_MS));
      if (id === requestId.current) showResults(simulatedAnalysis);
      return;
    }

    const trimmed = body.trim();
    if (trimmed.length < intakeLimits.bodyMin) {
      setPhase("error");
      setError("Please write a little more in the email body so there's something to analyze.");
      return;
    }

    try {
      const result = await processIntakeEmail({ fromName: sample.fromName, fromEmail: sample.fromEmail, subject, body });
      if (id !== requestId.current) return;
      if (result.ok) showResults(result.analysis);
      else {
        setPhase("error");
        setError(result.message);
        setAnnouncement(result.message);
      }
    } catch {
      if (id !== requestId.current) return;
      const message = "We couldn't reach the server. Please check your connection and try again.";
      setPhase("error");
      setError(message);
      setAnnouncement(message);
    }
  };

  const approve = () => {
    setEditing(false);
    setApproved(true);
    setAnnouncement(intakeDemoCopy.approved);
  };

  const toggleEditing = () => {
    if (!editing) setApproved(false); // an edited reply needs approving again
    setEditing(!editing);
  };

  const copyReply = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${replySubject}\n\n${replyBody}`);
      setCopied(true);
      setAnnouncement("Response copied to clipboard.");
    } catch {
      setAnnouncement("Copying isn't available in this browser.");
    }
  };

  const done = phase === "done";
  const steps: { label: string; state: StepState }[] = [
    { label: "Email Received", state: "done" },
    { label: "Information Extracted", state: done ? "done" : phase === "processing" ? "active" : "pending" },
    { label: "Request Classified", state: done ? "done" : "pending" },
    { label: "Response Drafted", state: done ? "done" : "pending" },
    { label: approved ? "Response Approved" : "Awaiting Approval", state: approved ? "done" : done ? "waiting" : "pending" },
  ];

  const editable = live && phase !== "processing";
  const initials = sample.fromName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const replyInvalid = !replySubject.trim() || !replyBody.trim();

  return (
    <div className="space-y-6">
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {/* Mode + workflow */}
      <div className="rounded-2xl border border-line bg-ink-800/70 p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/40 bg-ok/10 px-2.5 py-0.5 font-mono font-semibold uppercase tracking-wider text-ok">
              <span className="size-1.5 animate-pulse-dot rounded-full bg-ok" />
              Live AI
            </span>
          ) : (
            <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 font-mono font-semibold uppercase tracking-wider text-warn">
              Simulated
            </span>
          )}
          <span className="text-fg-muted">
            {live
              ? "Emails are analyzed by a real AI model each time you click Process. Edit the email to see the results change."
              : "Live AI is turned off on this site, so the example shows prerecorded results. The email can't be edited in this mode."}
          </span>
        </div>
        <Workflow steps={steps} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* LEFT: incoming email */}
        <Card
          title="Customer Email"
          icon="inbox"
          aside={<span className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Inbox · 1 new</span>}
        >
          {live ? (
            <div className="border-b border-line px-5 py-3">
              <p id="sample-label" className="mb-2 text-xs font-medium text-fg-subtle">
                Try another fictional example:
              </p>
              <div role="group" aria-labelledby="sample-label" className="flex flex-wrap gap-2">
                {sampleEmails.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => loadSample(s)}
                    disabled={phase === "processing"}
                    aria-pressed={s.id === sample.id}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      s.id === sample.id ? "border-accent-400 bg-accent-600/20 text-accent-300" : "border-line-strong text-fg-muted hover:border-accent-400/60 hover:text-fg"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-ink-700 text-sm font-semibold text-accent-300">
                  {initials}
                </span>
                <dl className="min-w-0 text-sm">
                  <dt className="sr-only">From</dt>
                  <dd className="truncate font-semibold text-fg">{sample.fromName}</dd>
                  <dt className="sr-only">Email</dt>
                  <dd className="truncate text-fg-muted">{sample.fromEmail}</dd>
                </dl>
              </div>
              <p className="shrink-0 font-mono text-[11px] text-fg-subtle">{sample.receivedAt}</p>
            </div>

            <div>
              <label htmlFor="email-subject" className="mb-1.5 block text-xs font-medium text-fg-subtle">
                Subject
              </label>
              <input
                id="email-subject"
                value={subject}
                maxLength={intakeLimits.subject}
                readOnly={!live}
                disabled={live && !editable}
                onChange={(e) => onEmailEdit(() => setSubject(e.target.value))}
                className={`${inputClasses} font-semibold ${live ? "" : "border-transparent bg-ink-900 focus:border-transparent"}`}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <label htmlFor="email-body" className="block text-xs font-medium text-fg-subtle">
                  Message
                </label>
                {live ? (
                  <span className="font-mono text-[11px] text-fg-subtle">
                    {body.length}/{intakeLimits.body}
                  </span>
                ) : null}
              </div>
              <textarea
                id="email-body"
                value={body}
                rows={13}
                maxLength={intakeLimits.body}
                readOnly={!live}
                disabled={live && !editable}
                onChange={(e) => onEmailEdit(() => setBody(e.target.value))}
                className={`${inputClasses} resize-y leading-relaxed ${live ? "" : "border-transparent bg-ink-900 focus:border-transparent"}`}
              />
            </div>

            <button
              type="button"
              onClick={process}
              disabled={phase === "processing"}
              className={buttonClasses({ size: "lg", className: "w-full" })}
            >
              {phase === "processing" ? (
                <>
                  <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing customer inquiry…
                </>
              ) : (
                <>
                  <span aria-hidden>✨</span> {done ? "Process Again" : "Process Email with AI"}
                </>
              )}
            </button>
          </div>
        </Card>

        {/* RIGHT: results */}
        <div ref={resultsRef} className="space-y-6 scroll-mt-24">
          {phase === "idle" ? (
            <div className="grid min-h-[22rem] place-items-center rounded-2xl border border-dashed border-line-strong bg-ink-800/40 p-8 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-xl bg-ink-700 text-cyan-400">
                  <Icon name="sparkle" className="size-6" />
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-fg">AI Processing Results</h2>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  Click <strong className="text-fg">Process Email with AI</strong> to extract the customer&apos;s details and draft a reply for your team to review.
                </p>
              </div>
            </div>
          ) : null}

          {phase === "processing" ? (
            <div aria-busy="true" className="space-y-6">
              <div className="rounded-2xl border border-line bg-ink-800 p-6">
                <p className="flex items-center gap-3 text-sm font-semibold text-fg">
                  <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                  Analyzing customer inquiry…
                </p>
                <div aria-hidden className="mt-5 space-y-3">
                  {[70, 55, 80, 45, 65, 50].map((w, i) => (
                    <div key={i} className="h-3 animate-pulse rounded bg-ink-700" style={{ width: `${w}%`, animationDelay: `${i * 120}ms` }} />
                  ))}
                </div>
              </div>
              <div aria-hidden className="h-48 animate-pulse rounded-2xl border border-line bg-ink-800" />
            </div>
          ) : null}

          {phase === "error" ? (
            <div role="alert" className="flex gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-5 text-sm leading-relaxed text-fg">
              <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-danger" />
              <div>
                <p className="font-semibold">Processing didn&apos;t complete</p>
                <p className="mt-1 text-fg-muted">{error} No results were generated.</p>
              </div>
            </div>
          ) : null}

          {done && analysis ? (
            <>
              <Card
                title="Customer Information Extracted"
                icon="user"
                className="demo-in"
                aside={
                  <span className="rounded-full border border-line-strong px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider text-fg-muted">
                    {live ? "AI generated" : "Simulated result"}
                  </span>
                }
              >
                <div className="p-5">
                  <div className="flex gap-3 rounded-xl border border-accent-500/30 bg-accent-600/10 p-4 text-sm leading-relaxed text-fg">
                    <Icon name="sparkle" className="mt-0.5 size-4 shrink-0 text-cyan-400" />
                    <p>
                      <span className="sr-only">AI summary: </span>
                      {analysis.summary}
                    </p>
                  </div>
                  {!analysis.isServiceRequest ? (
                    <p className="mt-4 flex gap-2 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-fg">
                      <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-warn" />
                      This message wasn&apos;t classified as a service request.
                    </p>
                  ) : null}
                  <dl className="mt-3 divide-y divide-line">
                    <FieldRow icon="user" label="Customer Name" value={analysis.customerName} />
                    <FieldRow icon="mail" label="Email" value={analysis.email} />
                    <FieldRow icon="phone" label="Phone" value={analysis.phone} />
                    <FieldRow icon="pin" label="Location" value={analysis.location} />
                    <FieldRow icon="wrench" label="Service Type" value={analysis.serviceType} />
                    <FieldRow icon="alert" label="Problem" value={analysis.problem} />
                    <FieldRow icon="calendar" label="Preferred Appointment">
                      {analysis.preferredAppointment ? (
                        <>
                          {analysis.preferredAppointment}
                          <span className="ml-2 text-xs font-normal text-fg-subtle">(requested — not booked)</span>
                        </>
                      ) : undefined}
                    </FieldRow>
                    <FieldRow icon="bolt" label="Priority">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[analysis.priority]}`}>
                        {analysis.priority === "Emergency" || analysis.priority === "High" ? <Icon name="alert" className="size-3" /> : null}
                        {analysis.priority}
                      </span>
                    </FieldRow>
                    <FieldRow icon="clock" label="Status">
                      {approved ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-ok/40 bg-ok/10 px-2.5 py-0.5 text-xs font-semibold text-ok">
                          <Icon name="check" className="size-3" />
                          Response approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-400/40 bg-accent-600/15 px-2.5 py-0.5 text-xs font-semibold text-accent-300">
                          <Icon name="eye" className="size-3" />
                          Awaiting employee review
                        </span>
                      )}
                    </FieldRow>
                  </dl>
                </div>
              </Card>

              <Card
                title="Suggested Email Response"
                icon="mail"
                className="demo-in [animation-delay:150ms]"
                aside={
                  <button
                    type="button"
                    onClick={copyReply}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-2.5 py-1 text-xs font-semibold text-fg-muted transition-colors hover:border-accent-400/60 hover:text-fg"
                  >
                    <Icon name={copied ? "check" : "copy"} className="size-3.5" />
                    {copied ? "Copied" : "Copy"}
                  </button>
                }
              >
                <div className="divide-y divide-line text-sm">
                  <div className="flex gap-3 px-5 py-2.5">
                    <span className="w-14 shrink-0 text-fg-subtle">To</span>
                    <span className="truncate text-fg">
                      {analysis.customerName ?? sample.fromName} &lt;{analysis.email ?? sample.fromEmail}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-3 px-5 py-2.5">
                    <label htmlFor="reply-subject" className="w-14 shrink-0 text-fg-subtle">
                      Subject
                    </label>
                    {editing ? (
                      <input id="reply-subject" value={replySubject} maxLength={200} onChange={(e) => setReplySubject(e.target.value)} className={inputClasses} />
                    ) : (
                      <output id="reply-subject" className="font-semibold text-fg">
                        {replySubject}
                      </output>
                    )}
                  </div>
                  <div className="px-5 py-4">
                    {editing ? (
                      <>
                        <label htmlFor="reply-body" className="sr-only">
                          Response body
                        </label>
                        <textarea
                          id="reply-body"
                          value={replyBody}
                          rows={14}
                          maxLength={3000}
                          onChange={(e) => setReplyBody(e.target.value)}
                          className={`${inputClasses} resize-y leading-relaxed`}
                        />
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed text-fg">{replyBody}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-line bg-ink-900/50 p-5">
                  {approved ? (
                    <p className="demo-in mb-4 flex gap-3 rounded-xl border border-ok/40 bg-ok/10 p-4 text-sm leading-relaxed text-fg">
                      <Icon name="check" className="mt-0.5 size-5 shrink-0 text-ok" />
                      {intakeDemoCopy.approved}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={toggleEditing}
                      disabled={editing && replyInvalid}
                      aria-pressed={editing}
                      className={buttonClasses({ variant: "secondary", className: "flex-1 sm:flex-none" })}
                    >
                      <Icon name={editing ? "check" : "pencil"} className="size-4" />
                      {editing ? "Done Editing" : "Edit Response"}
                    </button>
                    <button
                      type="button"
                      onClick={approve}
                      disabled={approved || replyInvalid}
                      className={buttonClasses({ className: "flex-1 sm:flex-none" })}
                    >
                      <Icon name="check" className="size-4" />
                      {approved ? "Approved" : "Approve Response"}
                    </button>
                    <button type="button" onClick={reset} className={buttonClasses({ variant: "secondary", className: "flex-1 sm:flex-none" })}>
                      <Icon name="refresh" className="size-4" />
                      Reset Demo
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-fg-subtle">Nothing is sent. In this demo, approval only updates the status.</p>
                </div>
              </Card>
            </>
          ) : null}

          {phase === "error" || phase === "processing" ? (
            <button type="button" onClick={reset} className={buttonClasses({ variant: "ghost" })}>
              <Icon name="refresh" className="size-4" />
              Reset Demo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
