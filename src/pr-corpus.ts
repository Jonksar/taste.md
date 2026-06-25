import { createHash } from "node:crypto";
import { emitWarning } from "node:process";

import {
  createClient,
  type Client,
  type InArgs,
  type InStatement,
} from "@libsql/client";

export const PULL_REQUEST_SOURCE_KINDS = [
  "pr_title",
  "pr_body",
  "issue_comment",
  "review_comment",
  "review_body",
  "commit_message",
  "changed_file",
] as const;

export type PullRequestSourceKind = (typeof PULL_REQUEST_SOURCE_KINDS)[number];

export interface RepositoryRecord {
  provider: "github";
  fullName: string;
  owner: string;
  name: string;
  defaultBranch?: string;
  isArchived?: boolean;
  indexedAt?: string;
}

export interface PullRequestRecord {
  repoFullName: string;
  number: number;
  githubId?: number;
  nodeId?: string;
  url: string;
  state: "open" | "closed" | "merged";
  title: string;
  body: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  mergedAt?: string;
  closedAt?: string;
}

export interface PullRequestSourceDocument {
  repoFullName: string;
  prNumber: number;
  sourceKind: PullRequestSourceKind;
  sourceId: string;
  sourceUrl?: string;
  text: string;
  contentHash: string;
  updatedAt?: string;
}

export interface PullRequestCorpusInput {
  repository: RepositoryRecord;
  pullRequest: PullRequestRecord;
  sources: PullRequestSourceDocument[];
}

export interface SemanticPullRequestMatch {
  score: number;
  repoFullName: string;
  prNumber: number;
  prUrl: string;
  title: string;
  sourceKind: PullRequestSourceKind;
  sourceText: string;
  sourceUrl?: string;
  chunkIndex: number;
}

export interface EmbeddingProvider {
  model: string;
  dimensions: number;
  embedDocuments(texts: string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

export interface ChunkingOptions {
  maxCharacters?: number;
  overlapCharacters?: number;
}

export interface TursoDatabaseOptions {
  url: string;
  authToken?: string;
}

export interface PullRequestListOptions {
  state?: "open" | "closed" | "all";
  since?: string;
  limit?: number;
}

export interface GitHubPullRequestListOptions {
  state?: "open" | "closed" | "all";
  since?: string;
  pageSize?: number;
  maxPullRequests?: number;
}

export interface IndexRepositoryOptions {
  state?: "open" | "closed" | "all";
  since?: string;
  pageSize?: number;
  maxPullRequests?: number;
  sourceKinds?: PullRequestSourceKind[];
}

export interface IndexRepositoriesOptions extends IndexRepositoryOptions {
  repositories: string[];
}

export interface SemanticSearchQuery {
  query: string;
  repositories?: string[];
  sourceKinds?: PullRequestSourceKind[];
  limit?: number;
  minScore?: number;
}

export interface IndexingFailure {
  repoFullName: string;
  prNumber?: number;
  sourceKind?: PullRequestSourceKind;
  sourceId?: string;
  stage: "github" | "embedding" | "database";
  message: string;
}

export interface IndexingResult {
  repositories: number;
  pullRequestsSeen: number;
  pullRequestsIndexed: number;
  sourcesIndexed: number;
  chunksIndexed: number;
  skippedUnchanged: number;
  failures: IndexingFailure[];
}

export interface GitHubPullRequestSource {
  listPullRequests(
    repoFullName: string,
    options: GitHubPullRequestListOptions,
  ): AsyncIterable<PullRequestCorpusInput>;
}

export type SourceTextFilter = (
  text: string,
  source: Readonly<PullRequestSourceDocument>,
) => string | undefined;

export interface CorpusPrivacyOptions {
  sourceTextFilter?: SourceTextFilter;
  embeddingProviderLocation?: "local" | "third_party";
  allowRemoteDatabase?: boolean;
  allowInsecureRemoteDatabase?: boolean;
  allowThirdPartyEmbeddingProvider?: boolean;
  warn?: (message: string) => void;
}

export interface PullRequestCorpus {
  initialize(): Promise<void>;
  upsertRepository(repo: RepositoryRecord): Promise<RepositoryRecord>;
  getRepository(fullName: string): Promise<RepositoryRecord | undefined>;
  listRepositories(): Promise<RepositoryRecord[]>;
  deleteRepository(fullName: string): Promise<void>;
  upsertPullRequest(input: PullRequestCorpusInput): Promise<PullRequestRecord>;
  getPullRequest(repoFullName: string, prNumber: number): Promise<PullRequestRecord | undefined>;
  listPullRequests(repoFullName: string, options?: PullRequestListOptions): Promise<PullRequestRecord[]>;
  deletePullRequest(repoFullName: string, prNumber: number): Promise<void>;
  indexRepository(fullName: string, options?: IndexRepositoryOptions): Promise<IndexingResult>;
  indexRepositories(options: IndexRepositoriesOptions): Promise<IndexingResult>;
  searchPullRequests(query: SemanticSearchQuery): Promise<SemanticPullRequestMatch[]>;
}

export interface CreatePullRequestCorpusOptions {
  database: TursoDatabaseOptions;
  embeddings?: EmbeddingProvider;
  github?: GitHubPullRequestSource;
  chunking?: ChunkingOptions;
  privacy?: CorpusPrivacyOptions;
}

type PullRequestMetadataField = "title" | "body";

interface PullRequestSourceDefinition {
  sourceKind: Extract<PullRequestSourceKind, "pr_title" | "pr_body">;
  sourceId: string;
  pullRequestField: PullRequestMetadataField;
}

interface CorpusSqlExecutor {
  execute(statement: InStatement): ReturnType<Client["execute"]>;
}

const PR_METADATA_SOURCE_DEFINITIONS: readonly PullRequestSourceDefinition[] = [
  { sourceKind: "pr_title", sourceId: "title", pullRequestField: "title" },
  { sourceKind: "pr_body", sourceId: "body", pullRequestField: "body" },
];
const PR_METADATA_FIELD_BY_KIND = new Map(
  PR_METADATA_SOURCE_DEFINITIONS.map((definition) => [
    definition.sourceKind,
    definition.pullRequestField,
  ]),
);
const DEFAULT_SOURCE_KINDS: PullRequestSourceKind[] = ["pr_title", "pr_body"];
const DEFAULT_CHUNK_MAX_CHARACTERS = 1200;
const DEFAULT_CHUNK_OVERLAP_CHARACTERS = 120;
const MAX_CHUNK_CHARACTERS = 8000;
const MAX_CHUNKS_PER_SOURCE = 100;
const MAX_QUERY_LIMIT = 100;
const MAX_SEARCH_QUERY_CHARACTERS = 2000;
const MAX_SEARCH_REPOSITORIES = 50;
const MAX_SEARCH_SOURCE_KINDS = PULL_REQUEST_SOURCE_KINDS.length;
const MAX_PAGE_SIZE = 100;
const MAX_TOTAL_PULL_REQUESTS_PER_REPOSITORY = 5000;
const PULL_REQUEST_SOURCE_KIND_SET = new Set<string>(PULL_REQUEST_SOURCE_KINDS);
const CONTROL_CHARACTER_PATTERN = /[\x00-\x1F\x7F]/;
const REPO_FULL_NAME_PATTERN =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/(?!\.{1,2}$)[A-Za-z0-9._-]+$/;

export function createPullRequestSources(
  input: PullRequestCorpusInput,
  sourceKinds: PullRequestSourceKind[] = DEFAULT_SOURCE_KINDS,
): PullRequestSourceDocument[] {
  const selected = new Set(sourceKinds);
  const sources: PullRequestSourceDocument[] = [];

  for (const definition of PR_METADATA_SOURCE_DEFINITIONS) {
    if (!selected.has(definition.sourceKind)) continue;

    const text = input.pullRequest[definition.pullRequestField].trim();
    if (!text) continue;

    sources.push({
      repoFullName: input.pullRequest.repoFullName,
      prNumber: input.pullRequest.number,
      sourceKind: definition.sourceKind,
      sourceId: definition.sourceId,
      sourceUrl: input.pullRequest.url,
      text,
      contentHash: hashText(text),
      updatedAt: input.pullRequest.updatedAt,
    });
  }

  return sources;
}

export function createPullRequestCorpus(
  options: CreatePullRequestCorpusOptions,
): PullRequestCorpus {
  return new LibsqlPullRequestCorpus(options);
}

class LibsqlPullRequestCorpus implements PullRequestCorpus {
  private readonly client: Client;
  private readonly embeddings: EmbeddingProvider | undefined;
  private readonly github: GitHubPullRequestSource | undefined;
  private readonly chunking: ChunkingOptions;
  private readonly privacy: Required<Pick<CorpusPrivacyOptions, "sourceTextFilter" | "warn">> &
    CorpusPrivacyOptions;

  constructor(options: CreatePullRequestCorpusOptions) {
    if (options.embeddings) {
      assertPositiveInteger(options.embeddings.dimensions, "embeddings.dimensions");
    }
    const database = sanitizeDatabaseOptions(options.database);
    assertPrivacyBoundary({ ...options, database });
    this.client = createClient(database);
    this.embeddings = options.embeddings;
    this.github = options.github;
    this.chunking = options.chunking ?? {};
    this.privacy = {
      ...options.privacy,
      sourceTextFilter: options.privacy?.sourceTextFilter ?? ((text) => text),
      warn: options.privacy?.warn ?? ((message) => emitWarning(message)),
    };
  }

  async initialize(): Promise<void> {
    await this.client.execute("PRAGMA foreign_keys = ON");
    await this.client.batch(
      [
        `CREATE TABLE IF NOT EXISTS corpus_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS repositories (
          full_name TEXT PRIMARY KEY,
          provider TEXT NOT NULL,
          owner TEXT NOT NULL,
          name TEXT NOT NULL,
          default_branch TEXT,
          is_archived INTEGER NOT NULL DEFAULT 0,
          indexed_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS pull_requests (
          repo_full_name TEXT NOT NULL,
          number INTEGER NOT NULL,
          github_id INTEGER,
          node_id TEXT,
          url TEXT NOT NULL,
          state TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          author TEXT,
          created_at TEXT,
          updated_at TEXT,
          merged_at TEXT,
          closed_at TEXT,
          PRIMARY KEY (repo_full_name, number),
          FOREIGN KEY (repo_full_name) REFERENCES repositories(full_name) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS pr_sources (
          repo_full_name TEXT NOT NULL,
          pr_number INTEGER NOT NULL,
          source_kind TEXT NOT NULL,
          source_id TEXT NOT NULL,
          source_url TEXT,
          text TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          updated_at TEXT,
          PRIMARY KEY (repo_full_name, pr_number, source_kind, source_id),
          FOREIGN KEY (repo_full_name, pr_number) REFERENCES pull_requests(repo_full_name, number) ON DELETE CASCADE
        )`,
      ],
      "write",
    );

    if (this.embeddings) {
      await this.initializeEmbeddingSchema(this.embeddings);
    }
  }

  async upsertRepository(repo: RepositoryRecord): Promise<RepositoryRecord> {
    assertValidRepoFullName(repo.fullName);
    await executeUpsertRepository(this.client, repo);
    return repo;
  }

  async getRepository(fullName: string): Promise<RepositoryRecord | undefined> {
    assertValidRepoFullName(fullName);
    const result = await this.client.execute({
      sql: "SELECT * FROM repositories WHERE full_name = ?",
      args: [fullName],
    });
    const row = result.rows[0];
    return row ? repositoryFromRow(row as Record<string, unknown>) : undefined;
  }

  async listRepositories(): Promise<RepositoryRecord[]> {
    const result = await this.client.execute(
      "SELECT * FROM repositories ORDER BY full_name",
    );
    return result.rows.map((row) => repositoryFromRow(row as Record<string, unknown>));
  }

  async deleteRepository(fullName: string): Promise<void> {
    assertValidRepoFullName(fullName);
    await this.client.execute({
      sql: "DELETE FROM repositories WHERE full_name = ?",
      args: [fullName],
    });
  }

  async upsertPullRequest(input: PullRequestCorpusInput): Promise<PullRequestRecord> {
    assertValidRepoFullName(input.pullRequest.repoFullName);
    if (input.repository.fullName !== input.pullRequest.repoFullName) {
      throw new Error("Repository fullName must match pullRequest repoFullName.");
    }
    await this.upsertRepository(input.repository);
    const { pullRequest: pr } = this.preparePullRequestSourceSet(input, ["pr_title", "pr_body"]);
    await executeUpsertPullRequest(this.client, pr);
    return pr;
  }

  async getPullRequest(
    repoFullName: string,
    prNumber: number,
  ): Promise<PullRequestRecord | undefined> {
    assertValidRepoFullName(repoFullName);
    const result = await this.client.execute({
      sql: "SELECT * FROM pull_requests WHERE repo_full_name = ? AND number = ?",
      args: [repoFullName, prNumber],
    });
    const row = result.rows[0];
    return row ? pullRequestFromRow(row as Record<string, unknown>) : undefined;
  }

  async listPullRequests(
    repoFullName: string,
    options: PullRequestListOptions = {},
  ): Promise<PullRequestRecord[]> {
    assertValidRepoFullName(repoFullName);
    const args: InArgs = [repoFullName];
    let sql = "SELECT * FROM pull_requests WHERE repo_full_name = ?";
    if (options.state === "closed") {
      sql += " AND state IN ('closed', 'merged')";
    } else if (options.state && options.state !== "all") {
      sql += " AND state = ?";
      args.push(options.state);
    }
    if (options.since) {
      sql += " AND updated_at >= ?";
      args.push(options.since);
    }
    sql += " ORDER BY number LIMIT ?";
    args.push(boundedLimit(options.limit, MAX_QUERY_LIMIT));
    const result = await this.client.execute({ sql, args });
    return result.rows.map((row) => pullRequestFromRow(row as Record<string, unknown>));
  }

  async deletePullRequest(repoFullName: string, prNumber: number): Promise<void> {
    assertValidRepoFullName(repoFullName);
    await this.client.execute({
      sql: "DELETE FROM pull_requests WHERE repo_full_name = ? AND number = ?",
      args: [repoFullName, prNumber],
    });
  }

  async indexRepository(
    _fullName: string,
    _options: IndexRepositoryOptions = {},
  ): Promise<IndexingResult> {
    void this.github;
    void this.chunking;
    throw new Error("indexRepository is not implemented until Task 3.");
  }

  async indexRepositories(_options: IndexRepositoriesOptions): Promise<IndexingResult> {
    throw new Error("indexRepositories is not implemented until Task 3.");
  }

  async searchPullRequests(
    _query: SemanticSearchQuery,
  ): Promise<SemanticPullRequestMatch[]> {
    throw new Error("searchPullRequests is not implemented until Task 4.");
  }

  private preparePullRequestSourceSet(
    input: PullRequestCorpusInput,
    sourceKinds: PullRequestSourceKind[] = DEFAULT_SOURCE_KINDS,
  ): {
    pullRequest: PullRequestRecord;
    sources: PullRequestSourceDocument[];
  } {
    const selected = new Set(sourceKinds);
    const filteredTextByField = new Map<PullRequestMetadataField, string>();
    const sources: PullRequestSourceDocument[] = [];

    for (const rawSource of createPullRequestSources(input, ["pr_title", "pr_body"])) {
      const filtered = this.filterSourceText(rawSource);
      const field = PR_METADATA_FIELD_BY_KIND.get(
        rawSource.sourceKind as Extract<PullRequestSourceKind, "pr_title" | "pr_body">,
      );
      if (filtered && field) {
        filteredTextByField.set(field, filtered.text);
      }
      if (filtered && selected.has(rawSource.sourceKind)) {
        sources.push(filtered);
      }
    }

    return {
      pullRequest: {
        ...input.pullRequest,
        title: filteredTextByField.get("title") ?? "",
        body: filteredTextByField.get("body") ?? "",
      },
      sources,
    };
  }

  private filterSourceText(
    source: PullRequestSourceDocument,
  ): PullRequestSourceDocument | undefined {
    const identitySnapshot = {
      repoFullName: source.repoFullName,
      prNumber: source.prNumber,
      sourceKind: source.sourceKind,
      sourceId: source.sourceId,
      sourceUrl: source.sourceUrl,
      updatedAt: source.updatedAt,
    };
    const hookSource = Object.freeze({
      ...identitySnapshot,
      text: source.text,
      contentHash: source.contentHash,
    });
    const filteredText = this.privacy.sourceTextFilter(source.text, hookSource);
    if (filteredText === undefined) {
      return undefined;
    }

    const text = filteredText.trim();
    if (!text) {
      return undefined;
    }

    return {
      ...identitySnapshot,
      text,
      contentHash: hashText(text),
    };
  }

  private async initializeEmbeddingSchema(embeddings: EmbeddingProvider): Promise<void> {
    await this.client.batch(
      [
        `CREATE TABLE IF NOT EXISTS pr_source_chunks (
          id TEXT PRIMARY KEY,
          repo_full_name TEXT NOT NULL,
          pr_number INTEGER NOT NULL,
          source_kind TEXT NOT NULL,
          source_id TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          text TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          embedding_model TEXT NOT NULL,
          embedding F32_BLOB(${embeddings.dimensions}) NOT NULL,
          FOREIGN KEY (repo_full_name, pr_number, source_kind, source_id)
            REFERENCES pr_sources(repo_full_name, pr_number, source_kind, source_id) ON DELETE CASCADE
        )`,
        `CREATE INDEX IF NOT EXISTS pr_source_chunks_embedding_idx
          ON pr_source_chunks (libsql_vector_idx(embedding, 'metric=cosine'))`,
      ],
      "write",
    );
    await this.assertMetadata(embeddings);
  }

  private async assertMetadata(embeddings: EmbeddingProvider): Promise<void> {
    const dimensions = await this.readMetadata("embedding_dimensions");
    if (dimensions && Number(dimensions) !== embeddings.dimensions) {
      throw new Error(
        `Embedding dimensions mismatch: database=${dimensions} provider=${embeddings.dimensions}.`,
      );
    }
    await this.writeMetadata("embedding_dimensions", String(embeddings.dimensions));
  }

  private async readMetadata(key: string): Promise<string | undefined> {
    const result = await this.client.execute({
      sql: "SELECT value FROM corpus_metadata WHERE key = ?",
      args: [key],
    });
    return result.rows[0]?.value as string | undefined;
  }

  private async writeMetadata(key: string, value: string): Promise<void> {
    await this.client.execute({
      sql: `INSERT INTO corpus_metadata (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [key, value],
    });
  }
}

export function chunkText(text: string, options: ChunkingOptions = {}): string[] {
  const maxCharacters = options.maxCharacters ?? DEFAULT_CHUNK_MAX_CHARACTERS;
  const overlapCharacters = options.overlapCharacters ?? DEFAULT_CHUNK_OVERLAP_CHARACTERS;

  if (maxCharacters <= 0) {
    throw new Error("maxCharacters must be greater than 0.");
  }
  if (maxCharacters > MAX_CHUNK_CHARACTERS) {
    throw new Error(`maxCharacters must be ${MAX_CHUNK_CHARACTERS} or less.`);
  }
  if (overlapCharacters < 0) {
    throw new Error("overlapCharacters must be greater than or equal to 0.");
  }
  if (overlapCharacters >= maxCharacters) {
    throw new Error("overlapCharacters must be smaller than maxCharacters.");
  }

  const normalized = text.trim();
  if (!normalized) {
    return [];
  }
  if (normalized.length <= maxCharacters) {
    return [normalized];
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + maxCharacters, normalized.length);
    chunks.push(normalized.slice(start, end));
    if (chunks.length > MAX_CHUNKS_PER_SOURCE) {
      throw new Error(`source exceeds ${MAX_CHUNKS_PER_SOURCE} chunks.`);
    }
    if (end === normalized.length) {
      break;
    }
    start = end - overlapCharacters;
  }
  return chunks;
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
}

export function assertValidRepoFullName(fullName: string): void {
  if (
    CONTROL_CHARACTER_PATTERN.test(fullName) ||
    !REPO_FULL_NAME_PATTERN.test(fullName)
  ) {
    throw new Error("Repository must use strict owner/repo format.");
  }
}

function sanitizeDatabaseOptions(database: TursoDatabaseOptions): TursoDatabaseOptions {
  const allowedKeys = new Set(["url", "authToken"]);
  const unknownKeys = Object.keys(database).filter((key) => !allowedKeys.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(`Unknown database option keys: ${unknownKeys.join(", ")}.`);
  }
  const normalizedUrl = database.url.replace(/^turso:/i, "libsql:");
  return database.authToken === undefined
    ? { url: normalizedUrl }
    : { url: normalizedUrl, authToken: database.authToken };
}

function assertPrivacyBoundary(options: CreatePullRequestCorpusOptions): void {
  const privacy = options.privacy ?? {};
  if (isRemoteDatabaseUrl(options.database.url) && !privacy.allowRemoteDatabase) {
    throw new Error("Remote corpus database URLs require allowRemoteDatabase: true.");
  }
  if (
    isCleartextRemoteDatabaseUrl(options.database.url) &&
    !privacy.allowInsecureRemoteDatabase
  ) {
    throw new Error(
      "Cleartext remote corpus database URLs require allowInsecureRemoteDatabase: true.",
    );
  }
  if (isRemoteDatabaseUrl(options.database.url)) {
    const warn = privacy.warn ?? ((message: string) => emitWarning(message));
    warn("Corpus source text will be stored in a remote database.");
  }
  if (
    options.embeddings &&
    privacy.embeddingProviderLocation !== "local" &&
    !privacy.allowThirdPartyEmbeddingProvider
  ) {
    throw new Error(
      "Embedding providers are treated as third-party unless privacy.embeddingProviderLocation is \"local\". Set allowThirdPartyEmbeddingProvider: true to acknowledge this boundary.",
    );
  }
}

function isRemoteDatabaseUrl(url: string): boolean {
  return /^(?:https?|wss?|libsql|turso):/i.test(url);
}

function isCleartextRemoteDatabaseUrl(url: string): boolean {
  return /^(?:http|ws):/i.test(url);
}

function boundedLimit(value: number | undefined, fallback: number): number {
  const limit = value ?? fallback;
  assertPositiveInteger(limit, "limit");
  if (limit > MAX_QUERY_LIMIT) {
    throw new Error(`limit must be ${MAX_QUERY_LIMIT} or less.`);
  }
  return limit;
}

export function boundedPageSize(value: number | undefined): number {
  const pageSize = value ?? MAX_PAGE_SIZE;
  assertPositiveInteger(pageSize, "pageSize");
  if (pageSize > MAX_PAGE_SIZE) {
    throw new Error(`pageSize must be ${MAX_PAGE_SIZE} or less.`);
  }
  return pageSize;
}

export function boundedTotalPullRequests(value: number | undefined): number {
  const maxPullRequests = value ?? MAX_TOTAL_PULL_REQUESTS_PER_REPOSITORY;
  assertPositiveInteger(maxPullRequests, "maxPullRequests");
  if (maxPullRequests > MAX_TOTAL_PULL_REQUESTS_PER_REPOSITORY) {
    throw new Error(
      `maxPullRequests must be ${MAX_TOTAL_PULL_REQUESTS_PER_REPOSITORY} or less for repository indexing.`,
    );
  }
  return maxPullRequests;
}

function boundedSearchQueryText(value: string): string {
  const query = value.trim();
  if (!query) {
    throw new Error("search query must not be empty.");
  }
  if (query.length > MAX_SEARCH_QUERY_CHARACTERS) {
    throw new Error(
      `search query must be ${MAX_SEARCH_QUERY_CHARACTERS} characters or less.`,
    );
  }
  return query;
}

function boundedSearchRepositories(
  repositories: string[] | undefined,
): string[] | undefined {
  if (!repositories?.length) {
    return undefined;
  }
  if (repositories.length > MAX_SEARCH_REPOSITORIES) {
    throw new Error(
      `repositories filter must contain ${MAX_SEARCH_REPOSITORIES} repositories or fewer.`,
    );
  }
  for (const repo of repositories) {
    assertValidRepoFullName(repo);
  }
  return repositories;
}

function boundedSearchSourceKinds(
  sourceKinds: PullRequestSourceKind[] | undefined,
): PullRequestSourceKind[] | undefined {
  if (!sourceKinds?.length) {
    return undefined;
  }
  if (sourceKinds.length > MAX_SEARCH_SOURCE_KINDS) {
    throw new Error(
      `sourceKinds filter must contain ${MAX_SEARCH_SOURCE_KINDS} source kinds or fewer.`,
    );
  }
  for (const sourceKind of sourceKinds) {
    assertValidPullRequestSourceKind(sourceKind);
  }
  return sourceKinds;
}

export function assertValidPullRequestSourceKind(
  sourceKind: string,
): asserts sourceKind is PullRequestSourceKind {
  if (!PULL_REQUEST_SOURCE_KIND_SET.has(sourceKind)) {
    throw new Error(`Invalid pull request source kind: ${sourceKind}.`);
  }
}

function normalizeSearchQuery(query: SemanticSearchQuery): SemanticSearchQuery {
  return {
    ...query,
    query: boundedSearchQueryText(query.query),
    repositories: boundedSearchRepositories(query.repositories),
    sourceKinds: boundedSearchSourceKinds(query.sourceKinds),
  };
}

async function executeUpsertRepository(
  executor: CorpusSqlExecutor,
  repo: RepositoryRecord,
): Promise<void> {
  assertValidRepoFullName(repo.fullName);
  await executor.execute({
    sql: `INSERT INTO repositories (
        full_name, provider, owner, name, default_branch, is_archived, indexed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(full_name) DO UPDATE SET
        provider = excluded.provider,
        owner = excluded.owner,
        name = excluded.name,
        default_branch = excluded.default_branch,
        is_archived = excluded.is_archived,
        indexed_at = excluded.indexed_at`,
    args: [
      repo.fullName,
      repo.provider,
      repo.owner,
      repo.name,
      repo.defaultBranch ?? null,
      repo.isArchived ? 1 : 0,
      repo.indexedAt ?? null,
    ],
  });
}

async function executeUpsertPullRequest(
  executor: CorpusSqlExecutor,
  pr: PullRequestRecord,
): Promise<void> {
  assertValidRepoFullName(pr.repoFullName);
  await executor.execute({
    sql: `INSERT INTO pull_requests (
        repo_full_name, number, github_id, node_id, url, state, title, body,
        author, created_at, updated_at, merged_at, closed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(repo_full_name, number) DO UPDATE SET
        github_id = excluded.github_id,
        node_id = excluded.node_id,
        url = excluded.url,
        state = excluded.state,
        title = excluded.title,
        body = excluded.body,
        author = excluded.author,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        merged_at = excluded.merged_at,
        closed_at = excluded.closed_at`,
    args: [
      pr.repoFullName,
      pr.number,
      pr.githubId ?? null,
      pr.nodeId ?? null,
      pr.url,
      pr.state,
      pr.title,
      pr.body,
      pr.author ?? null,
      pr.createdAt ?? null,
      pr.updatedAt ?? null,
      pr.mergedAt ?? null,
      pr.closedAt ?? null,
    ],
  });
}

function repositoryFromRow(row: Record<string, unknown>): RepositoryRecord {
  return {
    provider: "github",
    fullName: String(row.full_name),
    owner: String(row.owner),
    name: String(row.name),
    defaultBranch: optionalString(row.default_branch),
    isArchived: Boolean(row.is_archived),
    indexedAt: optionalString(row.indexed_at),
  };
}

function pullRequestFromRow(row: Record<string, unknown>): PullRequestRecord {
  const mergedAt = optionalString(row.merged_at);
  const state = mergedAt
    ? "merged"
    : (String(row.state) as PullRequestRecord["state"]);
  return {
    repoFullName: String(row.repo_full_name),
    number: Number(row.number),
    githubId: optionalNumber(row.github_id),
    nodeId: optionalString(row.node_id),
    url: String(row.url),
    state,
    title: String(row.title),
    body: String(row.body),
    author: optionalString(row.author),
    createdAt: optionalString(row.created_at),
    updatedAt: optionalString(row.updated_at),
    mergedAt,
    closedAt: optionalString(row.closed_at),
  };
}

function optionalString(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : String(value);
}

function optionalNumber(value: unknown): number | undefined {
  return value === null || value === undefined ? undefined : Number(value);
}

void normalizeSearchQuery;
