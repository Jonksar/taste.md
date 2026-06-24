import assert from "node:assert/strict";
import test from "node:test";

import { fetchPullRequestEvidence } from "../dist/github.js";

test("fetches pull request evidence from GitHub REST endpoints", async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("/pulls/7?")) {
      return jsonResponse({
        number: 7,
        title: "Improve tests",
        html_url: "https://github.com/acme/widgets/pull/7",
        body: "Prefer behavior tests.",
      });
    }
    if (String(url).includes("/pulls/7/files")) {
      return jsonResponse([{ filename: "src/widgets.test.ts" }]);
    }
    if (String(url).includes("/pulls/7/reviews")) {
      return jsonResponse([{ user: { login: "alice" }, body: "Looks good", state: "APPROVED" }]);
    }
    if (String(url).includes("/pulls/7/comments")) {
      return jsonResponse([{ user: { login: "bob" }, body: "Prefer behavior tests.", path: "src/widgets.test.ts" }]);
    }
    if (String(url).includes("/issues/7/comments")) {
      return jsonResponse([{ user: { login: "carol" }, body: "Please avoid implementation detail tests." }]);
    }
    throw new Error(`unexpected URL ${url}`);
  };

  const evidence = await fetchPullRequestEvidence({
    repo: "acme/widgets",
    pr: 7,
    token: "secret",
    fetchImpl: fakeFetch,
  });

  assert.equal(evidence.number, 7);
  assert.equal(evidence.title, "Improve tests");
  assert.equal(evidence.files[0].filename, "src/widgets.test.ts");
  assert.equal(evidence.reviews[0].author, "alice");
  assert.equal(evidence.reviewComments[0].author, "bob");
  assert.equal(evidence.issueComments[0].author, "carol");
  assert.match(calls[0].init.headers.authorization, /Bearer secret/);
});

test("paginates list endpoints until GitHub returns a short page", async () => {
  const fileUrls = [];
  const fakeFetch = async (url) => {
    const stringUrl = String(url);
    if (stringUrl.includes("/pulls/2?")) {
      return jsonResponse({ number: 2, title: "Many files", html_url: "url", body: "" });
    }
    if (stringUrl.includes("/pulls/2/files")) {
      fileUrls.push(stringUrl);
      const page = new URL(stringUrl).searchParams.get("page");
      return jsonResponse(page === "1"
        ? Array.from({ length: 100 }, (_, index) => ({ filename: `src/${index}.ts` }))
        : [{ filename: "src/final.ts" }]);
    }
    return jsonResponse([]);
  };

  const evidence = await fetchPullRequestEvidence({
    repo: "acme/widgets",
    pr: 2,
    fetchImpl: fakeFetch,
  });

  assert.equal(evidence.files.length, 101);
  assert.equal(fileUrls.length, 2);
});

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  };
}
