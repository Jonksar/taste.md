import assert from "node:assert/strict";
import test from "node:test";

import { deriveTasteCandidates } from "../dist/evidence.js";

const behaviorTestPr = {
  number: 42,
  title: "Harden invoice matching tests",
  url: "https://github.com/example/project/pull/42",
  files: [
    { filename: "fire/projects/ai-assistant/tests/test_matching.py" },
    { filename: "fire/projects/ai-assistant/src/matching.py" },
  ],
  reviews: [],
  issueComments: [],
  reviewComments: [
    {
      author: "reviewer",
      body: "Prefer behavior tests here; this currently tests implementation details.",
      path: "fire/projects/ai-assistant/tests/test_matching.py",
    },
    {
      author: "reviewer",
      body: "Again, test observable behavior instead of implementation details.",
      path: "fire/projects/ai-assistant/tests/test_matching.py",
    },
  ],
};

test("repeated PR review comments become a scoped taste candidate", () => {
  const candidates = deriveTasteCandidates([behaviorTestPr], { lambda: 0.25 });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].slug, "prefer-behavior-tests");
  assert.equal(candidates[0].scope, "fire/projects/ai-assistant/tests");
  assert.equal(candidates[0].rule, "Prefer behavior tests over tests that mirror implementation details.");
  assert.equal(candidates[0].evidence.length, 2);
  assert.equal(candidates[0].score.reward, 0.9);
  assert.equal(candidates[0].score.anchorDrift, 0);
  assert.equal(candidates[0].score.confidence, 0.9);
});

test("contradictory PR evidence increases anchor drift", () => {
  const candidates = deriveTasteCandidates([
    behaviorTestPr,
    {
      ...behaviorTestPr,
      number: 43,
      reviewComments: [
        {
          author: "reviewer",
          body: "For this low-level helper, implementation detail tests are acceptable.",
          path: "fire/projects/ai-assistant/tests/test_matching.py",
        },
      ],
    },
  ], { lambda: 0.5 });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].score.reward, 0.9);
  assert.equal(candidates[0].score.anchorDrift, 0.25);
  assert.equal(candidates[0].score.confidence, 0.775);
});

test("changed file paths infer a project scope when comments lack paths", () => {
  const candidates = deriveTasteCandidates([
    {
      ...behaviorTestPr,
      reviewComments: [
        {
          author: "reviewer",
          body: "Prefer behavior tests in this area.",
        },
      ],
    },
  ]);

  assert.equal(candidates[0].scope, "fire/projects/ai-assistant");
});

test("generic reviewer preference phrasing becomes a taste candidate", () => {
  const candidates = deriveTasteCandidates([
    {
      number: 99,
      title: "Bundle CLI",
      url: "https://github.com/acme/widgets/pull/99",
      files: [{ filename: "packages/cli/package.json" }],
      reviews: [],
      issueComments: [],
      reviewComments: [
        {
          author: "reviewer",
          body: "Use tsup instead of tsc for CLI bundles.",
          path: "packages/cli/package.json",
        },
      ],
    },
  ]);

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].slug, "use-tsup-instead-of-tsc-for-cli-bundles");
  assert.equal(candidates[0].title, "Use tsup instead of tsc for CLI bundles");
  assert.equal(candidates[0].rule, "Use tsup instead of tsc for CLI bundles.");
  assert.equal(candidates[0].scope, "packages/cli");
});
