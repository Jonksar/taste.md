import assert from "node:assert/strict";
import test from "node:test";

import { renderTasteLogMarkdown, renderTasteMarkdown } from "../dist/markdown.js";

function behaviorTestCandidate() {
  return {
    slug: "prefer-behavior-tests",
    title: "Prefer behavior tests",
    scope: "fire/projects/ai-assistant/tests",
    rule: "Prefer behavior tests over tests that mirror implementation details.",
    evidence: [
      {
        source: "PR #42",
        text: "Prefer behavior tests here; this currently tests implementation details.",
        path: "fire/projects/ai-assistant/tests/test_matching.py",
      },
    ],
    contradictions: [],
    score: {
      confidence: 0.9,
      reward: 0.9,
      anchorDrift: 0,
      lambda: 0.35,
      semantic: "taste inertia",
      formula: "confidence = clamp01(reward - lambda * anchorDrift)",
    },
  };
}

test("renders include-friendly taste markdown with rules only", () => {
  const markdown = renderTasteMarkdown([behaviorTestCandidate()], { title: "FIRE taste" });

  assert.match(markdown, /^# FIRE taste\n/);
  assert.match(markdown, /^- Prefer behavior tests over tests that mirror implementation details\.$/m);
  assert.doesNotMatch(markdown, /## Prefer behavior tests/);
  assert.doesNotMatch(markdown, /Project taste rules/);
  assert.doesNotMatch(markdown, /Formula:/);
  assert.doesNotMatch(markdown, /Confidence:/);
  assert.doesNotMatch(markdown, /Reward:/);
  assert.doesNotMatch(markdown, /Anchor Drift:/);
  assert.doesNotMatch(markdown, /Evidence:/);
  assert.doesNotMatch(markdown, /PR #42/);
});

test("renders taste log markdown with formula metadata and evidence", () => {
  const markdown = renderTasteLogMarkdown([behaviorTestCandidate()], { title: "FIRE taste log" });

  assert.match(markdown, /^# FIRE taste log\n/);
  assert.match(markdown, /Formula: `confidence = clamp01\(reward - lambda \* anchorDrift\)`/);
  assert.match(markdown, /Lambda Semantic: `taste inertia`/);
  assert.match(markdown, /Confidence: `0.900`/);
  assert.match(markdown, /Reward: `0.900`/);
  assert.match(markdown, /Anchor Drift: `0.000`/);
  assert.match(markdown, /Scope: `fire\/projects\/ai-assistant\/tests`/);
  assert.match(markdown, /- PR #42 \(`fire\/projects\/ai-assistant\/tests\/test_matching.py`\): Prefer behavior tests here; this currently tests implementation details\./);
});

test("renders an empty taste file with no scoring metadata", () => {
  const markdown = renderTasteMarkdown([]);

  assert.match(markdown, /^# taste\.md\n/);
  assert.match(markdown, /No taste rules were generated\./);
  assert.doesNotMatch(markdown, /Confidence:/);
});

test("renders an empty taste log when no candidates are derived", () => {
  const markdown = renderTasteLogMarkdown([]);

  assert.match(markdown, /^# taste_log\.md\n/);
  assert.match(markdown, /No taste candidates met the evidence threshold\./);
});
