import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createClient } from "@libsql/client";

import {
  chunkText,
  createPullRequestCorpus,
  createPullRequestSources,
} from "../dist/pr-corpus.js";
import {
  createPullRequestCorpus as createPullRequestCorpusFromIndex,
} from "../dist/index.js";

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

function fakeEmbeddings(dimensions = 3, model = `fake-${dimensions}`) {
  return {
    model,
    dimensions,
    async embedDocuments(texts) {
      return texts.map((text) => fakeVector(text, dimensions));
    },
    async embedQuery(text) {
      return fakeVector(text, dimensions);
    },
  };
}

function fakeVector(text, dimensions) {
  const values = Array.from({ length: dimensions }, () => 0);
  for (const char of text) {
    values[char.charCodeAt(0) % dimensions] += 1;
  }
  return values;
}

function localEmbeddingPrivacy(overrides = {}) {
  return { embeddingProviderLocation: "local", ...overrides };
}

async function tempCorpus(dimensions = 3) {
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const corpus = createPullRequestCorpus({
    database: { url: `file:${join(dir, "corpus.db")}` },
    embeddings: fakeEmbeddings(dimensions),
    privacy: localEmbeddingPrivacy(),
  });
  await corpus.initialize();
  return corpus;
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

test("public index exports core corpus API", () => {
  assert.equal(createPullRequestCorpusFromIndex, createPullRequestCorpus);
});

test("repository CRUD stores, lists, reads, and deletes repositories", async () => {
  const corpus = await tempCorpus();

  await corpus.upsertRepository({
    provider: "github",
    fullName: "acme/widgets",
    owner: "acme",
    name: "widgets",
    defaultBranch: "main",
  });

  assert.equal((await corpus.listRepositories()).length, 1);
  assert.equal((await corpus.getRepository("acme/widgets")).defaultBranch, "main");

  await corpus.deleteRepository("acme/widgets");
  assert.equal(await corpus.getRepository("acme/widgets"), undefined);
});

test("pull request CRUD stores, lists, reads, and deletes pull requests", async () => {
  const corpus = await tempCorpus();
  const input = sampleInput();

  await corpus.upsertPullRequest(input);

  const stored = await corpus.getPullRequest("acme/widgets", 42);
  assert.equal(stored.title, "Retry failed uploads");
  assert.equal((await corpus.listPullRequests("acme/widgets")).length, 1);

  await corpus.deletePullRequest("acme/widgets", 42);
  assert.equal(await corpus.getPullRequest("acme/widgets", 42), undefined);
});

test("listPullRequests state closed includes merged pull requests", async () => {
  const corpus = await tempCorpus();
  const closedPr = sampleInput({
    pullRequest: {
      ...sampleInput().pullRequest,
      number: 41,
      url: "https://github.com/acme/widgets/pull/41",
      state: "closed",
      closedAt: "2026-01-03T00:00:00Z",
    },
  });
  const mergedPr = sampleInput({
    pullRequest: {
      ...sampleInput().pullRequest,
      number: 42,
      url: "https://github.com/acme/widgets/pull/42",
      state: "merged",
      mergedAt: "2026-01-03T00:00:00Z",
      closedAt: "2026-01-03T00:00:00Z",
    },
  });
  const openPr = sampleInput({
    pullRequest: {
      ...sampleInput().pullRequest,
      number: 43,
      url: "https://github.com/acme/widgets/pull/43",
      state: "open",
    },
  });

  await corpus.upsertPullRequest(closedPr);
  await corpus.upsertPullRequest(mergedPr);
  await corpus.upsertPullRequest(openPr);

  const listed = await corpus.listPullRequests("acme/widgets", { state: "closed" });

  assert.deepEqual(listed.map((pr) => pr.number), [41, 42]);
  assert.deepEqual(listed.map((pr) => pr.state), ["closed", "merged"]);
});

test("deleteRepository cascades pull requests", async () => {
  const corpus = await tempCorpus();

  await corpus.upsertPullRequest(sampleInput());
  await corpus.deleteRepository("acme/widgets");

  assert.equal(await corpus.getPullRequest("acme/widgets", 42), undefined);
});

test("schema-only initialize does not write embedding dimension metadata", async () => {
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const database = { url: `file:${join(dir, "corpus.db")}` };
  const corpus = createPullRequestCorpus({ database });

  await corpus.initialize();

  const client = createClient(database);
  const metadata = await client.execute(
    "SELECT key FROM corpus_metadata WHERE key = 'embedding_dimensions'",
  );
  assert.equal(metadata.rows.length, 0);
});

test("remote database detection rejects all remote URL schemes without explicit opt-in", () => {
  for (const url of [
    "https://example.test/corpus",
    "wss://example.test/corpus",
    "libsql://example.turso.io",
    "turso://example",
    "http://example.test/corpus",
    "ws://example.test/corpus",
  ]) {
    assert.throws(
      () => createPullRequestCorpus({ database: { url }, privacy: { warn() {} } }),
      /allowRemoteDatabase/,
    );
  }
});

test("remote database detection rejects cleartext http and ws after remote opt-in without insecure override", () => {
  assert.throws(
    () => createPullRequestCorpus({
      database: { url: "http://example.test/corpus" },
      privacy: { allowRemoteDatabase: true, warn() {} },
    }),
    /allowInsecureRemoteDatabase/,
  );
  assert.throws(
    () => createPullRequestCorpus({
      database: { url: "ws://example.test/corpus" },
      privacy: { allowRemoteDatabase: true, warn() {} },
    }),
    /allowInsecureRemoteDatabase/,
  );
});

test("remote database detection warns only after explicit remote opt-in", () => {
  for (const url of [
    "https://example.test/corpus",
    "wss://example.test/corpus",
    "libsql://example.turso.io",
    "turso://example",
    "http://example.test/corpus",
    "ws://example.test/corpus",
  ]) {
    const warnings = [];
    createPullRequestCorpus({
      database: { url },
      privacy: {
        allowRemoteDatabase: true,
        allowInsecureRemoteDatabase: url.startsWith("http:") || url.startsWith("ws:"),
        warn(message) {
          warnings.push(message);
        },
      },
    });
    assert.equal(warnings.length, 1);
  }
});

test("database options reject unknown keys before creating the libSQL client", () => {
  assert.throws(
    () => createPullRequestCorpus({
      database: { url: "file:corpus.db", syncUrl: "https://example.test/sync" },
      privacy: localEmbeddingPrivacy(),
    }),
    /Unknown database option keys: syncUrl/,
  );
});

test("embedding provider location must be local or explicitly acknowledged", () => {
  assert.throws(
    () => createPullRequestCorpus({
      database: { url: "file:corpus.db" },
      embeddings: fakeEmbeddings(),
    }),
    /allowThirdPartyEmbeddingProvider|embeddingProviderLocation/,
  );

  assert.doesNotThrow(() => createPullRequestCorpus({
    database: { url: "file:corpus.db" },
    embeddings: fakeEmbeddings(),
    privacy: {
      embeddingProviderLocation: "third_party",
      allowThirdPartyEmbeddingProvider: true,
    },
  }));
});
