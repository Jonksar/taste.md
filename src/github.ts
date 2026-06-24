import type {
  PullRequestComment,
  PullRequestEvidence,
  PullRequestFile,
  PullRequestReview,
  PullRequestReviewComment,
} from "./evidence.js";

export type FetchPullRequestParams = {
  repo: string;
  pr: number;
  token?: string;
  fetchImpl?: FetchLike;
};

type FetchLike = (url: string, init: RequestInit) => Promise<GitHubResponse>;

type GitHubResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
};

type GitHubPullRequest = {
  number: number;
  title: string;
  html_url: string;
  body: string | null;
};

type GitHubFile = {
  filename: string;
};

type GitHubComment = {
  user?: { login?: string };
  body?: string | null;
};

type GitHubReviewComment = GitHubComment & {
  path?: string;
};

type GitHubReview = GitHubComment & {
  state?: string;
};

const API_BASE = "https://api.github.com";
const PER_PAGE = 100;

export async function fetchPullRequestEvidence(
  params: FetchPullRequestParams,
): Promise<PullRequestEvidence> {
  const [owner, repoName] = parseRepo(params.repo);
  const request = createRequester(params.fetchImpl ?? fetch, params.token);
  const prPath = `/repos/${owner}/${repoName}/pulls/${params.pr}`;

  const [pullRequest, files, reviews, reviewComments, issueComments] = await Promise.all([
    request<GitHubPullRequest>(`${prPath}?`),
    requestPages<GitHubFile>(request, `${prPath}/files`),
    requestPages<GitHubReview>(request, `${prPath}/reviews`),
    requestPages<GitHubReviewComment>(request, `${prPath}/comments`),
    requestPages<GitHubComment>(request, `/repos/${owner}/${repoName}/issues/${params.pr}/comments`),
  ]);

  return {
    number: pullRequest.number,
    title: pullRequest.title,
    url: pullRequest.html_url,
    files: files.map(toPullRequestFile),
    reviews: reviews.map(toPullRequestReview),
    reviewComments: reviewComments.map(toPullRequestReviewComment),
    issueComments: issueComments.map(toPullRequestComment),
  };
}

function createRequester(fetchImpl: FetchLike, token: string | undefined) {
  return async function request<T>(path: string): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const response = await fetchImpl(url, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "taste.md",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub request failed (${response.status} ${response.statusText}) for ${url}`);
    }

    return await response.json() as T;
  };
}

async function requestPages<T>(
  request: <TResult>(path: string) => Promise<TResult>,
  path: string,
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const separator = path.includes("?") ? "&" : "?";
    const pageItems = await request<T[]>(`${path}${separator}per_page=${PER_PAGE}&page=${page}`);
    results.push(...pageItems);
    if (pageItems.length < PER_PAGE) return results;
    page += 1;
  }
}

function parseRepo(repo: string): [string, string] {
  const [owner, name] = repo.split("/");
  if (!owner || !name || repo.split("/").length !== 2) {
    throw new Error("Repo must use the owner/name format.");
  }
  return [owner, name];
}

function toPullRequestFile(file: GitHubFile): PullRequestFile {
  return { filename: file.filename };
}

function toPullRequestReview(review: GitHubReview): PullRequestReview {
  return {
    author: review.user?.login ?? "unknown",
    body: review.body ?? "",
    state: review.state,
  };
}

function toPullRequestReviewComment(comment: GitHubReviewComment): PullRequestReviewComment {
  return {
    author: comment.user?.login ?? "unknown",
    body: comment.body ?? "",
    path: comment.path,
  };
}

function toPullRequestComment(comment: GitHubComment): PullRequestComment {
  return {
    author: comment.user?.login ?? "unknown",
    body: comment.body ?? "",
  };
}
