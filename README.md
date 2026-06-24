# taste.md

Generate evidence-backed `taste.md` files from pull request history.

The core scoring formula follows the Command Code-style objective in a local,
inspectable form:

```text
confidence = clamp01(reward - lambda * anchorDrift)
```

`lambda` is the single regularization constant. Its semantic is **taste
inertia**: the higher it is, the harder it is for observed PR behavior to
become an active taste rule when it drifts from safe defaults or durable project
guidance.

## Install

```bash
npm install
npm run build
```

The CLI entrypoint is `taste-md`.

## Score A Rule

```bash
node dist/cli.js score --reward 0.9 --anchor-drift 0.5 --lambda 0.4
```

Output:

```json
{
  "confidence": 0.7,
  "reward": 0.9,
  "anchorDrift": 0.5,
  "lambda": 0.4,
  "semantic": "taste inertia",
  "formula": "confidence = clamp01(reward - lambda * anchorDrift)"
}
```

## Generate From Local PR Evidence

```bash
node dist/cli.js generate --input prs.json --output taste.md
```

The command writes two files:

- `taste.md` — rule-only Markdown intended for `AGENTS.md` or `CLAUDE.md`
- `taste_log.md` — confidence, formula inputs, evidence, and contradictions

`prs.json` is an array of pull request evidence objects:

```json
[
  {
    "number": 42,
    "title": "Harden tests",
    "url": "https://github.com/acme/widgets/pull/42",
    "files": [{ "filename": "fire/projects/ai-assistant/tests/test_matching.py" }],
    "reviews": [],
    "issueComments": [],
    "reviewComments": [
      {
        "author": "reviewer",
        "body": "Prefer behavior tests here; this currently tests implementation details.",
        "path": "fire/projects/ai-assistant/tests/test_matching.py"
      }
    ]
  }
]
```

## Generate From GitHub PRs

```bash
GITHUB_TOKEN=... node dist/cli.js generate \
  --repo owner/name \
  --pr 123 \
  --pr 456 \
  --output taste.md \
  --lambda 0.35
```

The GitHub client fetches the pull request, changed files, reviews, review
comments, and issue comments. `GH_TOKEN` is also supported.

## Discover From Local Repository Markdown

```bash
node dist/cli.js discover --repo-path ../fire --output fire.taste.md
node dist/cli.js discover --repo-path ../ice --output ice.taste.md
```

`discover` scans Markdown in the target repository and skips existing
`guidelines/` directories by default, so generated taste files are not just a
copy of already-written guidelines. It extracts `###` rules and bold convention
bullets from rule-like sections such as Testing, Coding Conventions, Known
Footguns, and Rules.

When `--output` ends in `taste.md`, the log file is written beside it by
replacing that suffix with `taste_log.md`. For example, `fire.taste.md` produces
`fire.taste_log.md`. Use `--log-output <path>` to choose a different log path.

This repository includes clean-run examples generated from the local Reiterate
workspace:

- `examples/fire.taste.md`
- `examples/fire.taste_log.md`
- `examples/ice.taste.md`
- `examples/ice.taste_log.md`

## Include From AGENTS.md Or CLAUDE.md

Generated `taste.md` is plain Markdown. Keep it in the project and reference it
from agent instruction files:

```md
## Taste

Read and follow `taste.md` for evidence-backed project preferences. When it
conflicts with this file, this file wins.
```

Do not treat taste as a replacement for architecture or safety rules. Taste
biases generation; explicit repo instructions remain the source of truth.

## Development

```bash
npm run build
npm test
```

This repository has no runtime dependencies. It uses TypeScript for source and
Node's built-in test runner for tests.
