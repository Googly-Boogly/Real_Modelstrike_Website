// The intake workflow, one configurable engine for every industry. The model
// gets no tools: each call is text in, schema-checked JSON out, so a visitor's
// message has no way to reach anything except these two calls.

import type { Budget } from "./budget.ts";
import { checkDraft, groundExtraction } from "./grounding.ts";
import { draftPrompt, extractionPrompt } from "./prompts.ts";
import { classify } from "./rules.ts";
import { draftJsonSchema, extractionJsonSchema, validateDraft, validateExtraction, type Draft, type ErrorCode, type Extraction, type IntakeEvent, type IntakeRequest, type Stage } from "./schema.ts";

export type ModelRequest = { system: string; user: string; schema: Record<string, unknown>; maxTokens: number };
export type ModelResult = { json: unknown; usage: { inputTokens: number; outputTokens: number } | null };
export type CallModel = (request: ModelRequest, signal: AbortSignal) => Promise<ModelResult>;

export class ModelError extends Error {
  readonly code: ErrorCode;
  constructor(code: ErrorCode) {
    super(code);
    this.code = code;
  }
}

/** gpt-6-luna list prices, using the cache-write rate as the upper bound for input. */
export const pricing = { inputUsdPerMTok: 0.125, outputUsdPerMTok: 0.5 };
export const tokenLimits = { extraction: 4000, draft: 3000, input: 2500 };

const usd = (input: number, output: number) => (input * pricing.inputUsdPerMTok + output * pricing.outputUsdPerMTok) / 1e6;

/** Worst case for one run: one attempt at each stage, each with its one retry. */
export const maxRunCostUsd = 2 * usd(2 * tokenLimits.input, tokenLimits.extraction + tokenLimits.draft);

/** Wraps a model call so nothing reaches the provider without reserving budget first. */
export function withBudget(callModel: CallModel, budget: Budget, onSpend: (usd: number) => void = () => {}): CallModel {
  return async (request, signal) => {
    const reserved = usd(tokenLimits.input, request.maxTokens);
    if (!budget.reserve(reserved)) throw new ModelError("budget");
    let actual = reserved;
    try {
      const result = await callModel(request, signal);
      if (result.usage) actual = usd(result.usage.inputTokens, result.usage.outputTokens);
      return result;
    } finally {
      budget.settle(reserved, actual);
      onSpend(actual);
    }
  };
}

export const errorMessages: Record<ErrorCode, string> = {
  timeout: "The AI took too long to respond. Please try again.",
  busy: "The AI service is busy right now. Please try again in a moment.",
  unavailable: "The AI service isn't available right now. Please try again shortly.",
  refusal: "The AI declined to process this message. Please try a different example.",
  invalid_output: "The AI returned a result we couldn't verify, so we didn't show it. Please try again.",
  draft_rejected: "The draft didn't pass our safety checks, so we didn't show it. Please try again.",
  budget: "The live demo has reached today's usage limit. Please come back tomorrow.",
  aborted: "Processing was cancelled.",
};

const isRetryable = (code: ErrorCode) => code !== "budget" && code !== "refusal" && code !== "aborted";

function failure(stage: Stage, code: ErrorCode): IntakeEvent {
  return { type: "error", stage, code, message: errorMessages[code], retryable: isRetryable(code) };
}

async function extract({ industry, message }: IntakeRequest, callModel: CallModel, nonce: string, signal: AbortSignal): Promise<Extraction> {
  const prompt = extractionPrompt(industry, message, nonce);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { json } = await callModel({ ...prompt, schema: extractionJsonSchema(industry), maxTokens: tokenLimits.extraction }, signal);
    const extraction = validateExtraction(json, industry);
    if (extraction) return extraction;
  }
  throw new ModelError("invalid_output");
}

async function writeDraft(args: { request: IntakeRequest; extraction: Extraction; classification: ReturnType<typeof classify> }, callModel: CallModel, nonce: string, signal: AbortSignal): Promise<Draft> {
  const { request, extraction, classification } = args;
  let corrections: string[] = [];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt = draftPrompt(request.industry, extraction, classification, nonce, corrections);
    const { json } = await callModel({ ...prompt, schema: draftJsonSchema, maxTokens: tokenLimits.draft }, signal);
    const draft = validateDraft(json);
    if (!draft) {
      corrections = ["Return both a subject and a body."];
      continue;
    }
    corrections = checkDraft(draft, request.message);
    if (corrections.length === 0) return draft;
  }
  throw new ModelError("draft_rejected");
}

/** Sent without a model call when the message isn't a customer inquiry. */
const notAnInquiryReply: Draft = {
  subject: "Thanks for getting in touch",
  body: "Hello,\n\nThanks for your message. We weren't sure how we can help. Could you tell us a little more about what you need?\n\nBest regards,\nCustomer Service Team",
  source: "template",
};

export type RunStats = { dropped: number };

/** Yields an event as each stage really finishes. Ends after `complete` or `error`. */
export async function* runIntake(request: IntakeRequest, deps: { callModel: CallModel; signal: AbortSignal; nonce?: string; stats?: RunStats }): AsyncGenerator<IntakeEvent> {
  const { callModel, signal, stats } = deps;
  const nonce = deps.nonce ?? crypto.randomUUID().replaceAll("-", "");
  let stage: Stage = "received";
  yield { type: "received" };

  try {
    stage = "extraction";
    const raw = await extract(request, callModel, nonce, signal);
    const { extraction, dropped } = groundExtraction(raw, request.industry, request.message);
    if (stats) stats.dropped = dropped;
    yield { type: "extraction", data: extraction };

    stage = "classification";
    const classification = classify(request.industry, extraction, request.message);
    yield { type: "classification", data: classification };

    stage = "draft";
    const draft = extraction.is_customer_inquiry ? await writeDraft({ request, extraction, classification }, callModel, nonce, signal) : notAnInquiryReply;
    yield { type: "draft", data: draft };

    yield { type: "complete", processing_mode: "live_ai" };
  } catch (err) {
    const code = err instanceof ModelError ? err.code : signal.aborted ? "aborted" : "unavailable";
    yield failure(stage, code);
  }
}
