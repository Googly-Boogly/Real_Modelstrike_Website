import { Icon } from "@/components/ui/Icon";
import type { InboxItem, ItemResult } from "@/lib/demo/workflow";
import { Chip, PriorityChip, StatusChip } from "./ui";

function preview(body: string) {
  const text = body.replace(/\s+/g, " ").replace(/^(hi|hello|hey)( there)?,?\s*/i, "");
  return text.length > 90 ? `${text.slice(0, 88).trimEnd()}…` : text;
}

export function CustomerInbox({
  items,
  results,
  selectedId,
  onSelect,
  onCompose,
  composing,
}: {
  items: InboxItem[];
  results: Record<string, ItemResult>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCompose: () => void;
  composing: boolean;
}) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {items.map((item) => {
          const result = results[item.id];
          const active = item.id === selectedId && !composing;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? "true" : undefined}
                className={`relative block w-full px-4 py-3 text-left transition-colors ${active ? "bg-accent-600/10" : "hover:bg-ink-700/60"}`}
              >
                {active ? <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent-400" /> : null}
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-sm ${result ? "font-medium text-fg-muted" : "font-semibold text-fg"}`}>{item.name ?? item.email ?? "Unknown sender"}</span>
                  <span className="shrink-0 font-mono text-[11px] text-fg-subtle">{item.receivedAt}</span>
                </span>
                <span className="mt-0.5 block truncate text-sm font-medium text-fg">{item.subject || "(no subject)"}</span>
                <span className="mt-0.5 block text-xs leading-snug text-fg-muted">{preview(item.body)}</span>
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {item.custom ? <Chip>Your example</Chip> : null}
                  <StatusChip result={result} />
                  {result?.classification ? <PriorityChip priority={result.classification.priority} /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={onCompose}
          aria-pressed={composing}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm font-semibold transition-colors ${composing ? "border-accent-400 text-accent-300" : "border-line-strong text-fg-muted hover:border-accent-400/60 hover:text-fg"}`}
        >
          <Icon name="pencil" className="size-4" />
          Write your own request
        </button>
      </div>
    </div>
  );
}
