#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { argv, env, exit, stderr, stdout } from "node:process";

import { deriveTasteCandidates, type PullRequestEvidence } from "./evidence.js";
import { calculateConfidence } from "./formula.js";
import { fetchPullRequestEvidence } from "./github.js";
import { discoverRepositoryCandidates } from "./guidelines.js";
import { renderTasteLogMarkdown, renderTasteMarkdown } from "./markdown.js";
import {
  createPullRequestCorpus,
  type CorpusPrivacyOptions,
  type PullRequestCorpus,
} from "./pr-corpus.js";

const DEFAULT_OUTPUT = "taste.md";

type ParsedArgs = {
  command: string | undefined;
  flags: Map<string, string[]>;
  positionals: string[];
};

type ParsedCorpusArgs = {
  subcommand: string | undefined;
  positionals: string[];
  flags: Map<string, string[]>;
};

async function main(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    stdout.write(helpText());
    return;
  }

  const parsed = parseArgs(args);
  if (!parsed.command || parsed.flags.has("help") || parsed.flags.has("h")) {
    stdout.write(helpText());
    return;
  }

  if (parsed.command === "score") {
    runScore(parsed.flags);
    return;
  }

  if (parsed.command === "generate") {
    await runGenerate(parsed.flags);
    return;
  }

  if (parsed.command === "discover") {
    await runDiscover(parsed.flags);
    return;
  }

  if (parsed.command === "corpus") {
    const corpusArgs = parseCorpusArgs(parsed.positionals, parsed.flags);
    await runCorpus(corpusArgs.subcommand, corpusArgs.positionals, corpusArgs.flags);
    return;
  }

  throw new Error(`Unknown command: ${parsed.command}`);
}

function runScore(flags: Map<string, string[]>): void {
  const reward = requiredNumber(flags, "reward");
  const anchorDrift = requiredNumber(flags, "anchor-drift");
  const lambda = optionalNumber(flags, "lambda", 0.35);
  const score = calculateConfidence({ reward, anchorDrift, lambda });
  stdout.write(`${JSON.stringify(score, null, 2)}\n`);
}

async function runGenerate(flags: Map<string, string[]>): Promise<void> {
  const lambda = optionalNumber(flags, "lambda", 0.35);
  const output = firstFlag(flags, "output") ?? DEFAULT_OUTPUT;
  const logOutput = resolveLogOutput(output, firstFlag(flags, "log-output"));
  const prs = await loadPullRequests(flags);
  const candidates = deriveTasteCandidates(prs, { lambda });
  await writeTasteArtifacts(candidates, output, logOutput);
}

async function runDiscover(flags: Map<string, string[]>): Promise<void> {
  const lambda = optionalNumber(flags, "lambda", 0.35);
  const output = firstFlag(flags, "output") ?? DEFAULT_OUTPUT;
  const logOutput = resolveLogOutput(output, firstFlag(flags, "log-output"));
  const repoPath = firstFlag(flags, "repo-path") ?? ".";
  const candidates = await discoverRepositoryCandidates({ repoPath, lambda });
  await writeTasteArtifacts(candidates, output, logOutput);
}

async function loadPullRequests(flags: Map<string, string[]>): Promise<PullRequestEvidence[]> {
  const input = firstFlag(flags, "input");
  if (input) {
    const raw = await readFile(input, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("--input must contain a JSON array of pull request evidence objects.");
    }
    return parsed as PullRequestEvidence[];
  }

  const repo = firstFlag(flags, "repo");
  const prs = flags.get("pr") ?? [];
  if (!repo || prs.length === 0) {
    throw new Error("generate requires either --input <prs.json> or --repo owner/name --pr <number>.");
  }

  const token = firstFlag(flags, "token") ?? env.GITHUB_TOKEN ?? env.GH_TOKEN;
  return await Promise.all(
    prs.map((pr) => fetchPullRequestEvidence({
      repo,
      pr: parseRequiredInteger(pr, "--pr"),
      token,
    })),
  );
}

function parseArgs(args: string[]): ParsedArgs {
  const [command, ...rest] = args;
  const flags = new Map<string, string[]>();
  const positionals: string[] = [];

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token?.startsWith("--")) {
      if (command === "corpus") {
        positionals.push(token ?? "");
        continue;
      }
      throw new Error(`Unexpected argument: ${token ?? ""}`);
    }

    const name = token.slice(2);
    const next = rest[index + 1];
    const value = next && !next.startsWith("--") ? next : "true";
    if (value !== "true") index += 1;

    const values = flags.get(name) ?? [];
    values.push(value);
    flags.set(name, values);
  }

  return { command, flags, positionals };
}

function parseCorpusArgs(positionals: string[], flags: Map<string, string[]>): ParsedCorpusArgs {
  const [subcommand, ...rest] = positionals;
  return { subcommand, positionals: rest, flags };
}

function requiredNumber(flags: Map<string, string[]>, name: string): number {
  const value = firstFlag(flags, name);
  if (value === undefined) throw new Error(`Missing --${name}.`);
  return parseRequiredNumber(value, `--${name}`);
}

function optionalNumber(flags: Map<string, string[]>, name: string, fallback: number): number {
  const value = firstFlag(flags, name);
  return value === undefined ? fallback : parseRequiredNumber(value, `--${name}`);
}

function firstFlag(flags: Map<string, string[]>, name: string): string | undefined {
  return flags.get(name)?.[0];
}

function parseRequiredNumber(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a number.`);
  return parsed;
}

function parseRequiredInteger(value: string, label: string): number {
  const parsed = parseRequiredNumber(value, label);
  if (!Number.isInteger(parsed)) throw new Error(`${label} must be an integer.`);
  return parsed;
}

async function runCorpus(
  subcommand: string | undefined,
  positionals: string[],
  flags: Map<string, string[]>,
): Promise<void> {
  if (!subcommand) throw new Error("corpus requires a subcommand.");

  const validMetadataCommands = new Set(["init", "repos", "prs", "delete-pr", "delete-repo"]);
  if (!validMetadataCommands.has(subcommand)) {
    throw new Error(`Unknown corpus command: ${subcommand}`);
  }
  if (subcommand === "prs" && !positionals[0]) {
    throw new Error("corpus prs requires a repository.");
  }
  if (subcommand === "delete-pr" && (!positionals[0] || !positionals[1])) {
    throw new Error("corpus delete-pr requires a repository and pull request number.");
  }
  if (subcommand === "delete-repo" && !positionals[0]) {
    throw new Error("corpus delete-repo requires a repository.");
  }

  const corpus = createMetadataOnlyCorpus(flags);
  await corpus.initialize();

  if (subcommand === "init") {
    stdout.write("Corpus initialized.\n");
    return;
  }

  if (subcommand === "repos") {
    stdout.write(`${JSON.stringify(await corpus.listRepositories(), null, 2)}\n`);
    return;
  }

  if (subcommand === "prs") {
    const repo = positionals[0]!;
    const limit = firstFlag(flags, "limit");
    const options = limit === undefined
      ? undefined
      : { limit: parseRequiredInteger(limit, "limit") };
    stdout.write(`${JSON.stringify(await corpus.listPullRequests(repo, options), null, 2)}\n`);
    return;
  }

  if (subcommand === "delete-pr") {
    const repo = positionals[0]!;
    const pr = positionals[1]!;
    await corpus.deletePullRequest(repo, parseRequiredInteger(pr, "pull request number"));
    return;
  }

  if (subcommand === "delete-repo") {
    const repo = positionals[0]!;
    await corpus.deleteRepository(repo);
  }
}

function corpusDatabaseUrl(flags: Map<string, string[]>): string {
  return firstFlag(flags, "db") ?? env.TASTE_CORPUS_DB ?? "file:taste-prs.db";
}

function createMetadataOnlyCorpus(flags: Map<string, string[]>): PullRequestCorpus {
  return createPullRequestCorpus({
    database: { url: corpusDatabaseUrl(flags) },
    privacy: cliPrivacyOptions(flags),
  });
}

function cliPrivacyOptions(flags: Map<string, string[]>): CorpusPrivacyOptions {
  return {
    allowRemoteDatabase: firstFlag(flags, "allow-remote-db") === "true",
    allowInsecureRemoteDatabase: firstFlag(flags, "allow-insecure-remote-db") === "true",
  };
}

async function writeTasteArtifacts(
  candidates: ReturnType<typeof deriveTasteCandidates>,
  output: string,
  logOutput: string,
): Promise<void> {
  await writeFile(output, renderTasteMarkdown(candidates), "utf8");
  await writeFile(logOutput, renderTasteLogMarkdown(candidates), "utf8");
}

function resolveLogOutput(output: string, explicitLogOutput: string | undefined): string {
  if (explicitLogOutput) return explicitLogOutput;
  if (output.endsWith(DEFAULT_OUTPUT)) {
    return `${output.slice(0, -DEFAULT_OUTPUT.length)}taste_log.md`;
  }
  return `${output}.log.md`;
}

function helpText(): string {
  return `taste-md

Commands:
  score --reward <n> --anchor-drift <n> [--lambda <n>]
  generate --input <prs.json> [--output taste.md] [--log-output taste_log.md] [--lambda <n>]
  generate --repo owner/name --pr 123 [--pr 456] [--output taste.md] [--log-output taste_log.md] [--lambda <n>]
  discover --repo-path <path> [--output taste.md] [--log-output taste_log.md] [--lambda <n>]
  corpus init [--db file:taste-prs.db]
  corpus repos [--db file:taste-prs.db]
  corpus prs owner/name [--db file:taste-prs.db] [--limit 100]
  corpus delete-pr owner/name 123 [--db file:taste-prs.db]
  corpus delete-repo owner/name [--db file:taste-prs.db]

  Remote DB boundaries:
    --allow-remote-db true
    --allow-insecure-remote-db true

Formula:
  confidence = clamp01(reward - lambda * anchorDrift)
  lambda semantic: taste inertia
`;
}

main(argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  stderr.write(`${message}\n`);
  exit(1);
});
