import assert from "node:assert/strict";
import test from "node:test";

import { createGhCliPullRequestSource } from "../dist/gh-cli.js";

test("gh CLI source lists PRs through gh api and normalizes PR input", async () => {
  const calls = [];
  const runner = async (file, args) => {
    calls.push([file, args]);
    if (args.includes("/repos/acme/widgets/pulls")) {
      return JSON.stringify([
        {
          id: 1001,
          node_id: "PR_node",
          number: 42,
          html_url: "https://github.com/acme/widgets/pull/42",
          state: "closed",
          title: "Retry failed uploads",
          body: "Adds retry handling.",
          user: { login: "octo" },
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-02T00:00:00Z",
          merged_at: "2026-01-03T00:00:00Z",
          closed_at: "2026-01-03T00:00:00Z",
          base: { repo: { default_branch: "main", archived: false } },
        },
      ]);
    }
    return "[]";
  };

  const source = createGhCliPullRequestSource({ runner });
  const results = [];
  for await (const input of source.listPullRequests("acme/widgets", { state: "all" })) {
    results.push(input);
  }

  assert.equal(calls[0][0], "gh");
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0][1], [
    "api",
    "--method",
    "GET",
    "/repos/acme/widgets/pulls",
    "-f",
    "state=all",
    "-f",
    "per_page=100",
    "-f",
    "page=1",
  ]);
  const forbiddenPaginationFlags = ["--" + "paginate", "--" + "slurp"];
  assert.equal(forbiddenPaginationFlags.some((flag) => calls[0][1].includes(flag)), false);
  assert.equal(results.length, 1);
  assert.equal(results[0].repository.fullName, "acme/widgets");
  assert.equal(results[0].pullRequest.number, 42);
  assert.equal(results[0].pullRequest.state, "merged");
  assert.equal(results[0].sources.length, 0);
});

test("gh CLI source sorts by updated date when since is set", async () => {
  const calls = [];
  const runner = async (_file, args) => {
    calls.push(args);
    return "[]";
  };

  const source = createGhCliPullRequestSource({ runner });
  for await (const _input of source.listPullRequests("acme/widgets", {
    since: "2026-01-15T00:00:00.000Z",
  })) {
    // consume iterator
  }

  assert.deepEqual(calls[0], [
    "api",
    "--method",
    "GET",
    "/repos/acme/widgets/pulls",
    "-f",
    "state=all",
    "-f",
    "per_page=100",
    "-f",
    "page=1",
    "-f",
    "sort=updated",
    "-f",
    "direction=desc",
  ]);
});

test("gh CLI source fetches bounded pages and stops when maxPullRequests is reached", async () => {
  const calls = [];
  const runner = async (_file, args) => {
    calls.push(args);
    const page = args.find((arg) => arg.startsWith("page="));
    if (page === "page=1") {
      return JSON.stringify([
        { number: 1, html_url: "https://github.com/acme/widgets/pull/1", state: "open", title: "one" },
        { number: 2, html_url: "https://github.com/acme/widgets/pull/2", state: "open", title: "two" },
      ]);
    }
    if (page === "page=2") {
      return JSON.stringify([
        { number: 3, html_url: "https://github.com/acme/widgets/pull/3", state: "open", title: "three" },
        { number: 4, html_url: "https://github.com/acme/widgets/pull/4", state: "open", title: "four" },
      ]);
    }
    throw new Error(`unexpected page ${page}`);
  };

  const source = createGhCliPullRequestSource({ runner });
  const results = [];
  for await (const input of source.listPullRequests("acme/widgets", { maxPullRequests: 3, pageSize: 2 })) {
    results.push(input);
  }

  assert.deepEqual(results.map((input) => input.pullRequest.number), [1, 2, 3]);
  assert.deepEqual(calls.map((args) => args.at(-1)), ["page=1", "page=2"]);
  const forbiddenPaginationFlags = ["--" + "paginate", "--" + "slurp"];
  assert.equal(calls.some((args) => forbiddenPaginationFlags.some((flag) => args.includes(flag))), false);
});

test("gh CLI source rejects invalid repository names before constructing endpoint", async () => {
  let called = false;
  const source = createGhCliPullRequestSource({
    runner: async () => {
      called = true;
      return "[]";
    },
  });

  await assert.rejects(
    async () => {
      for await (const _input of source.listPullRequests("acme/widgets/extra", {})) {
        // consume iterator
      }
    },
    /strict owner\/repo/,
  );
  assert.equal(called, false);
});
