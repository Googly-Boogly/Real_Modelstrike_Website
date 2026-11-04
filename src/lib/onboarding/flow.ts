// Questionnaire state machine: welcome → steps 1–4 → review → submit.
// Pure, so navigation, validation gating and duplicate-submit prevention are unit-tested.

import { emptyAnswers, normalize, stepFields, stepOf, validateAll, validateStep, type Answers, type Field, type FieldErrors } from "./schema.ts";

export const STEP_COUNT = stepFields.length;

export type View = { kind: "welcome" } | { kind: "step"; index: number } | { kind: "review" };

export type FlowState = {
  view: View;
  answers: Answers;
  errors: FieldErrors;
  /** Set when a step was opened with "Edit" from the review screen; Next then returns there. */
  returnToReview: boolean;
  submit: { status: "idle" | "submitting" | "error"; message?: string };
  /** Bumped on every failed Next/submit so the UI can move focus even when the errors are identical. */
  attempt: number;
};

export type FlowAction =
  | { type: "start" }
  | { type: "set"; field: Field; value: string | string[] }
  | { type: "next" }
  | { type: "back" }
  | { type: "edit"; step: number }
  | { type: "submitStart" }
  | { type: "submitFailed"; message: string; fieldErrors?: FieldErrors };

export function initialFlow(prefill: Partial<Answers> = {}): FlowState {
  return { view: { kind: "welcome" }, answers: { ...emptyAnswers(), ...prefill }, errors: {}, returnToReview: false, submit: { status: "idle" }, attempt: 0 };
}

const withoutKeys = (errors: FieldErrors, keys: readonly Field[]) => {
  const next = { ...errors };
  for (const k of keys) delete next[k];
  return next;
};

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  // While a submission is in flight, the questionnaire is frozen: no edits, no navigation, no second submit.
  if (state.submit.status === "submitting" && action.type !== "submitFailed") return state;

  switch (action.type) {
    case "start":
      return state.view.kind === "welcome" ? { ...state, view: { kind: "step", index: 0 } } : state;

    case "set": {
      const answers = { ...state.answers, [action.field]: action.value };
      // Clear the error on the edited field (and its "Other" companion when the parent changes).
      return { ...state, answers, errors: withoutKeys(state.errors, [action.field, `${action.field}Other` as Field]) };
    }

    case "next": {
      if (state.view.kind !== "step") return state;
      const index = state.view.index;
      const { answers } = normalize(state.answers);
      const errors = validateStep(index, answers);
      if (Object.keys(errors).length > 0) {
        // Keep what the customer typed (not the normalised copy) so nothing visibly changes under them.
        return { ...state, errors: { ...withoutKeys(state.errors, stepFields[index]), ...errors }, attempt: state.attempt + 1 };
      }
      const cleared = withoutKeys(state.errors, stepFields[index]);
      if (state.returnToReview || index === STEP_COUNT - 1) return { ...state, answers, errors: cleared, view: { kind: "review" }, returnToReview: false };
      return { ...state, answers, errors: cleared, view: { kind: "step", index: index + 1 } };
    }

    case "back": {
      if (state.view.kind === "review") return { ...state, view: { kind: "step", index: STEP_COUNT - 1 }, returnToReview: false };
      if (state.view.kind === "step" && state.view.index > 0) return { ...state, view: { kind: "step", index: state.view.index - 1 } };
      if (state.view.kind === "step") return { ...state, view: { kind: "welcome" } };
      return state;
    }

    case "edit":
      if (state.view.kind !== "review" || action.step < 0 || action.step >= STEP_COUNT) return state;
      return { ...state, view: { kind: "step", index: action.step }, returnToReview: true, submit: { status: "idle" } };

    case "submitStart": {
      if (state.view.kind !== "review") return state;
      const { answers } = normalize(state.answers);
      const errors = validateAll(answers);
      const first = firstErrorStep(errors);
      if (first !== null) return { ...state, errors, view: { kind: "step", index: first }, returnToReview: true, attempt: state.attempt + 1 };
      return { ...state, answers, submit: { status: "submitting" } };
    }

    case "submitFailed": {
      const fieldErrors = action.fieldErrors ?? {};
      const first = firstErrorStep(fieldErrors);
      const submit = { status: "error" as const, message: action.message };
      if (first !== null) return { ...state, errors: fieldErrors, submit, view: { kind: "step", index: first }, returnToReview: true, attempt: state.attempt + 1 };
      return { ...state, submit, attempt: state.attempt + 1 };
    }
  }
}

export function firstErrorStep(errors: FieldErrors): number | null {
  const steps = (Object.keys(errors) as Field[]).map(stepOf).filter((i) => i >= 0);
  return steps.length > 0 ? Math.min(...steps) : null;
}

/** True once the customer has typed or chosen anything beyond the prefilled values. */
export function isDirty(state: FlowState, prefill: Partial<Answers>): boolean {
  const base = { ...emptyAnswers(), ...prefill };
  return (Object.keys(base) as Field[]).some((k) => JSON.stringify(base[k]) !== JSON.stringify(state.answers[k]));
}
