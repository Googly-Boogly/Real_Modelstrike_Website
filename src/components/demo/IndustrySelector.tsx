import { Icon } from "@/components/ui/Icon";
import type { IndustryConfig } from "@/lib/intake/industries";

export function IndustrySelector({ industries, selected, onSelect }: { industries: IndustryConfig[]; selected: IndustryConfig; onSelect: (id: string) => void }) {
  return (
    <div>
      <fieldset>
        <legend className="mb-3 font-display text-base font-bold text-fg">1. Choose an industry</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {industries.map((i) => {
            const active = i.id === selected.id;
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => onSelect(i.id)}
                aria-pressed={active}
                className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${active ? "border-accent-400 bg-accent-600/15" : "border-line bg-ink-800 hover:border-accent-400/50"}`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${active ? "bg-accent-600/20 text-accent-300 ring-accent-400/40" : "bg-ink-700 text-fg-muted ring-line-strong"}`}>
                  <Icon name={i.icon} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
                    {i.label}
                    {active ? <Icon name="check" className="size-4 text-accent-300" /> : null}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-fg-muted">{i.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <ol aria-label={`${selected.label} workflow`} className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-xs text-fg-muted">
        {selected.terms.workflow.map((step, n) => (
          <li key={step} className="flex items-center gap-1.5">
            {n > 0 ? <Icon name="arrowRight" className="size-3 text-fg-subtle" /> : null}
            <span className="rounded-md border border-line bg-ink-800/60 px-2 py-1">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
