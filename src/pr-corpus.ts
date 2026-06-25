import { createHash } from "node:crypto";

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

type PullRequestMetadataField = "title" | "body";

interface PullRequestSourceDefinition {
  sourceKind: Extract<PullRequestSourceKind, "pr_title" | "pr_body">;
  sourceId: string;
  pullRequestField: PullRequestMetadataField;
}

const PR_METADATA_SOURCE_DEFINITIONS: readonly PullRequestSourceDefinition[] = [
  { sourceKind: "pr_title", sourceId: "title", pullRequestField: "title" },
  { sourceKind: "pr_body", sourceId: "body", pullRequestField: "body" },
];
const DEFAULT_SOURCE_KINDS: PullRequestSourceKind[] = ["pr_title", "pr_body"];
const DEFAULT_CHUNK_MAX_CHARACTERS = 1200;
const DEFAULT_CHUNK_OVERLAP_CHARACTERS = 120;
const MAX_CHUNK_CHARACTERS = 8000;
const MAX_CHUNKS_PER_SOURCE = 100;

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

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

export function chunkText(text: string, options: ChunkingOptions = {}): string[] {
  const maxCharacters = options.maxCharacters ?? DEFAULT_CHUNK_MAX_CHARACTERS;
  const overlapCharacters = options.overlapCharacters ?? DEFAULT_CHUNK_OVERLAP_CHARACTERS;

  if (maxCharacters <= 0) throw new Error("maxCharacters must be greater than 0.");
  if (maxCharacters > MAX_CHUNK_CHARACTERS) throw new Error(`maxCharacters must be ${MAX_CHUNK_CHARACTERS} or less.`);
  if (overlapCharacters < 0) throw new Error("overlapCharacters must be greater than or equal to 0.");
  if (overlapCharacters >= maxCharacters) throw new Error("overlapCharacters must be smaller than maxCharacters.");

  const normalized = text.trim();
  if (!normalized) return [];
  if (normalized.length <= maxCharacters) return [normalized];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + maxCharacters, normalized.length);
    chunks.push(normalized.slice(start, end));
    if (chunks.length > MAX_CHUNKS_PER_SOURCE) throw new Error(`source exceeds ${MAX_CHUNKS_PER_SOURCE} chunks.`);
    if (end === normalized.length) break;
    start = end - overlapCharacters;
  }
  return chunks;
}
