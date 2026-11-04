import { useMemo } from "react";
import { buttonClasses } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { InboxItem, ItemResult } from "@/lib/demo/workflow";
import type { IndustryConfig } from "@/lib/intake/industries";
import { Spinner } from "./ui";

/** Splits text into plain and highlighted runs for each extracted value found in it. */
function highlight(text: string, values: string[]) {
  const ranges: [number, number][] = [];
  const lower = text.toLowerCase();
  for (const value of values) {
    const at = lower.indexOf(value.toLowerCase());
    if (at >= 0) ranges.push([at, at + value.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const parts: { text: string; marked: boolean }[] = [];
  let cursor = 0;
  for (const [from, to] of ranges) {
    if (from < cursor) continue;
    if (from > cursor) parts.push({ text: text.slice(cursor, from), marked: false });
    parts.push({ text: text.slice(from, to), marked: true });
    cursor = to;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), marked: false });
  return parts;
}

function Marked({ text, values }: { text: string; values: string[] }) {
  const parts = useMemo(() => highlight(text, values), [text, values]);
  return (
    <>
      {parts.map((p, i) =>
        p.marked ? (
          <mark key={i} className="rounded bg-cyan-400/15 px-0.5 text-cyan-300 ring-1 ring-inset ring-cyan-400/30">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

export function CustomerMessage({
  item,
  industry,
  result,
  live,
  busy,
  onProcess,
  onEdit,
}: {
  item: InboxItem;
  industry: IndustryConfig;
  result: ItemResult | undefined;
  live: boolean;
  /** Another request is being processed. */
  busy: boolean;
  onProcess: () => void;
  onEdit: () => void;
}) {
  const extraction = result?.extraction;
  const values = useMemo(() => (extraction ? industry.fields.filter((f) => f.grounding === "verbatim").flatMap((f) => extraction.fields[f.key] ?? []) : []), [industry, extraction]);
  const processing = result?.status === "processing";
  const canRun = live || !item.custom;
  const label = processing ? "Processing…" : !live ? (result ? "Show Simulated Example Again" : "Process With AI (Simulated)") : result ? "Process Again" : item.custom ? "Process Custom Request" : "Process With AI";

  return (
    <article aria-label="Selected message" className="border-t border-line bg-ink-900/40 p-4">
      <dl className="space-y-1 text-xs">
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 text-fg-subtle">From</dt>
          <dd className="min-w-0 break-words text-fg">
            {item.name || item.email ? (
              <>
                {item.name ? <Marked text={item.name} values={values} /> : null}
                {item.name && item.email ? " " : null}
                {item.email ? (
                  <span className="text-fg-muted">
                    &lt;
                    <Marked text={item.email} values={values} />
                    &gt;
                  </span>
                ) : null}
              </>
            ) : (
              <span className="italic text-fg-muted">Not provided</span>
            )}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 text-fg-subtle">Subject</dt>
          <dd className="min-w-0 break-words font-semibold text-fg">{item.subject || "(no subject)"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 text-fg-subtle">Received</dt>
          <dd className="text-fg-muted">
            Today, {item.receivedAt} · {item.custom ? "Your fictional example" : "Fictional sample"}
          </dd>
        </div>
      </dl>
      <p className="mt-3 whitespace-pre-wrap break-words rounded-xl border border-line bg-ink-950/60 p-3.5 text-sm leading-relaxed text-fg">
        <Marked text={item.body} values={values} />
      </p>

      <button type="button" data-tour="process" onClick={onProcess} disabled={!canRun || processing || busy} className={buttonClasses({ size: "lg", className: "mt-4 w-full" })}>
        {processing ? <Spinner className="size-4 border-white" /> : <Icon name="sparkle" className="size-4" />}
        {label}
      </button>
      {busy && !processing ? <p className="mt-2 text-xs text-fg-muted">Another request is processing. You can run this one when it finishes.</p> : null}
      {!live ? (
        <p className="mt-2 text-xs leading-relaxed text-fg-muted">
          {item.custom
            ? "Live AI is turned off right now, so custom messages can't be processed. Choose a sample to see a simulated example."
            : "Live AI is turned off right now. You'll see a precomputed simulated example for this sample, clearly labelled."}
        </p>
      ) : null}
      {live && !processing ? (
        <button type="button" onClick={onEdit} className={buttonClasses({ variant: "ghost", className: "mt-3" })}>
          <Icon name="pencil" className="size-4" />
          {item.custom ? "Edit this request" : "Edit this message and process your version"}
        </button>
      ) : null}
    </article>
  );
}
