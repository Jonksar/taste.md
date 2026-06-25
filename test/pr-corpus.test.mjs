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

function fakePullRequestSource(inputs) {
  return {
    async *listPullRequests(repoFullName) {
      for (const input of inputs) {
        if (input.repository.fullName === repoFullName) yield input;
      }
    },
  };
}

async function tempCorpusWithSource(inputs, dimensions = 3) {
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const database = { url: `file:${join(dir, "corpus.db")}` };
  const corpus = createPullRequestCorpus({
    database,
    embeddings: fakeEmbeddings(dimensions),
    github: fakePullRequestSource(inputs),
    privacy: localEmbeddingPrivacy(),
  });
  await corpus.initialize();
  return { corpus, database };
}

test("indexRepository stores PR metadata and indexes title and body sources", async () => {
  const { corpus } = await tempCorpusWithSource([sampleInput()]);

  const result = await corpus.indexRepository("acme/widgets");

  assert.equal(result.repositories, 1);
  assert.equal(result.pullRequestsSeen, 1);
  assert.equal(result.pullRequestsIndexed, 1);
  assert.equal(result.sourcesIndexed, 2);
  assert.equal(result.failures.length, 0);
  assert.equal((await corpus.listPullRequests("acme/widgets")).length, 1);
});

test("indexRepository upserts an empty repository before paging", async () => {
  const { corpus } = await tempCorpusWithSource([]);

  const result = await corpus.indexRepository("acme/empty");
  const repository = await corpus.getRepository("acme/empty");

  assert.equal(result.repositories, 1);
  assert.equal(result.pullRequestsSeen, 0);
  assert.equal((await corpus.listRepositories()).length, 1);
  assert.equal(repository?.fullName, "acme/empty");
  assert.equal(repository?.owner, "acme");
  assert.equal(repository?.name, "empty");
});

test("indexRepository skips unchanged sources on repeated runs", async () => {
  const { corpus } = await tempCorpusWithSource([sampleInput()]);

  await corpus.indexRepository("acme/widgets");
  const second = await corpus.indexRepository("acme/widgets");

  assert.equal(second.pullRequestsSeen, 1);
  assert.equal(second.pullRequestsIndexed, 0);
  assert.equal(second.skippedUnchanged, 2);
});

test("indexRepository filters source kinds", async () => {
  const { corpus, database } = await tempCorpusWithSource([sampleInput()]);

  await corpus.indexRepository("acme/widgets");
  const result = await corpus.indexRepository("acme/widgets", {
    sourceKinds: ["pr_body"],
  });
  const client = createClient(database);
  const remainingSources = await client.execute(
    "SELECT source_kind FROM pr_sources WHERE repo_full_name = ? AND pr_number = ? ORDER BY source_kind",
    ["acme/widgets", 42],
  );
  const remainingChunks = await client.execute(
    "SELECT source_kind FROM pr_source_chunks WHERE repo_full_name = ? AND pr_number = ? ORDER BY source_kind, chunk_index",
    ["acme/widgets", 42],
  );

  assert.equal(result.sourcesIndexed, 0);
  assert.equal(result.skippedUnchanged, 1);
  assert.deepEqual(
    remainingSources.rows.map((row) => row.source_kind),
    ["pr_body"],
  );
  assert.deepEqual(
    remainingChunks.rows.map((row) => row.source_kind),
    ["pr_body"],
  );
});

test("indexRepository enforces maxPullRequests even when the source yields more", async () => {
  const inputs = Array.from({ length: 4 }, (_, index) => {
    const number = index + 1;
    return sampleInput({
      pullRequest: {
        ...sampleInput().pullRequest,
        number,
        url: `https://github.com/acme/widgets/pull/${number}`,
        title: `Change ${number}`,
        body: `Body ${number}`,
      },
    });
  });
  const { corpus } = await tempCorpusWithSource(inputs);

  const result = await corpus.indexRepository("acme/widgets", { maxPullRequests: 2 });

  assert.equal(result.pullRequestsSeen, 2);
  assert.equal(result.pullRequestsIndexed, 2);
  assert.equal((await corpus.listPullRequests("acme/widgets")).length, 2);
  assert.equal(await corpus.getPullRequest("acme/widgets", 3), undefined);
});

test("indexRepository with since skips older normalized pull requests", async () => {
  const oldPr = sampleInput({
    pullRequest: {
      ...sampleInput().pullRequest,
      number: 41,
      url: "https://github.com/acme/widgets/pull/41",
      title: "Older change",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  });
  const newPr = sampleInput({
    pullRequest: {
      ...sampleInput().pullRequest,
      number: 43,
      url: "https://github.com/acme/widgets/pull/43",
      title: "Newer change",
      updatedAt: "2026-02-01T00:00:00.000Z",
    },
  });
  const { corpus } = await tempCorpusWithSource([oldPr, newPr]);

  const result = await corpus.indexRepository("acme/widgets", {
    since: "2026-01-15T00:00:00.000Z",
  });

  assert.equal(result.pullRequestsSeen, 1);
  assert.equal(await corpus.getPullRequest("acme/widgets", 41), undefined);
  assert.equal((await corpus.getPullRequest("acme/widgets", 43))?.number, 43);
});

test("indexRepositories continues after one repo fails", async () => {
  const source = {
    async *listPullRequests(repoFullName) {
      if (repoFullName === "acme/broken") throw new Error("gh failed");
      yield sampleInput();
    },
  };
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const corpus = createPullRequestCorpus({
    database: { url: `file:${join(dir, "corpus.db")}` },
    embeddings: fakeEmbeddings(),
    github: source,
    privacy: localEmbeddingPrivacy(),
  });
  await corpus.initialize();

  const result = await corpus.indexRepositories({
    repositories: ["acme/broken", "acme/widgets"],
  });

  assert.equal(result.repositories, 1);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].stage, "github");
});

test("indexRepository upserts but does not count a repository when GitHub paging fails", async () => {
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const corpus = createPullRequestCorpus({
    database: { url: `file:${join(dir, "corpus.db")}` },
    embeddings: fakeEmbeddings(),
    github: {
      async *listPullRequests() {
        throw new Error("gh failed");
      },
    },
    privacy: localEmbeddingPrivacy(),
  });
  await corpus.initialize();

  const result = await corpus.indexRepository("acme/broken");

  assert.equal(result.repositories, 0);
  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].stage, "github");
  assert.equal((await corpus.getRepository("acme/broken"))?.fullName, "acme/broken");
});

test("indexRepository does not persist PR metadata when embedding fails", async () => {
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const corpus = createPullRequestCorpus({
    database: { url: `file:${join(dir, "corpus.db")}` },
    embeddings: {
      ...fakeEmbeddings(),
      async embedDocuments() {
        throw new Error("embedding failed");
      },
    },
    github: fakePullRequestSource([sampleInput()]),
    privacy: localEmbeddingPrivacy(),
  });
  await corpus.initialize();

  const result = await corpus.indexRepository("acme/widgets");

  assert.equal(result.failures.length, 1);
  assert.equal(result.failures[0].stage, "embedding");
  assert.equal(await corpus.getPullRequest("acme/widgets", 42), undefined);
});

test("indexRepository filters source text before embedding", async () => {
  const embeddedTexts = [];
  const secretInput = sampleInput({
    pullRequest: {
      ...sampleInput().pullRequest,
      title: "secret-token title",
      body: "contains secret-token",
    },
  });
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const corpus = createPullRequestCorpus({
    database: { url: `file:${join(dir, "corpus.db")}` },
    embeddings: {
      ...fakeEmbeddings(),
      async embedDocuments(texts) {
        embeddedTexts.push(...texts);
        return texts.map((text) => fakeVector(text, 3));
      },
    },
    github: fakePullRequestSource([secretInput]),
    privacy: localEmbeddingPrivacy({
      sourceTextFilter(text) {
        return text.replaceAll("secret-token", "[redacted]");
      },
    }),
  });
  await corpus.initialize();

  await corpus.indexRepository("acme/widgets");

  const stored = await corpus.getPullRequest("acme/widgets", 42);
  const listed = await corpus.listPullRequests("acme/widgets");
  assert.equal(embeddedTexts.some((text) => text.includes("secret-token")), false);
  assert.equal(embeddedTexts.some((text) => text.includes("[redacted]")), true);
  assert.equal(JSON.stringify(stored).includes("secret-token"), false);
  assert.equal(JSON.stringify(listed).includes("secret-token"), false);
  assert.equal(JSON.stringify(stored).includes("[redacted]"), true);
});

test("indexRepository batches all changed source chunks for one PR in one embedding call", async () => {
  const embeddingBatches = [];
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const corpus = createPullRequestCorpus({
    database: { url: `file:${join(dir, "corpus.db")}` },
    embeddings: {
      ...fakeEmbeddings(),
      async embedDocuments(texts) {
        embeddingBatches.push([...texts]);
        return texts.map((text) => fakeVector(text, 3));
      },
    },
    github: fakePullRequestSource([sampleInput()]),
    privacy: localEmbeddingPrivacy(),
  });
  await corpus.initialize();

  const result = await corpus.indexRepository("acme/widgets");

  assert.equal(result.sourcesIndexed, 2);
  assert.equal(embeddingBatches.length, 1);
  assert.deepEqual(embeddingBatches[0], [
    "Retry failed uploads",
    "Adds retry handling for transient upload failures.",
  ]);
});

test("sourceTextFilter receives a frozen source clone and cannot rewrite stored source identity", async () => {
  let sawFrozenSource = false;
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const database = { url: `file:${join(dir, "corpus.db")}` };
  const corpus = createPullRequestCorpus({
    database,
    embeddings: fakeEmbeddings(),
    github: fakePullRequestSource([sampleInput()]),
    privacy: localEmbeddingPrivacy({
      sourceTextFilter(text, source) {
        sawFrozenSource ||= Object.isFrozen(source);
        try {
          source.repoFullName = "evil/repo";
          source.prNumber = 999;
          source.sourceKind = "changed_file";
          source.sourceId = "changed";
        } catch {
          // Frozen sources throw under ESM strict mode.
        }
        return text.replaceAll("Retry", "Retried");
      },
    }),
  });
  await corpus.initialize();

  await corpus.indexRepository("acme/widgets");
  const stored = await corpus.getPullRequest("acme/widgets", 42);
  const client = createClient(database);
  const sources = await client.execute(
    "SELECT repo_full_name, pr_number, source_kind, source_id, text FROM pr_sources ORDER BY source_kind, source_id",
  );

  assert.equal(sawFrozenSource, true);
  assert.equal(stored?.title.includes("Retried"), true);
  assert.equal(sources.rows.some((row) => row.repo_full_name === "evil/repo"), false);
  assert.equal(sources.rows.some((row) => row.pr_number === 999), false);
  assert.equal(sources.rows.some((row) => row.source_kind === "changed_file"), false);
  assert.equal(sources.rows.some((row) => (
    row.repo_full_name === "acme/widgets"
    && row.pr_number === 42
    && row.source_kind === "pr_title"
    && String(row.text).includes("Retried")
  )), true);
});

test("indexRepository re-embeds unchanged content when embedding model changes", async () => {
  const dir = await mkdtemp(join(tmpdir(), "taste-corpus-"));
  const database = { url: `file:${join(dir, "corpus.db")}` };
  const first = createPullRequestCorpus({
    database,
    embeddings: fakeEmbeddings(3, "fake-a"),
    github: fakePullRequestSource([sampleInput()]),
    privacy: localEmbeddingPrivacy(),
  });
  await first.initialize();
  await first.indexRepository("acme/widgets");

  let embedCalls = 0;
  const second = createPullRequestCorpus({
    database,
    embeddings: {
      ...fakeEmbeddings(3, "fake-b"),
      async embedDocuments(texts) {
        embedCalls += 1;
        return texts.map((text) => fakeVector(text, 3));
      },
    },
    github: fakePullRequestSource([sampleInput()]),
    privacy: localEmbeddingPrivacy(),
  });
  await second.initialize();

  const result = await second.indexRepository("acme/widgets");

  assert.equal(result.sourcesIndexed, 2);
  assert.equal(embedCalls > 0, true);
});
