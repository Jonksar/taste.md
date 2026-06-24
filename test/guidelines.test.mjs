import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { discoverRepositoryCandidates } from "../dist/guidelines.js";

test("discovers taste candidates from local repository markdown headings", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await mkdir(join(repoPath, "docs"));
  await writeFile(join(repoPath, "docs", "testing.md"), `# Testing Guidelines

## Rules

### Test Behavior, Not Implementation

Focus tests on observable behavior and outputs, not internal implementation details.

\`\`\`python
# example code block should not become evidence
\`\`\`

### Avoid Enum Mirror Tests

Do not add tests that only assert enum members equal their literal string values.
`);

  const candidates = await discoverRepositoryCandidates({ repoPath, lambda: 0.4 });

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].slug, "test-behavior-not-implementation");
  assert.equal(candidates[0].title, "Test Behavior, Not Implementation");
  assert.equal(candidates[0].rule, "Test Behavior, Not Implementation.");
  assert.equal(candidates[0].scope, "repository");
  assert.equal(candidates[0].score.confidence, 1);
  assert.equal(candidates[0].score.reward, 1);
  assert.equal(candidates[0].score.anchorDrift, 0);
  assert.equal(candidates[0].evidence[0].source, "docs/testing.md");
  assert.match(candidates[0].evidence[0].text, /observable behavior/);
  assert.doesNotMatch(candidates[0].evidence[0].text, /example code block/);
});

test("excludes existing guidelines directory by default", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await mkdir(join(repoPath, "guidelines"));
  await writeFile(join(repoPath, "AGENTS.md"), `# Project

## Testing

### Prefer behavior tests

Test observable behavior rather than implementation details.
`);
  await writeFile(join(repoPath, "guidelines", "GL005_testing.md"), `# Testing Guidelines

## Rules

### Do not import this existing guideline

This rule should not appear in repository discovery output.
`);

  const candidates = await discoverRepositoryCandidates({ repoPath });

  assert.deepEqual(candidates.map((candidate) => candidate.title), ["Prefer behavior tests"]);
  assert.equal(candidates[0].evidence[0].source, "AGENTS.md");
});

test("excludes repository worktree copies by default", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await mkdir(join(repoPath, ".worktrees", "feature"), { recursive: true });
  await writeFile(join(repoPath, "AGENTS.md"), `# Project

## Rules

### Keep root instructions

Use the active repository instructions.
`);
  await writeFile(join(repoPath, ".worktrees", "feature", "AGENTS.md"), `# Project

## Rules

### Do not import worktree copies

This rule should not appear.
`);

  const candidates = await discoverRepositoryCandidates({ repoPath });

  assert.deepEqual(candidates.map((candidate) => candidate.title), ["Keep root instructions"]);
});

test("merges repeated repository rules into one candidate", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await mkdir(join(repoPath, "docs"));
  await writeFile(join(repoPath, "AGENTS.md"), `# Project

## Rules

### Prefer behavior tests

Use observable outcomes from the root instructions.
`);
  await writeFile(join(repoPath, "docs", "testing.md"), `# Testing

## Rules

### Prefer behavior tests

Use observable outcomes from the testing docs.
`);

  const candidates = await discoverRepositoryCandidates({ repoPath });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title, "Prefer behavior tests");
  assert.deepEqual(candidates[0].evidence.map((item) => item.source), [
    "AGENTS.md",
    "docs/testing.md",
  ]);
});

test("discovers bold convention bullets from repository markdown", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await writeFile(join(repoPath, "AGENTS.md"), `# Project

## Coding Conventions

- **DTOs**: Use \`required\` for mandatory fields, \`[JsonPropertyName("snake_case")]\` for JSON serialization
- **DI**: Register services with appropriate lifetimes; not every helper needs to be a service
`);

  const candidates = await discoverRepositoryCandidates({ repoPath });

  assert.deepEqual(candidates.map((candidate) => candidate.title), [
    'DTOs: Use required for mandatory fields, [JsonPropertyName("snake_case")] for JSON serialization',
    "DI: Register services with appropriate lifetimes; not every helper needs to be a service",
  ]);
});

test("removes ICE guideline ids from generated titles and rules", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await mkdir(join(repoPath, "docs"));
  await writeFile(join(repoPath, "docs", "security.md"), `# Security

## Rules

### GL008-R05. New controllers must carry \`[Authorize]\`

When the API uses per-controller authorization, omitting the attribute exposes anonymous access.
`);

  const candidates = await discoverRepositoryCandidates({ repoPath });

  assert.equal(candidates[0].slug, "new-controllers-must-carry-authorize");
  assert.equal(candidates[0].title, "New controllers must carry [Authorize]");
  assert.equal(candidates[0].rule, "New controllers must carry [Authorize].");
});

test("removes numeric guideline prefixes from generated titles and rules", async () => {
  const repoPath = await mkdtemp(join(tmpdir(), "taste-guidelines-"));
  await mkdir(join(repoPath, "docs"));
  await writeFile(join(repoPath, "docs", "environment.md"), `# Environment

## Rules

### 1. No Duplication

A variable must appear in either defaults or examples, never both.
`);

  const candidates = await discoverRepositoryCandidates({ repoPath });

  assert.equal(candidates[0].slug, "no-duplication");
  assert.equal(candidates[0].title, "No Duplication");
  assert.equal(candidates[0].rule, "No Duplication.");
});
