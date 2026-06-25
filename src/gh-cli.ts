import { execFile } from "node:child_process";

import {
  assertValidRepoFullName,
  boundedPageSize,
  boundedTotalPullRequests,
  type GitHubPullRequestListOptions,
  type GitHubPullRequestSource,
  type PullRequestCorpusInput,
} from "./pr-corpus.js";

export type GhRunner = (file: string, args: readonly string[]) => Promise<string>;

export interface GhCliPullRequestSourceOptions {
  ghPath?: string;
  runner?: GhRunner;
}

export function createGhCliPullRequestSource(
  options: GhCliPullRequestSourceOptions = {},
): GitHubPullRequestSource {
  const ghPath = options.ghPath ?? "gh";
  const runner = options.runner ?? runGh;

  return {
    async *listPullRequests(
      repoFullName: string,
      listOptions: GitHubPullRequestListOptions = {},
    ) {
      assertValidRepoFullName(repoFullName);
      const maxResults = boundedTotalPullRequests(listOptions.maxPullRequests);
      const pageSize = boundedPageSize(listOptions.pageSize);
      let yielded = 0;

      for (let page = 1; yielded < maxResults; page += 1) {
        const pulls = parsePullsPage(
          await runner(
            ghPath,
            buildPullsArgs(repoFullName, listOptions, pageSize, page),
          ),
        );

        for (const raw of pulls) {
          if (yielded >= maxResults) break;
          yield normalizePull(repoFullName, raw);
          yielded += 1;
        }

        if (pulls.length < pageSize) break;
      }
    },
  };
}

function buildPullsArgs(
  repoFullName: string,
  options: GitHubPullRequestListOptions,
  pageSize: number,
  page: number,
): string[] {
  assertValidRepoFullName(repoFullName);
  const args = [
    "api",
    "--method",
    "GET",
    `/repos/${repoFullName}/pulls`,
    "-f",
    `state=${options.state ?? "all"}`,
    "-f",
    `per_page=${pageSize}`,
    "-f",
    `page=${page}`,
  ];

  if (options.since) {
    args.push("-f", "sort=updated", "-f", "direction=desc");
  }

  return args;
}

function parsePullsPage(output: string): unknown[] {
  const page = JSON.parse(output) as unknown;
  if (!Array.isArray(page)) {
    throw new Error("gh api pull request page must be a JSON array.");
  }
  return page;
}

function normalizePull(repoFullName: string, raw: unknown): PullRequestCorpusInput {
  const pull = raw as Record<string, unknown>;
  const [owner, name] = repoFullName.split("/");
  const base = pull.base as { repo?: { default_branch?: string; archived?: boolean } } | undefined;
  const mergedAt = optionalString(pull.merged_at);

  return {
    repository: {
      provider: "github",
      fullName: repoFullName,
      owner,
      name,
      defaultBranch: base?.repo?.default_branch,
      isArchived: base?.repo?.archived,
    },
    pullRequest: {
      repoFullName,
      number: Number(pull.number),
      githubId: optionalNumber(pull.id),
      nodeId: optionalString(pull.node_id),
      url: String(pull.html_url),
      state: mergedAt ? "merged" : String(pull.state) as "open" | "closed",
      title: String(pull.title ?? ""),
      body: String(pull.body ?? ""),
      author: optionalLogin(pull.user),
      createdAt: optionalString(pull.created_at),
      updatedAt: optionalString(pull.updated_at),
      mergedAt,
      closedAt: optionalString(pull.closed_at),
    },
    sources: [],
  };
}

function runGh(file: string, args: readonly string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve(stdout);
    });
  });
}

function optionalLogin(value: unknown): string | undefined {
  const user = value as { login?: unknown } | undefined;
  return user?.login === undefined ? undefined : String(user.login);
}

function optionalString(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : String(value);
}

function optionalNumber(value: unknown): number | undefined {
  return value === null || value === undefined ? undefined : Number(value);
}
