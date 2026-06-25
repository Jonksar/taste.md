# Pre-PR Review Fix Report

## Finding

`src/pr-corpus.ts` accepted supplied source documents without verifying that their
`repoFullName` and `prNumber` matched `input.pullRequest`, which allowed indexing
for one PR to write `pr_sources` and chunk rows into another existing PR record.

## Fix

- Added a regression test that reproduces the cross-PR corruption path during
  `indexRepository` with a supplied `changed_file` source pointing at another repo.
- Added `assertProvidedSourceIdentity(input)` and invoked it before any supplied
  source normalization in `createPullRequestSources`, and before direct
  `upsertPullRequest` writes.
- Kept `sourceTextFilter` behavior unchanged and continued passing a frozen source
  clone so identity remains immutable from the hook.

## Verification

- `npm run build && node --test test/pr-corpus.test.mjs`
- `npm run check`

All commands passed.
