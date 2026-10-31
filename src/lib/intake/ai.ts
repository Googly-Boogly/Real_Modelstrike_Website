import "server-only";
import OpenAI, { APIConnectionTimeoutError, APIError, APIUserAbortError, RateLimitError } from "openai";
import { ModelError, type CallModel } from "./pipeline";

// Fixed server-side. Visitors can't choose the model or add instructions.
const MODEL = "gpt-6-luna";
const TIMEOUT_MS = 25_000;

let client: OpenAI | null = null;

/** True when a server-side API key is configured. Never exposed to the browser. */
export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getClient() {
  client ??= new OpenAI({ timeout: TIMEOUT_MS, maxRetries: 1 });
  return client;
}

function toModelError(err: unknown) {
  if (err instanceof ModelError) return err;
  if (err instanceof APIUserAbortError) return new ModelError("aborted");
  if (err instanceof APIConnectionTimeoutError) return new ModelError("timeout");
  if (err instanceof APIError) {
    // Status and code only, e.g. 429 insufficient_quota means the account needs attention.
    console.error(`[demo] provider error status=${err.status ?? "connection"} code=${err.code ?? "none"}`);
    return new ModelError(err instanceof RateLimitError ? "busy" : "unavailable");
  }
  console.error("[demo] provider error status=unexpected");
  return new ModelError("unavailable");
}

export const callOpenAI: CallModel = async ({ system, user, schema, maxTokens }, signal) => {
  try {
    const response = await getClient().responses.create(
      {
        model: MODEL,
        max_output_tokens: maxTokens,
        reasoning: { effort: "low" },
        // Demo text must not be kept as a stored response.
        store: false,
        text: { format: { type: "json_schema", name: "intake_result", schema, strict: true } },
        instructions: system,
        input: user,
      },
      { signal },
    );

    const usage = response.usage ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } : null;
    if (response.status === "failed") throw new ModelError("unavailable");
    const parts = response.output.flatMap((item) => (item.type === "message" ? item.content : []));
    if (parts.some((part) => part.type === "refusal")) throw new ModelError("refusal");
    if (response.status !== "completed") return { json: null, usage };

    try {
      return { json: JSON.parse(response.output_text), usage };
    } catch {
      return { json: null, usage };
    }
  } catch (err) {
    throw toModelError(err);
  }
};
