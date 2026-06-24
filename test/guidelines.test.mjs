import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { discoverGuidelineCandidates } from "../dist/guidelines.js";

test("discovers taste candidates from local markdown guideline headings", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await mkdir(join(repoPath, "guidelines"));
  await writeFile(join(repoPath, "guidelines", "GL005_testing.md"), `# Testing Guidelines

## Rules

### Test Behavior, Not Implementation

Focus tests on observable behavior and outputs, not internal implementation details.

\`\`\`python
# example code block should not become evidence
\`\`\`

### Avoid Enum Mirror Tests

Do not add tests that only assert enum members equal their literal string values.
`);

  const candidates = await discoverGuidelineCandidates({ repoPath, lambda: 0.4 });

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].slug, "test-behavior-not-implementation");
  assert.equal(candidates[0].title, "Test Behavior, Not Implementation");
  assert.equal(candidates[0].rule, "Test Behavior, Not Implementation.");
  assert.equal(candidates[0].scope, "repository");
  assert.equal(candidates[0].score.confidence, 1);
  assert.equal(candidates[0].score.reward, 1);
  assert.equal(candidates[0].score.anchorDrift, 0);
  assert.equal(candidates[0].evidence[0].source, "guidelines/GL005_testing.md");
  assert.match(candidates[0].evidence[0].text, /observable behavior/);
  assert.doesNotMatch(candidates[0].evidence[0].text, /example code block/);
});

test("removes ICE guideline ids from generated titles and rules", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await mkdir(join(repoPath, "guidelines"));
  await writeFile(join(repoPath, "guidelines", "GL008_security.md"), `# Security

## Rules

### GL008-R05. New controllers must carry \`[Authorize]\`

When the API uses per-controller authorization, omitting the attribute exposes anonymous access.
`);

  const candidates = await discoverGuidelineCandidates({ repoPath });

  assert.equal(candidates[0].slug, "new-controllers-must-carry-authorize");
  assert.equal(candidates[0].title, "New controllers must carry [Authorize]");
  assert.equal(candidates[0].rule, "New controllers must carry [Authorize].");
});

test("removes numeric guideline prefixes from generated titles and rules", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await mkdir(join(repoPath, "guidelines"));
  await writeFile(join(repoPath, "guidelines", "GL001_environment.md"), `# Environment

## Rules

### 1. No Duplication

A variable must appear in either defaults or examples, never both.
`);

  const candidates = await discoverGuidelineCandidates({ repoPath });

  assert.equal(candidates[0].slug, "no-duplication");
  assert.equal(candidates[0].title, "No Duplication");
  assert.equal(candidates[0].rule, "No Duplication.");
});
