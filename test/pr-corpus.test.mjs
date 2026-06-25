import assert from "node:assert/strict";
import test from "node:test";

import {
  chunkText,
  createPullRequestSources,
} from "../dist/pr-corpus.js";

function sampleInput(overrides = {}) {
  return {
    repository: {
      provider: "github",
      fullName: "acme/widgets",
      owner: "acme",
      name: "widgets",
    },
    pullRequest: {
      repoFullName: "acme/widgets",
      number: 42,
      url: "https://github.com/acme/widgets/pull/42",
      state: "open",
      title: "Retry failed uploads",
      body: "Adds retry handling for transient upload failures.",
    },
    sources: [],
    ...overrides,
  };
}

test("createPullRequestSources extracts title and body by default", () => {
  const sources = createPullRequestSources(sampleInput());

  assert.equal(sources.length, 2);
  assert.deepEqual(
    sources.map((source) => source.sourceKind),
    ["pr_title", "pr_body"],
  );
  assert.equal(sources[0].sourceId, "title");
  assert.equal(sources[0].text, "Retry failed uploads");
  assert.equal(sources[1].sourceId, "body");
  assert.equal(sources[1].text, "Adds retry handling for transient upload failures.");
  assert.match(sources[0].contentHash, /^[a-f0-9]{64}$/);
});

test("createPullRequestSources respects sourceKind filters", () => {
  const sources = createPullRequestSources(sampleInput(), ["pr_body"]);

  assert.equal(sources.length, 1);
  assert.equal(sources[0].sourceKind, "pr_body");
});

test("createPullRequestSources drops empty text sources", () => {
  const sources = createPullRequestSources(sampleInput({
    pullRequest: {
      ...sampleInput().pullRequest,
      body: "",
    },
  }));

  assert.deepEqual(
    sources.map((source) => source.sourceKind),
    ["pr_title"],
  );
});

test("chunkText splits long text with overlap", () => {
  const chunks = chunkText("abcdefghij", {
    maxCharacters: 4,
    overlapCharacters: 1,
  });

  assert.deepEqual(chunks, ["abcd", "defg", "ghij"]);
});
