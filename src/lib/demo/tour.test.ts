import { test } from "node:test";
import assert from "node:assert/strict";
import { tourIdle, tourReducer, tourSteps } from "./tour.ts";

test("guided demo covers the six steps in order", () => {
  assert.deepEqual(tourSteps.map((s) => s.target), ["inbox", "process", "record", "approval", "roi", "cta"]);
});

test("next, previous, exit and restart", () => {
  let s = tourReducer(tourIdle, { type: "next" });
  assert.deepEqual(s, tourIdle, "next does nothing until started");
  s = tourReducer(s, { type: "start" });
  assert.deepEqual(s, { active: true, index: 0 });
  s = tourReducer(s, { type: "prev" });
  assert.equal(s.index, 0, "can't go before the first step");
  for (let i = 0; i < tourSteps.length - 1; i += 1) s = tourReducer(s, { type: "next" });
  assert.equal(s.index, tourSteps.length - 1);
  s = tourReducer(s, { type: "prev" });
  assert.equal(s.index, tourSteps.length - 2);
  s = tourReducer(s, { type: "restart" });
  assert.deepEqual(s, { active: true, index: 0 });
  assert.deepEqual(tourReducer(s, { type: "exit" }), tourIdle);
});

test("next on the last step finishes the tour", () => {
  let s = tourReducer(tourIdle, { type: "start" });
  for (let i = 0; i < tourSteps.length; i += 1) s = tourReducer(s, { type: "next" });
  assert.deepEqual(s, tourIdle);
});
