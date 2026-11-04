// Business value calculator. Pure functions so the arithmetic is tested.

export type RoiKey = "inquiries" | "manualMinutes" | "aiMinutes" | "hourlyCost";
export type RoiInputs = Record<RoiKey, number>;

export const roiDefaults: RoiInputs = { inquiries: 200, manualMinutes: 5, aiMinutes: 1, hourlyCost: 25 };

export const roiFields: Record<RoiKey, { label: string; unit: string; min: number; max: number; step: number; sliderMax: number }> = {
  inquiries: { label: "Customer inquiries per month", unit: "inquiries", min: 0, max: 100_000, step: 10, sliderMax: 2000 },
  manualMinutes: { label: "Manual processing time per inquiry", unit: "minutes", min: 0, max: 240, step: 0.5, sliderMax: 30 },
  aiMinutes: { label: "AI-assisted employee time per inquiry", unit: "minutes", min: 0, max: 240, step: 0.5, sliderMax: 30 },
  hourlyCost: { label: "Estimated hourly employee cost", unit: "USD per hour", min: 0, max: 1000, step: 1, sliderMax: 100 },
};

/** Parses what the visitor typed. Blank, non-numeric or out-of-range values are errors, never silently clamped. */
export function parseRoiInputs(raw: Record<RoiKey, string>): { ok: true; inputs: RoiInputs } | { ok: false; errors: Partial<Record<RoiKey, string>> } {
  const errors: Partial<Record<RoiKey, string>> = {};
  const inputs = {} as RoiInputs;
  for (const key of Object.keys(roiFields) as RoiKey[]) {
    const f = roiFields[key];
    const text = raw[key]?.trim() ?? "";
    const value = Number(text.replace(/[$,\s]/g, ""));
    if (text === "" || !Number.isFinite(value)) errors[key] = "Enter a number.";
    else if (value < f.min || value > f.max) errors[key] = `Enter a value from ${f.min} to ${f.max.toLocaleString("en-US")}.`;
    else inputs[key] = value;
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, inputs };
}

export type RoiOutcome = "savings" | "no_volume" | "no_savings" | "slower";

export type RoiResult = {
  manualHours: number;
  aiHours: number;
  /** Never negative: a slower workflow saves nothing. */
  hoursSaved: number;
  reductionPct: number;
  monthlyValue: number;
  annualValue: number;
  /** Extra hours per month when AI-assisted handling takes longer. */
  extraHours: number;
  outcome: RoiOutcome;
};

export function calculateRoi({ inquiries, manualMinutes, aiMinutes, hourlyCost }: RoiInputs): RoiResult {
  const manualHours = (inquiries * manualMinutes) / 60;
  const aiHours = (inquiries * aiMinutes) / 60;
  const diff = manualHours - aiHours;
  const hoursSaved = Math.max(0, diff);
  const reductionPct = manualHours > 0 ? (hoursSaved / manualHours) * 100 : 0;
  const monthlyValue = hoursSaved * hourlyCost;
  const outcome: RoiOutcome = manualHours === 0 ? "no_volume" : diff > 0 ? "savings" : diff === 0 ? "no_savings" : "slower";
  return { manualHours, aiHours, hoursSaved, reductionPct, monthlyValue, annualValue: monthlyValue * 12, extraHours: Math.max(0, -diff), outcome };
}

export const formatHours = (h: number) => (h >= 100 ? Math.round(h).toLocaleString("en-US") : h.toFixed(1));
export const formatUsd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
export const formatPct = (n: number) => `${Math.round(n)}%`;
