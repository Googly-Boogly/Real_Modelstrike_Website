"use client";

import { useEffect, useState } from "react";
import type { ProjectContext } from "@/lib/onboarding/backend";
import { onboardingApi, type ApiError } from "./api";
import { Questionnaire } from "./Questionnaire";
import { ErrorScreen, Loading, Submitted, type ErrorKind } from "./Screens";
import { Verify } from "./Verify";

type Phase =
  | { kind: "loading"; label: string }
  | { kind: "error"; error: ErrorKind; retry?: () => void }
  | { kind: "verify"; maskedEmail: string | null }
  | { kind: "ready"; project: ProjectContext }
  | { kind: "submitted"; submittedAt: string; already: boolean };

/**
 * Reads the invitation token from the URL fragment (preferred: never sent to any server)
 * or the query string, then removes it from the address bar and history straight away so it
 * can't leak through screenshots, shared URLs, bookmarks or later navigations.
 */
function takeToken(): string | null {
  const fromHash = new URLSearchParams(window.location.hash.slice(1)).get("token");
  const fromQuery = new URLSearchParams(window.location.search).get("token");
  const token = fromHash || fromQuery;
  if (token || window.location.hash || window.location.search) window.history.replaceState(window.history.state, "", window.location.pathname);
  return token?.trim() || null;
}

function kindFor(e: ApiError, hadToken: boolean): ErrorKind {
  switch (e.code) {
    case "invalid_link":
    case "expired_link":
    case "revoked_link":
    case "session_expired":
    case "rate_limited":
    case "network":
      return e.code;
    case "no_session":
      return hadToken ? "session_expired" : "missing_token";
    case "backend_unavailable":
    case "not_configured":
      return "unavailable";
    default:
      return e.status === 401 ? "invalid_link" : "unknown";
  }
}

type Setters = { setPhase: (p: Phase) => void; setMock: (m: boolean) => void };

/** The load sequence: token → session → (verification) → project. Plain functions so retries can refer back to themselves. */
function createLoader({ setPhase, setMock }: Setters) {
  let started = false;
  let hadToken = false;

  async function loadProject(): Promise<void> {
    setPhase({ kind: "loading", label: "Loading your project…" });
    const r = await onboardingApi.project();
    if (r.ok) {
      if (r.mock) setMock(true);
      setPhase(r.project.status === "submitted" ? { kind: "submitted", submittedAt: r.project.submittedAt ?? "", already: true } : { kind: "ready", project: r.project });
      return;
    }
    if (r.code === "verification_required") return setPhase({ kind: "verify", maskedEmail: null });
    setPhase({ kind: "error", error: kindFor(r, hadToken), retry: loadProject });
  }

  async function exchange(token: string): Promise<void> {
    setPhase({ kind: "loading", label: "Checking your invitation…" });
    const r = await onboardingApi.exchange(token);
    if (!r.ok) {
      // Retrying is only offered for transient failures; the token stays in memory (never in storage) for that.
      return setPhase({ kind: "error", error: kindFor(r, true), retry: () => exchange(token) });
    }
    if (r.mock) setMock(true);
    if (r.verification.required) return setPhase({ kind: "verify", maskedEmail: r.verification.maskedEmail });
    await loadProject();
  }

  /** Runs once per page load (Strict Mode calls effects twice in development). */
  function start() {
    if (started) return;
    started = true;
    const token = takeToken();
    hadToken = Boolean(token);
    // Without a token, a session cookie from an earlier visit (e.g. a page reload) may still be valid.
    void (token ? exchange(token) : loadProject());
  }

  return { loadProject, start };
}

export function OnboardingApp() {
  const [phase, setPhase] = useState<Phase>({ kind: "loading", label: "Checking your invitation…" });
  const [mock, setMock] = useState(false);
  const [loader] = useState(() => createLoader({ setPhase, setMock }));

  useEffect(() => {
    // Deferred a tick so the first state updates don't run synchronously inside the effect.
    const t = setTimeout(loader.start, 0);
    return () => clearTimeout(t);
  }, [loader]);

  switch (phase.kind) {
    case "loading":
      return <Loading label={phase.label} />;
    case "error":
      return <ErrorScreen key={phase.error} kind={phase.error} onRetry={phase.retry} />;
    case "verify":
      return <Verify maskedEmail={phase.maskedEmail} mockCode={mock ? "123456" : undefined} onVerified={loader.loadProject} onFatal={(error) => setPhase({ kind: "error", error })} />;
    case "submitted":
      return <Submitted submittedAt={phase.submittedAt} alreadySubmitted={phase.already} />;
    case "ready":
      return (
        <>
          {mock ? (
            <p className="mb-6 rounded-lg border border-warn/40 bg-warn/10 px-4 py-2.5 text-sm text-warn">
              Development mock: fictional data. Nothing you submit here is saved to the Sales Swarm.
            </p>
          ) : null}
          <Questionnaire
            project={phase.project}
            onSubmitted={(submittedAt, already) => setPhase({ kind: "submitted", submittedAt, already })}
            onSessionLost={() => setPhase({ kind: "error", error: "session_expired" })}
          />
        </>
      );
  }
}
