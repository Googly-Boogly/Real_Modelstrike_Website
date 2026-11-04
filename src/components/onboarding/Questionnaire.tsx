"use client";

import { useEffect, useReducer, useRef, type ReactNode } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { onboardingCopy } from "@/content/onboarding";
import type { ProjectContext } from "@/lib/onboarding/backend";
import { flowReducer, initialFlow, isDirty, STEP_COUNT, type FlowState } from "@/lib/onboarding/flow";
import {
  actionOptions,
  challengeOptions,
  dataSourceOptions,
  industryOptions,
  labels,
  limits,
  normalize,
  softwareOptions,
  stepFields,
  validateAll,
  volumeOptions,
  type Answers,
  type Field,
} from "@/lib/onboarding/schema";
import { onboardingApi } from "./api";
import { CheckboxGroup, ReadOnlyField, SelectField, TextArea, TextField } from "./fields";
import { Welcome } from "./Welcome";

const { steps, review: reviewCopy } = onboardingCopy;

type Props = {
  project: ProjectContext;
  onSubmitted: (submittedAt: string, alreadySubmitted: boolean) => void;
  onSessionLost: () => void;
};

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "00000000-0000-4000-8000-000000000000".replace(/0/g, () => Math.floor(Math.random() * 16).toString(16));
}

function submitErrorMessage(code: string, retryAfterSeconds?: number) {
  switch (code) {
    case "network":
      return "We couldn't reach ModelStrike. Check your internet connection and try again — your answers are still here.";
    case "backend_unavailable":
    case "not_configured":
      return "Our onboarding system is temporarily unavailable. Your answers are still here — please try again in a few minutes.";
    case "rate_limited": {
      const minutes = Math.max(1, Math.ceil((retryAfterSeconds ?? 60) / 60));
      return `Too many attempts. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`;
    }
    case "invalid":
      return "Some answers couldn't be accepted. Please check the highlighted fields.";
    default:
      return "We couldn't submit your questionnaire. Please try again. If this keeps happening, email us and we'll help.";
  }
}

export function Questionnaire({ project, onSubmitted, onSessionLost }: Props) {
  const prefill: Partial<Answers> = { contactName: project.contact.name, jobTitle: project.contact.title ?? "", contactEmail: project.contact.email ?? "" };
  const [state, dispatch] = useReducer(flowReducer, prefill, initialFlow);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  // One key per questionnaire: a retry after a lost response replays the same submission instead of creating a second one.
  const idempotencyKey = useRef<string>("");
  const firstRender = useRef(true);
  const done = useRef(false);

  const viewKey = state.view.kind === "step" ? `step-${state.view.index}` : state.view.kind;

  // Move focus to the new screen's heading so keyboard and screen-reader users start at the top.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [viewKey]);

  // After a failed Next/Submit, focus the first invalid field (or the error message when no field is at fault).
  useEffect(() => {
    if (state.attempt === 0) return;
    const fields = state.view.kind === "step" ? stepFields[state.view.index] : [];
    const first = fields.find((f) => state.errors[f]);
    const target = first ? document.getElementById(first) : statusRef.current;
    target?.focus();
    // Focus only on attempts, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.attempt]);

  // Warn before leaving with unsent answers. Nothing is stored in the browser, so leaving loses them.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (done.current || state.view.kind === "welcome" || !isDirty(state, prefill)) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  });

  async function submit() {
    if (inFlight.current) return;
    const { answers } = normalize(state.answers);
    if (Object.keys(validateAll(answers)).length > 0) {
      dispatch({ type: "submitStart" }); // the reducer routes back to the first step with errors
      return;
    }
    inFlight.current = true;
    idempotencyKey.current ||= newKey();
    dispatch({ type: "submitStart" });
    const r = await onboardingApi.submit(answers, idempotencyKey.current);
    inFlight.current = false;
    if (r.ok) {
      done.current = true;
      onSubmitted(r.submittedAt, false);
      return;
    }
    if (r.code === "already_submitted") {
      done.current = true;
      onSubmitted(r.submittedAt ?? "", true);
      return;
    }
    if (r.code === "session_expired" || r.code === "no_session" || r.code === "revoked_link" || r.code === "expired_link" || r.code === "verification_required") {
      done.current = true; // nothing more can be sent from this page
      onSessionLost();
      return;
    }
    dispatch({ type: "submitFailed", message: submitErrorMessage(r.code, r.retryAfterSeconds), fieldErrors: r.fieldErrors });
  }

  if (state.view.kind === "welcome") return <Welcome project={project} onStart={() => dispatch({ type: "start" })} />;

  const set = (field: Field) => (value: string | string[]) => dispatch({ type: "set", field, value });
  const submitting = state.submit.status === "submitting";
  const stepIndex = state.view.kind === "step" ? state.view.index : STEP_COUNT;

  return (
    <div className="demo-in" key={viewKey}>
      <Progress current={stepIndex} />

      <div className="mt-8 rounded-2xl border border-line bg-ink-800/50 p-5 sm:p-8">
        {state.view.kind === "step" ? (
          <form
            noValidate
            aria-labelledby="step-title"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: "next" });
            }}
          >
            <StepHeader headingRef={headingRef} index={state.view.index} />
            {state.submit.status === "error" ? <StatusMessage refEl={statusRef} message={state.submit.message ?? ""} /> : null}
            <ErrorSummary state={state} />
            <div className="mt-8 space-y-7">
              <StepFields index={state.view.index} state={state} set={set} project={project} />
            </div>
            <Nav
              onBack={() => dispatch({ type: "back" })}
              backLabel={state.view.index === 0 ? "Back to Welcome" : "Previous"}
              nextLabel={state.returnToReview ? "Save and Return to Review" : state.view.index === STEP_COUNT - 1 ? "Review Answers" : "Next"}
            />
          </form>
        ) : (
          <div aria-labelledby="step-title" role="region">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-cyan-400">Final review</p>
            <h2 id="step-title" ref={headingRef} tabIndex={-1} className="mt-2 font-display text-2xl font-bold text-fg outline-none sm:text-3xl">
              {reviewCopy.title}
            </h2>
            <p className="mt-2 text-fg-muted">{reviewCopy.description}</p>
            {state.submit.status === "error" ? <StatusMessage refEl={statusRef} message={state.submit.message ?? ""} /> : null}
            <Review answers={state.answers} project={project} onEdit={(step) => dispatch({ type: "edit", step })} disabled={submitting} />
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => dispatch({ type: "back" })} disabled={submitting} className={buttonClasses({ variant: "secondary", size: "lg" })}>
                Previous
              </button>
              <button type="button" onClick={submit} disabled={submitting} aria-disabled={submitting} className={buttonClasses({ size: "lg" })}>
                {submitting ? (
                  <>
                    <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting…
                  </>
                ) : (
                  <>
                    {reviewCopy.submit}
                    <Icon name="arrowRight" className="size-4" />
                  </>
                )}
              </button>
            </div>
            <p className="sr-only" role="status" aria-live="polite">
              {submitting ? "Submitting your questionnaire…" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------------------------- pieces

function Progress({ current }: { current: number }) {
  const pct = Math.round((Math.min(current, STEP_COUNT) / STEP_COUNT) * 100);
  const label = current < STEP_COUNT ? `Step ${current + 1} of ${STEP_COUNT}: ${steps[current].short}` : "Review your answers";
  return (
    <nav aria-label="Questionnaire progress">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-cyan-400" aria-live="polite">
          {label}
        </p>
        <p className="font-mono text-xs text-fg-subtle" aria-hidden>
          {pct}%
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-700" aria-hidden>
        <div className="h-full rounded-full bg-gradient-to-r from-accent-500 to-cyan-400 transition-[width] duration-500" style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
      <ol className="mt-4 hidden grid-cols-5 gap-2 sm:grid">
        {[...steps.map((s) => s.short), "Review"].map((name, i) => {
          const state = i < current ? "done" : i === current ? "current" : "todo";
          return (
            <li key={name} aria-current={state === "current" ? "step" : undefined} className={`flex items-center gap-2 text-xs ${state === "todo" ? "text-fg-subtle" : "text-fg"}`}>
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full font-mono text-[0.7rem] ring-1 ring-inset ${
                  state === "done" ? "bg-ok/15 text-ok ring-ok/40" : state === "current" ? "bg-accent-600/20 text-accent-300 ring-accent-400/60" : "text-fg-subtle ring-line-strong"
                }`}
              >
                {state === "done" ? <Icon name="check" className="size-3.5" /> : i + 1}
              </span>
              <span className="truncate">
                {name}
                {state === "done" ? <span className="sr-only"> (completed)</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepHeader({ index, headingRef }: { index: number; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const s = steps[index];
  return (
    <header>
      <p className="font-mono text-xs font-medium uppercase tracking-[0.16em] text-fg-subtle">
        Step {index + 1} of {STEP_COUNT}
      </p>
      <h2 id="step-title" ref={headingRef} tabIndex={-1} className="mt-2 font-display text-2xl font-bold text-fg outline-none sm:text-3xl">
        {s.title}
      </h2>
      <p className="mt-2 leading-relaxed text-fg-muted">{s.description}</p>
      <p className="mt-3 text-xs text-fg-subtle">
        <span aria-hidden className="text-accent-400">*</span> Required
      </p>
    </header>
  );
}

function StatusMessage({ message, refEl }: { message: string; refEl: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={refEl} tabIndex={-1} role="alert" className="mt-6 flex gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-fg outline-none">
      <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-danger" />
      <p>{message}</p>
    </div>
  );
}

function ErrorSummary({ state }: { state: FlowState }) {
  if (state.view.kind !== "step" || state.submit.status === "error") return null;
  const count = stepFields[state.view.index].filter((f) => state.errors[f]).length;
  if (count === 0) return null;
  return (
    <p role="alert" className="mt-6 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-fg">
      <Icon name="alert" className="size-4 shrink-0 text-danger" />
      {count === 1 ? "One answer needs attention before you continue." : `${count} answers need attention before you continue.`}
    </p>
  );
}

function Nav({ onBack, backLabel, nextLabel }: { onBack: () => void; backLabel: string; nextLabel: string }) {
  return (
    <div className="mt-10 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" onClick={onBack} className={buttonClasses({ variant: "secondary", size: "lg" })}>
        {backLabel}
      </button>
      <button type="submit" className={buttonClasses({ size: "lg" })}>
        {nextLabel}
        <Icon name="arrowRight" className="size-4" />
      </button>
    </div>
  );
}

function Callout({ icon = "shield", children }: { icon?: "shield" | "eye" | "alert"; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-ink-900/60 p-4 text-sm leading-relaxed text-fg-muted">
      <Icon name={icon} className="mt-0.5 size-5 shrink-0 text-cyan-400" />
      <div>{children}</div>
    </div>
  );
}

type SetFn = (field: Field) => (value: string | string[]) => void;

function StepFields({ index, state, set, project }: { index: number; state: FlowState; set: SetFn; project: ProjectContext }) {
  const a = state.answers;
  const e = state.errors;
  const verifiedEmail = project.contact.email?.toLowerCase() ?? "";
  const emailChanged = Boolean(verifiedEmail) && a.contactEmail.trim().toLowerCase() !== verifiedEmail && a.contactEmail.trim() !== "";

  switch (index) {
    case 0:
      return (
        <>
          <ReadOnlyField id="businessName" label="What is your business name?" value={project.company} hint="From your project record. If this isn't right, let us know in the notes at the end." />
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-fg">What is your name and role within the company?</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField id="contactName" label="Full name" required value={a.contactName} onChange={set("contactName")} error={e.contactName} maxLength={limits.name} autoComplete="name" />
              <TextField id="jobTitle" label="Job title" required value={a.jobTitle} onChange={set("jobTitle")} error={e.jobTitle} maxLength={limits.title} autoComplete="organization-title" placeholder="e.g. Operations Manager" />
            </div>
          </fieldset>
          <TextField
            id="contactEmail"
            type="email"
            label="What is your preferred contact email?"
            required
            value={a.contactEmail}
            onChange={set("contactEmail")}
            error={e.contactEmail}
            maxLength={limits.email}
            autoComplete="email"
            hint={
              emailChanged
                ? "This is different from the email on your project. We'll confirm the change with you before using it, and it won't change who is authorized on your project."
                : "We'll use this address for project updates."
            }
          />
          <SelectField id="industry" label="What industry does your business operate in?" required value={a.industry} onChange={set("industry")} error={e.industry} options={industryOptions} placeholder="Select an industry" />
          {a.industry === "other" ? (
            <TextField id="industryOther" label="Please describe your industry" required value={a.industryOther} onChange={set("industryOther")} error={e.industryOther} maxLength={limits.shortText} />
          ) : null}
        </>
      );

    case 1:
      return (
        <>
          <TextArea
            id="processToAutomate"
            label="What business process would you like us to automate?"
            required
            rows={5}
            value={a.processToAutomate}
            onChange={set("processToAutomate")}
            error={e.processToAutomate}
            maxLength={limits.longText}
            placeholder="We receive customer service requests through our website. Our employees manually enter the information into our CRM and email customers to confirm their requests."
          />
          <TextArea
            id="currentProcess"
            label="Can you describe how this process currently works?"
            required
            rows={6}
            value={a.currentProcess}
            onChange={set("currentProcess")}
            error={e.currentProcess}
            maxLength={limits.longText}
            hint="Walk us through the process from beginning to end. Include the people, tools, and manual steps involved."
          />
          <CheckboxGroup id="challenges" label="What are the biggest challenges with your current process?" hint="Select all that apply." required options={challengeOptions} value={a.challenges} onChange={set("challenges")} error={e.challenges} />
          {a.challenges.includes("other") ? (
            <TextField id="challengesOther" label="Please describe the other challenge" required value={a.challengesOther} onChange={set("challengesOther")} error={e.challengesOther} maxLength={limits.shortText} />
          ) : null}
        </>
      );

    case 2:
      return (
        <>
          <CheckboxGroup id="software" label="Which software does your business currently use?" hint="Select all that apply. Please don't share account passwords or login details — we'll arrange access securely later." required options={softwareOptions} value={a.software} onChange={set("software")} error={e.software} columns={3} />
          <TextField
            id="softwareOther"
            label={a.software.includes("other") ? "Other software you use" : "Any software not listed?"}
            required={a.software.includes("other")}
            value={a.softwareOther}
            onChange={set("softwareOther")}
            error={e.softwareOther}
            maxLength={limits.shortText}
            placeholder="e.g. FieldEdge, Buildium, a custom job tracker"
          />
          <CheckboxGroup id="dataSources" label="Where does the information you want to automate come from?" hint="Select all that apply." required options={dataSourceOptions} value={a.dataSources} onChange={set("dataSources")} error={e.dataSources} />
          {a.dataSources.includes("other") ? (
            <TextField id="dataSourcesOther" label="Please describe the other source" required value={a.dataSourcesOther} onChange={set("dataSourcesOther")} error={e.dataSourcesOther} maxLength={limits.shortText} />
          ) : null}
          <SelectField id="dailyVolume" label="Approximately how many requests or tasks does your business process daily?" required value={a.dailyVolume} onChange={set("dailyVolume")} error={e.dailyVolume} options={volumeOptions} placeholder="Select a range" />
          <CheckboxGroup id="actions" label="What should happen after the automation processes a request?" hint="Select all that apply." required options={actionOptions} value={a.actions} onChange={set("actions")} error={e.actions} />
          {a.actions.includes("other") ? (
            <TextField id="actionsOther" label="What else should happen?" required value={a.actionsOther} onChange={set("actionsOther")} error={e.actionsOther} maxLength={limits.shortText} />
          ) : null}
          <TextArea id="actionsNotes" label="Anything else about what should happen?" rows={3} value={a.actionsNotes} onChange={set("actionsNotes")} error={e.actionsNotes} maxLength={limits.longText} />

          <fieldset className="rounded-xl border border-line bg-ink-900/40 p-4 sm:p-5">
            <legend className="px-1 text-sm font-semibold text-fg">Who should review and approve AI-generated actions or customer communications?</legend>
            <div className="mt-3 space-y-5">
              <Callout>
                Your answers here help us plan. They don&apos;t authorize the automation to take any action on its own. What runs automatically and what waits for a person&apos;s approval is agreed with you
                before anything goes live.
              </Callout>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField id="approverRole" label="Reviewer's role" required value={a.approverRole} onChange={set("approverRole")} error={e.approverRole} maxLength={limits.role} placeholder="e.g. Office Manager" />
                <TextField id="approverEmail" type="email" label="Reviewer's work email" required value={a.approverEmail} onChange={set("approverEmail")} error={e.approverEmail} maxLength={limits.email} autoComplete="off" />
              </div>
              <button
                type="button"
                className={buttonClasses({ variant: "ghost" })}
                onClick={() => {
                  set("approverRole")(a.jobTitle);
                  set("approverEmail")(a.contactEmail);
                }}
              >
                <Icon name="user" className="size-4" />
                I&apos;ll be the reviewer
              </button>
            </div>
          </fieldset>
        </>
      );

    default:
      return (
        <>
          <TextArea
            id="successCriteria"
            label="What would make this automation successful for your business?"
            required
            rows={5}
            value={a.successCriteria}
            onChange={set("successCriteria")}
            error={e.successCriteria}
            maxLength={limits.longText}
            placeholder="We'd like to reduce the time employees spend processing customer requests by at least 50% while maintaining accurate records."
          />
          <TextArea id="additionalNotes" label="Is there anything else we should know before your project kickoff meeting?" rows={4} value={a.additionalNotes} onChange={set("additionalNotes")} error={e.additionalNotes} maxLength={limits.longText} />
          <Callout icon="alert">Please don&apos;t include passwords, API keys, payment information, or sensitive customer records in your answers.</Callout>
        </>
      );
  }
}

// --------------------------------------------------------------------------------------------- review

function Review({ answers: a, project, onEdit, disabled }: { answers: Answers; project: ProjectContext; onEdit: (step: number) => void; disabled: boolean }) {
  const list = (values: string[], label: (v: string) => string, other?: string) => {
    const items = values.map((v) => (v === "other" && other ? `Other: ${other}` : label(v)));
    return items.length ? (
      <ul className="list-disc space-y-0.5 pl-5">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    ) : null;
  };
  const sections: { step: number; rows: [string, ReactNode][] }[] = [
    {
      step: 0,
      rows: [
        ["Business name", project.company],
        ["Name", a.contactName],
        ["Job title", a.jobTitle],
        ["Contact email", a.contactEmail],
        ["Industry", a.industry === "other" ? `Other: ${a.industryOther}` : labels.industry(a.industry)],
      ],
    },
    {
      step: 1,
      rows: [
        ["Process to automate", a.processToAutomate],
        ["How it works today", a.currentProcess],
        ["Biggest challenges", list(a.challenges, labels.challenge, a.challengesOther)],
      ],
    },
    {
      step: 2,
      rows: [
        ["Software in use", list(a.software, labels.software, a.softwareOther)],
        ...(a.softwareOther && !a.software.includes("other") ? ([["Also uses", a.softwareOther]] as [string, ReactNode][]) : []),
        ["Information comes from", list(a.dataSources, labels.dataSource, a.dataSourcesOther)],
        ["Daily volume", labels.volume(a.dailyVolume)],
        ["After processing", list(a.actions, labels.action, a.actionsOther)],
        ...(a.actionsNotes ? ([["More about outcomes", a.actionsNotes]] as [string, ReactNode][]) : []),
        ["Reviewer", `${a.approverRole} · ${a.approverEmail}`],
      ],
    },
    {
      step: 3,
      rows: [
        ["What success looks like", a.successCriteria],
        ["Anything else", a.additionalNotes || <span className="text-fg-subtle">Nothing added</span>],
      ],
    },
  ];
  return (
    <div className="mt-8 space-y-5">
      {sections.map((s) => (
        <section key={s.step} aria-labelledby={`review-${s.step}`} className="rounded-xl border border-line bg-ink-900/50">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
            <h3 id={`review-${s.step}`} className="font-display text-base font-bold text-fg">
              <span className="mr-2 font-mono text-xs text-fg-subtle">{s.step + 1}</span>
              {steps[s.step].short}
            </h3>
            <button type="button" onClick={() => onEdit(s.step)} disabled={disabled} className={buttonClasses({ variant: "ghost" })} aria-label={`Edit ${steps[s.step].short}`}>
              <Icon name="pencil" className="size-4" />
              Edit
            </button>
          </div>
          <dl className="divide-y divide-line/70">
            {s.rows.map(([k, v]) => (
              <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4 sm:px-5">
                <dt className="text-sm text-fg-subtle">{k}</dt>
                <dd className="whitespace-pre-line break-words text-sm leading-relaxed text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
