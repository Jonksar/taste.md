#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { argv, env, exit, stderr, stdout } from "node:process";

import { deriveTasteCandidates, type PullRequestEvidence } from "./evidence.js";
import { calculateConfidence } from "./formula.js";
import { fetchPullRequestEvidence } from "./github.js";
import { discoverGuidelineCandidates } from "./guidelines.js";
import { renderTasteMarkdown } from "./markdown.js";

const DEFAULT_OUTPUT = "taste.md";

type ParsedArgs = {
  command: string | undefined;
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
  const prs = await loadPullRequests(flags);
  const candidates = deriveTasteCandidates(prs, { lambda });
  const markdown = renderTasteMarkdown(candidates);
  await writeFile(output, markdown, "utf8");
}

async function runDiscover(flags: Map<string, string[]>): Promise<void> {
  const lambda = optionalNumber(flags, "lambda", 0.35);
  const output = firstFlag(flags, "output") ?? DEFAULT_OUTPUT;
  const repoPath = firstFlag(flags, "repo-path") ?? ".";
  const candidates = await discoverGuidelineCandidates({ repoPath, lambda });
  const markdown = renderTasteMarkdown(candidates);
  await writeFile(output, markdown, "utf8");
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

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token?.startsWith("--")) {
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

  return { command, flags };
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

function helpText(): string {
  return `taste-md

Commands:
  score --reward <n> --anchor-drift <n> [--lambda <n>]
  generate --input <prs.json> [--output taste.md] [--lambda <n>]
  generate --repo owner/name --pr 123 [--pr 456] [--output taste.md] [--lambda <n>]
  discover --repo-path <path> [--output taste.md] [--lambda <n>]

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
