import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateRoi, formatHours, formatPct, formatUsd, parseRoiInputs, roiDefaults } from "./roi.ts";

test("default inputs give the documented example figures", () => {
  const r = calculateRoi(roiDefaults);
  assert.ok(Math.abs(r.manualHours - 16.6667) < 1e-3);
  assert.ok(Math.abs(r.aiHours - 3.3333) < 1e-3);
  assert.equal(formatHours(r.hoursSaved), "13.3");
  assert.equal(formatPct(r.reductionPct), "80%");
  assert.equal(formatUsd(r.monthlyValue), "$333");
  assert.equal(formatUsd(r.annualValue), "$4,000");
  assert.equal(r.outcome, "savings");
});

test("follows the stated formulas", () => {
  const r = calculateRoi({ inquiries: 600, manualMinutes: 8, aiMinutes: 2, hourlyCost: 30 });
  assert.equal(r.manualHours, 80);
  assert.equal(r.aiHours, 20);
  assert.equal(r.hoursSaved, 60);
  assert.equal(r.reductionPct, 75);
  assert.equal(r.monthlyValue, 1800);
  assert.equal(r.annualValue, 21600);
});

test("zero volume or zero manual time divides safely", () => {
  for (const inputs of [{ ...roiDefaults, inquiries: 0 }, { ...roiDefaults, manualMinutes: 0, aiMinutes: 0 }]) {
    const r = calculateRoi(inputs);
    assert.equal(r.reductionPct, 0);
    assert.equal(r.monthlyValue, 0);
    assert.equal(r.outcome, "no_volume");
    assert.ok(Number.isFinite(r.reductionPct));
  }
});

test("a slower AI-assisted workflow never shows negative savings as a benefit", () => {
  const r = calculateRoi({ ...roiDefaults, manualMinutes: 2, aiMinutes: 5 });
  assert.equal(r.outcome, "slower");
  assert.equal(r.hoursSaved, 0);
  assert.equal(r.monthlyValue, 0);
  assert.equal(r.annualValue, 0);
  assert.equal(r.reductionPct, 0);
  assert.equal(r.extraHours, 10);
  assert.equal(calculateRoi({ ...roiDefaults, aiMinutes: 5 }).outcome, "no_savings");
});

test("invalid inputs are reported, not guessed", () => {
  const ok = parseRoiInputs({ inquiries: "1,200", manualMinutes: "4.5", aiMinutes: "1", hourlyCost: "$32" });
  assert.ok(ok.ok);
  assert.deepEqual(ok.inputs, { inquiries: 1200, manualMinutes: 4.5, aiMinutes: 1, hourlyCost: 32 });

  const bad = parseRoiInputs({ inquiries: "", manualMinutes: "abc", aiMinutes: "-1", hourlyCost: "99999" });
  assert.ok(!bad.ok);
  assert.deepEqual(Object.keys(bad.errors).sort(), ["aiMinutes", "hourlyCost", "inquiries", "manualMinutes"]);
});
