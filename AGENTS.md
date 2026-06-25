# AGENTS.md

## PR Explainers

- Do not save PR explainers to https://github.com/iter8-ai/docs.
- Treat that repo as reference-only unless the user explicitly asks otherwise.

## taste.md

### Motivation

Find coding rules that make LLMs write better. Keep the output small by trimming guidance for things models already do well, so the file does not become context rot.

### Running

- `taste-md discover --repo-path <path> --output <repo>.taste.md`
- Writes `taste.md` plus `taste_log.md`.
- Scans trusted instruction Markdown and skips generated guidelines/plans.

## find-prior-work

### Motivation

In spirit, this is similar to [$benchmarking-implementations](/Users/joonatan/.codex/skills/benchmarking-implementations/SKILL.md): give agents context for how established projects implemented a feature. PRs locate those features because description text usually explains intent better than code alone.

### Running

- Core file: `src/pr-corpus.ts`.
- Keep remote databases and third-party embedding providers opt-in.
