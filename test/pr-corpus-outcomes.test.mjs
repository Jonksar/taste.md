import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { createPullRequestCorpus } from "../dist/pr-corpus.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, "fixtures", "pr-corpus-outcomes.json");

const OUTCOME_CASES = [
  {
    sentence: "turn-runner architecture search finds the Fire assistant runner PR",
    query: "ai agent code architecture turn runner",
    expected: {
      repoFullName: "iter8-ai/fire",
      prNumber: 553,
      prUrl: "https://github.com/iter8-ai/fire/pull/553",
    },
  },
  {
    sentence: "ToolLoopAgent testing search finds the Vercel AI docs PR",
    query: "tool loop agent testing examples generate stream",
    expected: {
      repoFullName: "vercel/ai",
      prNumber: 14476,
      prUrl: "https://github.com/vercel/ai/pull/14476",
    },
  },
  {
    sentence: "OpenCode MCP host setup search finds the GitHub MCP server guide PR",
    query: "opencode mcp host installation tool gating config",
    expected: {
      repoFullName: "github/github-mcp-server",
      prNumber: 2535,
      prUrl: "https://github.com/github/github-mcp-server/pull/2535",
    },
  },
  {
    sentence: "local agent profile search finds the Continue profile-name PR",
    query: "local agent profile yaml selector fallback",
    expected: {
      repoFullName: "continuedev/continue",
      prNumber: 12427,
      prUrl: "https://github.com/continuedev/continue/pull/12427",
    },
  },
  {
    sentence: "Turso vector persistence search finds the vector64 VACUUM PR",
    query: "turso vacuum vector64 vector distance arrays blobs",
    expected: {
      repoFullName: "tursodatabase/turso",
      prNumber: 6777,
      prUrl: "https://github.com/tursodatabase/turso/pull/6777",
    },
  },
];

const VOCABULARY = [
  "agent",
  "assistant",
  "turn",
  "runner",
  "lifecycle",
  "architecture",
  "service",
  "tool",
  "loop",
  "testing",
  "examples",
  "generate",
  "stream",
  "mcp",
  "opencode",
  "zed",
  "installation",
  "config",
  "profile",
  "yaml",
  "selector",
  "fallback",
  "vacuum",
  "vector64",
  "vector",
  "distance",
  "arrays",
  "blobs",
  "qdrant",
  "prompt",
  "scoping",
  "__other__",
];

function normalize(text) {
  return text
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function semanticVector(text) {
  const normalized = normalize(text);
  const values = VOCABULARY.map((term) => {
    if (term === "__other__") return 0;
    return new RegExp(`\\b${term}\\b`).test(normalized) ? 1 : 0;
  });
  if (values.every((value) => value === 0)) {
    values[values.length - 1] = 1;
  }
  return values;
}

function localSemanticEmbeddings() {
  return {
    model: "local-outcome-keyword-v1",
    dimensions: VOCABULARY.length,
    async embedDocuments(texts) {
      return texts.map((text) => semanticVector(text));
    },
    async embedQuery(text) {
      return semanticVector(text);
    },
  };
}

async function loadOutcomeCorpusInputs() {
  return JSON.parse(await readFile(FIXTURE_PATH, "utf8"));
}

function fixturePullRequestSource(inputs) {
  return {
    async *listPullRequests(repoFullName) {
      for (const input of inputs) {
        if (input.repository.fullName === repoFullName) yield input;
      }
    },
  };
}

async function createIndexedOutcomeCorpus() {
  const inputs = await loadOutcomeCorpusInputs();
  const dir = await mkdtemp(join(tmpdir(), "taste-outcome-corpus-"));
  const corpus = createPullRequestCorpus({
    database: { url: `file:${join(dir, "corpus.db")}` },
    embeddings: localSemanticEmbeddings(),
    github: fixturePullRequestSource(inputs),
    privacy: { embeddingProviderLocation: "local" },
  });
  await corpus.initialize();

  const repositories = inputs.map((input) => input.repository.fullName);
  const result = await corpus.indexRepositories({
    repositories,
    sourceKinds: ["pr_title", "pr_body"],
  });

  assert.equal(result.failures.length, 0);
  assert.equal(result.repositories, 10);
  assert.equal(result.pullRequestsSeen, 10);
  return corpus;
}

test("When a user searches a 10-repo PR corpus, semantic PR search returns expected prior-work PRs", async (t) => {
  const corpus = await createIndexedOutcomeCorpus();

  for (const outcomeCase of OUTCOME_CASES) {
    await t.test(outcomeCase.sentence, async () => {
      const matches = await corpus.searchPullRequests({
        query: outcomeCase.query,
        sourceKinds: ["pr_title", "pr_body"],
        limit: 5,
      });

      assert.equal(matches.length > 0, true);
      assert.equal(matches[0].repoFullName, outcomeCase.expected.repoFullName);
      assert.equal(matches[0].prNumber, outcomeCase.expected.prNumber);
      assert.equal(matches[0].prUrl, outcomeCase.expected.prUrl);
    });
  }
});
