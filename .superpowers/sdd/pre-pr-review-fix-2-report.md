Status: DONE

Summary:
- Added a regression test covering yielded PR inputs whose `repository.fullName` or `pullRequest.repoFullName` does not match the requested repository.
- Updated `indexRepository` to validate yielded repository identity before since-filtering, source preparation, embedding, or persistence.
- Preserved per-PR failure handling by recording a `database` failure and continuing without storing partial data.

Verification:
- `npm run build && node --test test/pr-corpus.test.mjs`
- `npm run check`

Commit:
- `fix: validate indexed repository identity`

Concerns:
- None.
