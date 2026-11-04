import { useId, useState } from "react";
import { BookingLink, buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { currentDraft, MAX_REGENERATIONS, type InboxItem, type ItemResult, type Phase } from "@/lib/demo/workflow";
import type { IndustryConfig } from "@/lib/intake/industries";
import { draftLimits } from "@/lib/intake/schema";
import { Chip, inputClasses, Panel, Spinner } from "./ui";

const statusSteps = ["Request received", "AI processed", "Record drafted", "Employee review", "Decision"] as const;

function WorkflowStatus({ phase, result }: { phase: Phase; result: ItemResult | undefined }) {
  // How many steps are complete. Selecting a request counts as receiving it.
  const reached = !result
    ? phase === "idle"
      ? 0
      : 1
    : result.status === "approved" || result.status === "rejected"
      ? 5
      : result.draft && result.status !== "processing"
        ? 4
        : result.classification
          ? 3
          : result.extraction
            ? 2
            : 1;
  const decision = result?.status === "approved" ? "Approved" : result?.status === "rejected" ? "Rejected" : "Decision";
  return (
    <ol aria-label="Workflow status" className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs">
      {statusSteps.map((label, i) => {
        const done = i < reached;
        const current = i === reached && reached < 5;
        return (
          <li key={label} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden className={`h-px w-3 ${done ? "bg-ok/60" : "bg-line-strong"}`} /> : null}
            <span
              aria-current={current ? "step" : undefined}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 ${done ? "border-ok/40 bg-ok/10 text-fg" : current ? "border-accent-400/60 text-accent-300" : "border-line text-fg-subtle"}`}
            >
              {done ? <Icon name="check" className="size-3 text-ok" /> : null}
              {i === 4 ? decision : label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function ResponseApproval({
  item,
  industry,
  result,
  phase,
  live,
  busy,
  onEdit,
  onApprove,
  onReject,
  onReopen,
  onRegenerate,
}: {
  item: InboxItem | null;
  industry: IndustryConfig;
  result: ItemResult | undefined;
  phase: Phase;
  live: boolean;
  busy: boolean;
  onEdit: (subject: string, body: string) => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onReopen: () => void;
  onRegenerate: () => void;
}) {
  const id = useId();
  const text = currentDraft(result);
  const [editing, setEditing] = useState<{ subject: string; body: string } | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  const draft = result?.draft;
  const status = result?.status;
  const locked = !draft || status === "processing" || result?.regenerating;
  const decided = status === "approved" || status === "rejected";
  const editInvalid = editing ? !editing.subject.trim() || !editing.body.trim() : false;
  const regenLeft = MAX_REGENERATIONS - (result?.regenerations ?? 0);
  const canRegenerate = live && result?.mode === "live" && regenLeft > 0 && !busy;

  const title = !draft ? `AI-Generated ${industry.terms.response}` : result?.mode === "simulated" ? `${industry.terms.response} — Simulated Example` : draft.source === "ai" ? `AI-Generated ${industry.terms.response}` : `Template ${industry.terms.response}`;

  return (
    <Panel
      id="panel-approval"
      title={title}
      icon="mail"
      data-tour="approval"
      aside={
        status === "approved" ? (
          <Chip tone="ok">Approved (simulated)</Chip>
        ) : status === "rejected" ? (
          <Chip>Rejected (simulated)</Chip>
        ) : draft && status !== "processing" ? (
          <Chip tone="warn">Awaiting Employee Approval</Chip>
        ) : null
      }
    >
      {!draft || !text ? (
        <div className="p-4">
          <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm leading-relaxed text-fg-muted">
            {status === "processing" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner />
                The response draft appears here as soon as it&apos;s written.
              </span>
            ) : (
              "After processing, a suggested reply appears here. You can edit, approve, reject, or regenerate it. Nothing is ever sent."
            )}
          </p>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="min-w-0 border-b border-line lg:border-b-0 lg:border-r">
            <dl className="divide-y divide-line text-sm">
              <div className="flex gap-3 px-4 py-2.5">
                <dt className="w-16 shrink-0 text-fg-muted">To</dt>
                <dd className="min-w-0 break-words text-fg">{item?.email ?? <span className="italic text-fg-muted">No email on file — would need a phone call</span>}</dd>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5">
                <dt className="w-16 shrink-0 text-fg-muted">
                  <label htmlFor={`${id}-subject`}>Subject</label>
                </dt>
                <dd className="min-w-0 flex-1 break-words font-semibold text-fg">
                  {editing ? (
                    <input id={`${id}-subject`} value={editing.subject} maxLength={draftLimits.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} className={inputClasses} />
                  ) : (
                    <span id={`${id}-subject`}>{text.subject}</span>
                  )}
                </dd>
              </div>
            </dl>
            <div className={`border-t border-line px-4 py-4 ${result?.regenerating ? "opacity-50" : ""}`}>
              {editing ? (
                <>
                  <label htmlFor={`${id}-body`} className="sr-only">
                    Response body
                  </label>
                  <textarea id={`${id}-body`} value={editing.body} rows={11} maxLength={draftLimits.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className={`${inputClasses} resize-y leading-relaxed`} />
                  {editInvalid ? <p className="mt-2 text-sm text-danger">A subject and message are both needed.</p> : null}
                </>
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">{text.body}</p>
              )}
              {result?.edited && !editing ? <p className="mt-3 text-xs text-fg-muted">Edited by you.</p> : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4">
            {status === "approved" ? (
              <div role="status" className="demo-in rounded-xl border border-ok/40 bg-ok/10 p-3.5 text-sm leading-relaxed text-fg">
                <p className="flex items-center gap-2 font-semibold">
                  <Icon name="check" className="size-4 text-ok" />
                  Draft approved in simulation. No message was sent.
                </p>
                <p className="mt-1 text-fg-muted">In a real deployment, this is where an approved reply would go out through your own email or CRM.</p>
              </div>
            ) : status === "rejected" ? (
              <div role="status" className="demo-in rounded-xl border border-line-strong bg-ink-700/60 p-3.5 text-sm leading-relaxed text-fg">
                <p className="font-semibold">Draft rejected in simulation. No message was sent.</p>
                {result?.rejectionReason ? <p className="mt-1 text-fg-muted">Reason: {result.rejectionReason}</p> : null}
                <p className="mt-1 text-fg-muted">The request stays with your team to handle directly.</p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-fg-muted">AI prepared the draft. An employee decides what happens next.</p>
            )}

            {rejecting !== null ? (
              <div className="rounded-xl border border-line bg-ink-900/60 p-3">
                <label htmlFor={`${id}-reason`} className="mb-1 block text-xs font-medium text-fg-muted">
                  Reason for rejecting <span className="text-fg-subtle">(optional)</span>
                </label>
                <textarea id={`${id}-reason`} value={rejecting} maxLength={300} rows={3} onChange={(e) => setRejecting(e.target.value)} className={`${inputClasses} resize-y`} placeholder="e.g. Tone is too formal" />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onReject(rejecting);
                      setRejecting(null);
                    }}
                    className={buttonClasses({ className: "flex-1" })}
                  >
                    Confirm Rejection
                  </button>
                  <button type="button" onClick={() => setRejecting(null)} className={buttonClasses({ variant: "secondary" })}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : decided ? (
              <div className="flex flex-col gap-2">
                <button type="button" onClick={onReopen} className={buttonClasses({ variant: "secondary" })}>
                  <Icon name="refresh" className="size-4" />
                  Reopen for Review
                </button>
                {status === "approved" ? <BookingLink size="md" label="Book a Free Consultation" /> : null}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      disabled={editInvalid}
                      onClick={() => {
                        onEdit(editing.subject, editing.body);
                        setEditing(null);
                      }}
                      className={buttonClasses({ className: "px-2" })}
                    >
                      <Icon name="check" className="size-4" />
                      Save Edits
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className={buttonClasses({ variant: "secondary", className: "px-2" })}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={onApprove} disabled={locked} className={buttonClasses({ className: "px-2" })}>
                      <Icon name="check" className="size-4" />
                      Approve Draft
                    </button>
                    <button type="button" onClick={() => setEditing({ ...text })} disabled={locked} className={buttonClasses({ variant: "secondary", className: "px-2" })}>
                      <Icon name="pencil" className="size-4" />
                      Edit Response
                    </button>
                    <button type="button" onClick={() => setRejecting("")} disabled={locked} className={buttonClasses({ variant: "secondary", className: "px-2" })}>
                      <Icon name="close" className="size-4" />
                      Reject Draft
                    </button>
                    <button type="button" onClick={onRegenerate} disabled={locked || !canRegenerate} className={buttonClasses({ variant: "secondary", className: "px-2" })}>
                      {result?.regenerating ? <Spinner /> : <Icon name="refresh" className="size-4" />}
                      {result?.regenerating ? "Writing…" : "Regenerate"}
                    </button>
                  </>
                )}
              </div>
            )}

            {result?.regenError ? (
              <p role="alert" className="text-xs text-danger">
                {result.regenError}
              </p>
            ) : null}
            {!decided && !editing ? (
              <p className="text-xs leading-relaxed text-fg-subtle">
                {result?.mode === "live"
                  ? regenLeft > 0
                    ? `Regenerate asks the AI for another version (${regenLeft} left for this request).${result.edited ? " It replaces your edits." : ""}`
                    : "Regeneration limit reached for this request."
                  : "Regenerating needs live AI, so it's off for simulated examples."}
              </p>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-line bg-ink-900/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <WorkflowStatus phase={phase} result={result} />
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <Icon name="shield" className="size-3.5 shrink-0 text-ok" />
          Simulated actions only. No email is sent and nothing is written to a real system.
        </p>
      </div>
    </Panel>
  );
}
