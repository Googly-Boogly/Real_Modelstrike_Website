"use client";

import { useId, useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { calculateRoi, formatHours, formatPct, formatUsd, parseRoiInputs, roiDefaults, roiFields, type RoiKey } from "@/lib/demo/roi";
import { inputClasses } from "./ui";

const keys = Object.keys(roiFields) as RoiKey[];
const initial = Object.fromEntries(keys.map((k) => [k, String(roiDefaults[k])])) as Record<RoiKey, string>;

function Card({ icon, label, value, note, highlight = false }: { icon: IconName; label: string; value: string; note: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? "ring-gradient bg-ink-800" : "border border-line bg-ink-800/70"}`}>
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <Icon name={icon} className="size-4 text-cyan-400" />
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">{value}</p>
      <p className="mt-1 text-xs text-fg-subtle">{note}</p>
    </div>
  );
}

export function ROICalculator() {
  const id = useId();
  const [raw, setRaw] = useState(initial);
  const parsed = useMemo(() => parseRoiInputs(raw), [raw]);
  const result = parsed.ok ? calculateRoi(parsed.inputs) : null;
  const errors = parsed.ok ? {} : parsed.errors;
  const savings = result?.outcome === "savings";
  const manualMax = result ? Math.max(result.manualHours, result.aiHours, 0.0001) : 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <form onSubmit={(e) => e.preventDefault()} aria-label="Calculator inputs" className="space-y-5 rounded-2xl border border-line bg-ink-800 p-5 sm:p-6">
        {keys.map((key) => {
          const f = roiFields[key];
          const numeric = Number(raw[key]);
          const sliderValue = Number.isFinite(numeric) ? Math.min(Math.max(numeric, f.min), f.sliderMax) : f.min;
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={`${id}-${key}`} className="text-sm font-medium text-fg">
                  {f.label}
                </label>
                <span className="text-xs text-fg-subtle">{f.unit}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  aria-label={`${f.label} slider`}
                  min={f.min}
                  max={f.sliderMax}
                  step={f.step}
                  value={sliderValue}
                  onChange={(e) => setRaw({ ...raw, [key]: e.target.value })}
                  className="h-2 flex-1 cursor-pointer accent-accent-500"
                />
                <input
                  id={`${id}-${key}`}
                  type="number"
                  inputMode="decimal"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  value={raw[key]}
                  onChange={(e) => setRaw({ ...raw, [key]: e.target.value })}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `${id}-${key}-error` : undefined}
                  className={`${inputClasses} w-28 text-right font-mono`}
                />
              </div>
              {errors[key] ? (
                <p id={`${id}-${key}-error`} className="mt-1 text-xs text-danger">
                  {errors[key]}
                </p>
              ) : null}
            </div>
          );
        })}
        <button type="button" onClick={() => setRaw(initial)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400 hover:text-accent-300">
          <Icon name="refresh" className="size-4" />
          Reset to example values
        </button>
      </form>

      <div>
        {result ? (
          <div>
            {result.outcome === "slower" ? (
              <p className="mb-4 flex gap-2 rounded-xl border border-warn/40 bg-warn/10 p-3.5 text-sm text-fg">
                <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-warn" />
                With these numbers, AI-assisted handling would take about {formatHours(result.extraHours)} more hours per month than doing it manually, so there are no estimated savings.
              </p>
            ) : result.outcome === "no_savings" ? (
              <p className="mb-4 rounded-xl border border-line-strong bg-ink-800 p-3.5 text-sm text-fg-muted">With equal time per inquiry, there are no estimated time savings.</p>
            ) : result.outcome === "no_volume" ? (
              <p className="mb-4 rounded-xl border border-line-strong bg-ink-800 p-3.5 text-sm text-fg-muted">Enter a number of inquiries and a manual processing time to see an estimate.</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card icon="clock" label="Hours potentially saved per month" value={formatHours(result.hoursSaved)} note={`${formatHours(result.manualHours)} manual → ${formatHours(result.aiHours)} AI-assisted hours`} highlight={savings} />
              <Card icon="bolt" label="Estimated reduction in processing time" value={formatPct(result.reductionPct)} note="Of the time spent on intake today" />
              <Card icon="briefcase" label="Estimated monthly labor capacity value" value={formatUsd(result.monthlyValue)} note="Hours saved × hourly employee cost" highlight={savings} />
              <Card icon="calendar" label="Estimated annual labor capacity value" value={formatUsd(result.annualValue)} note="Monthly value × 12" />
            </div>
            <div className="mt-4 rounded-2xl border border-line bg-ink-800/70 p-5">
              <p className="text-sm font-medium text-fg">Monthly hours spent on inquiries</p>
              <dl className="mt-3 space-y-2.5 text-xs">
                {[
                  { label: "Manual", hours: result.manualHours, bar: "bg-fg-subtle" },
                  { label: "AI-assisted", hours: result.aiHours, bar: "bg-accent-500" },
                ].map((r) => (
                  <div key={r.label} className="grid grid-cols-[6rem_1fr_4rem] items-center gap-3">
                    <dt className="text-fg-muted">{r.label}</dt>
                    <dd aria-hidden className="h-2.5 overflow-hidden rounded-full bg-ink-700">
                      <div className={`h-full rounded-full transition-[width] duration-300 ${r.bar}`} style={{ width: `${(r.hours / manualMax) * 100}%` }} />
                    </dd>
                    <dd className="text-right font-mono text-fg">{formatHours(r.hours)} h</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : (
          <p role="status" className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-fg-muted">
            Enter valid numbers on the left to see an estimate.
          </p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-fg-subtle">
          These figures are illustrative estimates based on the information entered. Actual results depend on workflow complexity, implementation, employee adoption, and operating costs. Time freed
          for other work does not necessarily represent direct cash savings.
        </p>
      </div>
    </div>
  );
}
