import assert from "node:assert/strict";
import test from "node:test";

import { calculateConfidence, clamp01 } from "../dist/formula.js";

test("confidence follows reward minus lambda times anchor drift", () => {
  const score = calculateConfidence({
    reward: 0.9,
    anchorDrift: 0.5,
    lambda: 0.4,
  });

  assert.equal(score.confidence, 0.7);
  assert.equal(score.semantic, "taste inertia");
  assert.equal(score.formula, "confidence = clamp01(reward - lambda * anchorDrift)");
});

test("confidence is clamped to the unit interval", () => {
  assert.equal(clamp01(-0.1), 0);
  assert.equal(clamp01(1.4), 1);
  assert.equal(clamp01(0.42), 0.42);
});
