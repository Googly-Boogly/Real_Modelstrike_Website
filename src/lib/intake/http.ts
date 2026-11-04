import "server-only";
import { isAiConfigured } from "./ai";
import { admit, type Admission } from "./runtime";
import { intakeLimits } from "./schema";

// Request guards shared by the /api/demo routes.

export function deny(status: number, code: string, message: string, retryAfterSeconds?: number) {
  console.warn(`[demo] denied reason=${code}`);
  return Response.json({ success: false, code, message }, { status, headers: retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : undefined });
}

/** Browsers always send Origin on a POST; requiring it keeps other sites and casual scripts off the paid API. */
function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}

function clientIp(request: Request) {
  // Trust only the first hop; the reverse proxy in front of the app must set these.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Reads at most `limit` bytes, however large the body or whatever Content-Length claims. */
async function readBody(request: Request, limit: number) {
  if (!request.body) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Every check before a paid call: configured, same origin, JSON, size,
 * validation, then budget, concurrency and rate limits. On success the caller
 * holds a concurrency slot and must call `admission.release()`.
 */
export async function guard<T>(request: Request, validate: (json: unknown) => { ok: true; value: T } | { ok: false; message: string }): Promise<Response | { value: T; admission: Extract<Admission, { ok: true }> }> {
  if (!isAiConfigured()) return deny(503, "not_configured", "Live AI processing isn't enabled on this site right now.");
  if (!isSameOrigin(request)) return deny(403, "forbidden", "This request isn't allowed.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) return deny(415, "bad_request", "This request isn't allowed.");

  const body = await readBody(request, intakeLimits.requestBytes);
  if (body === null) return deny(413, "too_large", `Please keep the inquiry under ${intakeLimits.message} characters.`);
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return deny(400, "bad_request", "This request couldn't be read.");
  }
  const validation = validate(json);
  if (!validation.ok) return deny(400, "invalid", validation.message);

  const admission = admit(clientIp(request));
  if (!admission.ok) return deny(admission.status, admission.code, admission.message, admission.retryAfterSeconds);
  return { value: validation.value, admission };
}
