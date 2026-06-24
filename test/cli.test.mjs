import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const cliPath = new URL("../dist/cli.js", import.meta.url);

test("help flag prints usage", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    cliPath.pathname,
    "--help",
  ]);

  assert.match(stdout, /taste-md/);
  assert.match(stdout, /confidence = clamp01/);
});

test("score command prints the original single-constant formula result", async () => {
  const { stdout } = await execFileAsync(process.execPath, [
    cliPath.pathname,
    "score",
    "--reward",
    "0.9",
    "--anchor-drift",
    "0.5",
    "--lambda",
    "0.4",
  ]);

  const result = JSON.parse(stdout);
  assert.equal(result.confidence, 0.7);
  assert.equal(result.semantic, "taste inertia");
  assert.equal(result.formula, "confidence = clamp01(reward - lambda * anchorDrift)");
});

test("generate command writes taste.md from local pull request evidence", async () => {
  const dir = await mkdtemp(join(tmpdir(), "taste-md-"));
  const input = join(dir, "prs.json");
  const output = join(dir, "taste.md");
  const logOutput = join(dir, "taste_log.md");

  await writeFile(input, JSON.stringify([
    {
      number: 42,
      title: "Harden tests",
      url: "https://github.com/acme/widgets/pull/42",
      files: [{ filename: "fire/projects/ai-assistant/tests/test_matching.py" }],
      reviews: [],
      issueComments: [],
      reviewComments: [
        {
          author: "reviewer",
          body: "Prefer behavior tests here; this currently tests implementation details.",
          path: "fire/projects/ai-assistant/tests/test_matching.py",
        },
      ],
    },
  ]));

  await execFileAsync(process.execPath, [
    cliPath.pathname,
    "generate",
    "--input",
    input,
    "--output",
    output,
    "--lambda",
    "0.25",
  ]);

  const markdown = await readFile(output, "utf8");
  const logMarkdown = await readFile(logOutput, "utf8");
  assert.match(markdown, /^# taste\.md\n/);
  assert.match(markdown, /^- Prefer behavior tests over tests that mirror implementation details\.$/m);
  assert.doesNotMatch(markdown, /## Prefer behavior tests/);
  assert.doesNotMatch(markdown, /Lambda: `0.250`/);
  assert.doesNotMatch(markdown, /Evidence:/);
  assert.match(logMarkdown, /^# taste_log\.md\n/);
  assert.match(logMarkdown, /Lambda: `0.250`/);
  assert.match(logMarkdown, /PR #42/);
});

test("discover command writes taste.md and taste_log.md from repository markdown excluding guidelines", async () => {
  const dir = await mkdtemp(join(tmpdir(), "taste-md-discover-"));
  const repoPath = join(dir, "repo");
  const guidelinesPath = join(repoPath, "guidelines");
  const output = join(dir, "taste.md");
  const logOutput = join(dir, "taste_log.md");
  await mkdir(guidelinesPath, { recursive: true });
  await writeFile(join(repoPath, "AGENTS.md"), `# Project

## Testing

### Prefer durable behavior tests

Review observable behavior and outputs instead of implementation details.
`);
  await writeFile(join(guidelinesPath, "GL008_security.md"), `# Security

## Rules

### GL008-R05. New controllers must carry \`[Authorize]\`

When the API uses per-controller authorization, omitting the attribute exposes anonymous access.
`);

  await execFileAsync(process.execPath, [
    cliPath.pathname,
    "discover",
    "--repo-path",
    repoPath,
    "--output",
    output,
    "--lambda",
    "0.45",
  ]);

  const markdown = await readFile(output, "utf8");
  const logMarkdown = await readFile(logOutput, "utf8");
  assert.match(markdown, /^- Prefer durable behavior tests\.$/m);
  assert.doesNotMatch(markdown, /## Prefer durable behavior tests/);
  assert.doesNotMatch(markdown, /Review observable behavior/);
  assert.doesNotMatch(markdown, /New controllers must carry \[Authorize\]/);
  assert.doesNotMatch(markdown, /Lambda: `0.450`/);
  assert.match(logMarkdown, /Lambda: `0.450`/);
  assert.match(logMarkdown, /Review observable behavior/);
  assert.match(logMarkdown, /AGENTS\.md/);
  assert.doesNotMatch(logMarkdown, /guidelines\/GL008_security\.md/);
});
