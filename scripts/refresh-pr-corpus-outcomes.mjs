#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = join(root, "test", "fixtures", "pr-corpus-outcomes.json");
const ghPath = process.env.TASTE_GH_PATH ?? "gh";

if (process.argv.includes("--help")) {
  console.log(`Usage: npm run refresh:pr-corpus-outcomes

Refreshes ${relative(root, fixturePath)} from the GitHub CLI.
Set TASTE_GH_PATH to use a non-default gh binary.`);
  process.exit(0);
}

const existingInputs = JSON.parse(await readFile(fixturePath, "utf8"));
const refreshedInputs = [];
const repoCache = new Map();

for (const input of existingInputs) {
  const repoFullName = input.repository.fullName;
  const prNumber = input.pullRequest.number;
  refreshedInputs.push({
    repository: await repositoryRecord(repoFullName),
    pullRequest: await pullRequestRecord(repoFullName, prNumber),
    sources: [],
  });
}

await writeFile(fixturePath, `${JSON.stringify(refreshedInputs, null, 2)}\n`);
console.log(`Refreshed ${refreshedInputs.length} PR corpus outcomes at ${relative(root, fixturePath)}.`);

async function repositoryRecord(fullName) {
  if (repoCache.has(fullName)) return repoCache.get(fullName);

  const [owner, name] = fullName.split("/");
  const repo = await ghJson([
    "repo",
    "view",
    fullName,
    "--json",
    "defaultBranchRef,isArchived",
  ]);
  const record = {
    provider: "github",
    fullName,
    owner,
    name,
    defaultBranch: repo.defaultBranchRef?.name,
    isArchived: Boolean(repo.isArchived),
  };
  repoCache.set(fullName, record);
  return record;
}

async function pullRequestRecord(repoFullName, number) {
  const pr = await ghJson([
    "pr",
    "view",
    String(number),
    "--repo",
    repoFullName,
    "--json",
    "number,title,body,url,state,author,createdAt,updatedAt,mergedAt,closedAt",
  ]);

  return {
    repoFullName,
    number: Number(pr.number),
    url: String(pr.url),
    state: normalizedState(pr),
    title: String(pr.title ?? ""),
    body: String(pr.body ?? ""),
    author: pr.author?.login === undefined ? undefined : String(pr.author.login),
    createdAt: optionalString(pr.createdAt),
    updatedAt: optionalString(pr.updatedAt),
    mergedAt: optionalString(pr.mergedAt),
    closedAt: optionalString(pr.closedAt),
  };
}

async function ghJson(args) {
  const { stdout } = await execFileAsync(ghPath, args, {
    cwd: root,
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

function normalizedState(pr) {
  if (pr.mergedAt) return "merged";
  const state = String(pr.state ?? "").toLowerCase();
  if (state === "merged") return "merged";
  if (state === "closed") return "closed";
  return "open";
}

function optionalString(value) {
  return value === null || value === undefined ? undefined : String(value);
}
