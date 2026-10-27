"use client";

import { useEffect, useRef } from "react";

/** Must match the Cal.com origins allowed in next.config.ts. */
const CAL_ORIGIN = "https://app.cal.com";
const NAMESPACE = "consultation";

type CalQueue = ((...args: unknown[]) => void) & { q?: unknown[]; ns?: Record<string, CalQueue>; loaded?: boolean };

declare global {
  interface Window {
    Cal?: CalQueue;
  }
}

/**
 * Cal.com's official loader snippet, typed: calls are queued until
 * embed.js arrives, which then replays them.
 */
function getCal(): CalQueue {
  if (window.Cal) return window.Cal;
  const push = (api: CalQueue, args: unknown) => api.q!.push(args);
  const cal: CalQueue = function (...args: unknown[]) {
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      document.head.appendChild(document.createElement("script")).src = `${CAL_ORIGIN}/embed/embed.js`;
      cal.loaded = true;
    }
    if (args[0] === "init") {
      const namespace = args[1];
      if (typeof namespace === "string") {
        const api: CalQueue = (...apiArgs: unknown[]) => push(api, apiArgs);
        api.q = [];
        cal.ns![namespace] = cal.ns![namespace] || api;
        push(cal.ns![namespace], args);
        push(cal, ["initNamespace", namespace]);
      } else {
        push(cal, args);
      }
      return;
    }
    push(cal, args);
  };
  cal.q = [];
  window.Cal = cal;
  return cal;
}

type CalEmbedProps = {
  /** `username/event-slug` */
  calLink: string;
  /** Prefills Cal.com's booking form, e.g. from the request the visitor just sent. */
  prefill?: { name: string; email: string };
};

/** Inline Cal.com booking calendar. */
export function CalEmbed({ calLink, prefill }: CalEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Refs survive Strict Mode's double effect run, so the embed mounts once.
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current || !containerRef.current) return;
    mounted.current = true;

    const cal = getCal();
    if (!cal.ns?.[NAMESPACE]) cal("init", NAMESPACE, { origin: CAL_ORIGIN });
    const api = cal.ns![NAMESPACE];
    api("inline", {
      elementOrSelector: containerRef.current,
      calLink,
      layout: "month_view",
      config: { theme: "dark", ...prefill },
    });
    api("ui", {
      theme: "dark",
      layout: "month_view",
      hideEventTypeDetails: false,
      cssVarsPerTheme: { dark: { "cal-brand": "#2563eb" } },
    });
  }, [calLink, prefill]);

  return (
    <div>
      <div ref={containerRef} className="min-h-[38rem] w-full overflow-auto rounded-xl border border-line-strong bg-ink-900" />
      <p className="mt-3 text-sm text-fg-subtle">
        Calendar not loading?{" "}
        <a
          href={`https://cal.com/${calLink}${prefill ? `?${new URLSearchParams(prefill)}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-accent-400 underline-offset-4 hover:text-accent-300 hover:underline"
        >
          Open it on Cal.com
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
    </div>
  );
}
