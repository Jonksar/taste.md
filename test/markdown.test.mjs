import assert from "node:assert/strict";
import test from "node:test";

import { renderTasteMarkdown } from "../dist/markdown.js";

test("renders include-friendly taste markdown with formula metadata", () => {
  const markdown = renderTasteMarkdown([
    {
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
    },
  ], { title: "FIRE taste" });

  assert.match(markdown, /^# FIRE taste\n/);
  assert.match(markdown, /Formula: `confidence = clamp01\(reward - lambda \* anchorDrift\)`/);
  assert.match(markdown, /Lambda Semantic: `taste inertia`/);
  assert.match(markdown, /Confidence: `0.900`/);
  assert.match(markdown, /Reward: `0.900`/);
  assert.match(markdown, /Anchor Drift: `0.000`/);
  assert.match(markdown, /Scope: `fire\/projects\/ai-assistant\/tests`/);
  assert.match(markdown, /- PR #42 \(`fire\/projects\/ai-assistant\/tests\/test_matching.py`\): Prefer behavior tests here; this currently tests implementation details\./);
});

test("renders an empty file with guidance when no candidates are derived", () => {
  const markdown = renderTasteMarkdown([]);

  assert.match(markdown, /^# taste\.md\n/);
  assert.match(markdown, /No taste candidates met the evidence threshold\./);
});
