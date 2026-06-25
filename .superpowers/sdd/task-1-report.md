# Task 1 Report: Corpus Types, Source Extraction, Hashing, and Chunking

## Scope

Implemented the Task 1 corpus helpers in `src/pr-corpus.ts` and exported them from `src/index.ts`.

## Changes

- Added corpus types for repository, pull request, source document, semantic match, and embedding provider.
- Added `PULL_REQUEST_SOURCE_KINDS`.
- Added `createPullRequestSources(input, sourceKinds?)` for title/body extraction, trimming, source filtering, and SHA-256 hashing.
- Added `chunkText(text, options?)` with overlap handling and validation.
- Added the `node:crypto` shim needed by the new helper.
- Added the Task 1 test file in `test/pr-corpus.test.mjs`.

## TDD Evidence

### Red

Ran:

```bash
npm run build
node --test test/pr-corpus.test.mjs
```

Result: the test failed first because `dist/pr-corpus.js` did not exist yet.

### Green

Implemented the module, then reran:

```bash
npm run build && node --test test/pr-corpus.test.mjs
```

Result: all 4 Task 1 tests passed.

## Verification

Ran the full repository test suite after the Task 1 tests passed:

```bash
npm run build && npm test
```

Result: all 27 tests passed.

## Commit

Commit message:

```bash
feat: add pull request corpus source helpers
```

## Concerns

None.
