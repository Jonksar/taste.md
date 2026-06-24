# taste_log.md

Generated taste audit log. Keep this beside `taste.md` when you want to inspect confidence, evidence, and contradictions.

Formula: `confidence = clamp01(reward - lambda * anchorDrift)`
Lambda Semantic: `taste inertia`

## Framework: pytest + pytest-asyncio (asyncio_mode = "auto")

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Framework: pytest + pytest-asyncio (asyncio_mode = "auto").

Evidence:
- AGENTS.md: Framework: pytest + pytest-asyncio (asyncio_mode = "auto")

## Structure: tests/<service_name>/unit/ and tests/<service_name>/integration/

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Structure: tests/<service_name>/unit/ and tests/<service_name>/integration/.

Evidence:
- AGENTS.md: Structure: tests/<service_name>/unit/ and tests/<service_name>/integration/

## Markers: @pytest.mark.postgres for tests requiring database

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Markers: @pytest.mark.postgres for tests requiring database.

Evidence:
- AGENTS.md: Markers: @pytest.mark.postgres for tests requiring database

## Config: Each project defines pytest options in its pyproject.toml

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Config: Each project defines pytest options in its pyproject.toml.

Evidence:
- AGENTS.md: Config: Each project defines pytest options in its pyproject.toml

## Test Design

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Test Design.

Evidence:
- AGENTS.md: Categorise before writing — each kind has its own bar:

## msgspec decoders must match the actual wire shape including envelopes

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
msgspec decoders must match the actual wire shape including envelopes.

Evidence:
- AGENTS.md: `msgspec` **silently ignores** unknown fields — a struct whose field names don't match the JSON keys produces empty/zero values with no error. Envelope wrappers are the most dangerous case: `json.decode(data, type=InnerType)` when the data is `{"wrapper": {...}}` gives an empty `InnerType`, not an exception.

## Never use from __future__ import annotations in msgspec files

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Never use from __future__ import annotations in msgspec files.

Evidence:
- AGENTS.md: `msgspec` inspects annotations at class-definition time. Lazy annotations break decoding for tagged unions and complex nested types. Affects production files **and** `conftest.py`.

## pytest-asyncio async fixtures default to function scope

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
pytest-asyncio async fixtures default to function scope.

Evidence:
- AGENTS.md: `scope="module"` async fixtures conflict with the default function-scoped event loop. Symptoms: `ScopeMismatch` or silently shared loops that close mid-suite. Default to function-scoped async clients.

## Litestar closures need __annotations__ not only __signature__

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Litestar closures need __annotations__ not only __signature__.

Evidence:
- AGENTS.md: When building route handlers via factory functions or `setattr`, Litestar reads `__annotations__` to derive parameter types — setting only `__signature__` is insufficient. Pyright also won't see dynamically attached methods; generate a `.pyi` stub for the class.

## Litestar is not assignable to Starlette ASGIApp for Mount

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Litestar is not assignable to Starlette ASGIApp for Mount.

Evidence:
- AGENTS.md: Pyright reports a type error when mounting Litestar under Starlette (e.g. for MCP). Add a narrow cast or a `# type: ignore[arg-type]` with a one-line rationale.

## Path dependencies don't exist inside Docker images

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Path dependencies don't exist inside Docker images.

Evidence:
- AGENTS.md: If `pyproject.toml` uses `[tool.uv.sources]` with local path deps, the Dockerfile must `COPY` or clone those directories before `uv sync`. The lockfile paths are relative to the host and don't exist in the container.

## Private submodule checkout in CI needs a PAT

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Private submodule checkout in CI needs a PAT.

Evidence:
- AGENTS.md: `actions/checkout` with `submodules: true` needs a token or SSH key that can read every private submodule. Using one deploy key for both the main repo and a submodule fails. Use an org-scoped PAT or a documented two-step checkout.

## uv sync can drop dev tools

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
uv sync can drop dev tools.

Evidence:
- AGENTS.md: After dependency changes, `complexipy`, `pyright`, and other dev-only tools may be removed if not in `[dependency-groups]`. Verify pre-commit hooks still work after any `uv sync`.

## asyncio.run per call leaks loop-bound httpx state

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
asyncio.run per call leaks loop-bound httpx state.

Evidence:
- AGENTS.md: Don't write a sync-over-async facade as `def m(self): return asyncio.run(self._async.m())` when the wrapped object holds a long-lived `httpx.AsyncClient` (or anything backed by `httpcore` / `anyio` streams).

## Unit Tests

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Unit Tests.

Evidence:
- projects/ai-assistant/AGENTS.md: Use `FakeMeritClient` (or equivalent test double) via dependency injection:

## Integration Tests

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Integration Tests.

Evidence:
- projects/ai-assistant/AGENTS.md: Mark with `@pytest.mark.integration` and skip without credentials:

## conftest.py Pattern

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
conftest.py Pattern.

Evidence:
- projects/ai-assistant/AGENTS.md: Skill `scripts/` packages and `tests/fixtures/` packages are activated automatically by the top-level `projects/ai-assistant/conftest.py` registry — it swaps `sys.modules['scripts']` (and `sys.modules['fixtures']`) to whichever skill pytest is currently collecting/running, so all skills' suites can be discovered in a single invocation. **No per-skill `sys.path.insert(...)` boilerplate is required.**

## Skill design

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Skill design.

Evidence:
- projects/ai-assistant/AGENTS.md: 1. **MECE skills.** A new skill earns its place only if it has a distinct prompt, distinct eval target, and at least one boundary the rest of the pipeline can call across. If it shares a prompt or its eval is a subset of another's, it is a function inside that skill, not its own. 2. **MECE evals.** One file per autonomy axis (L1 reasoning, L2 single-invoice, L3 supervised post, L4 batch + orchestrator E2E, L5 autonomous folder). Before adding a case, find the file that owns the axis. If none, create the file. 3. **Every skill earns its keep through reasoning.** A skill is not a thin wrapper over a code call — if all it does is execute deterministic code, it is a function in `merit-common-utilities`, not a skill. The reasoning belongs to the agent; the mechanics belong to library code. 4. **Reasoning and computation are separated within a skill.** The agent reasons and emits frozen `msgspec.Struct` decision objects (`ClassifyDecision`, `ReviewDecision`, …) keyed by row id; one `apply_classifications` call joins them onto the frame. Pyright catches typos at construction time. The agent never writes `with_columns(pl.lit(...))` — every line of code it produces is a chance to be wrong. S5 (articles) chooses; S6 (VAT) derives — pull deterministic steps out of the reasoning prompt entirely.

## Code & data

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Code & data.

Evidence:
- projects/ai-assistant/AGENTS.md: 5. **`SKILL.md` documents intent; source discovery handles signatures.** Avoid exhaustive signatures or types in `SKILL.md`; use `source_roots`, `inspect_prefixes`, and `inspect_python` for current code details. Keep public wrappers importable from `scripts/__init__.py`; `_` prefix means private. 6. **Examples per skill, included from `SKILL.md`.** Code blocks live in `scripts/examples/block_<n>_<topic>.py` and are pulled in with an `@<path>` marker on its own line. Examples must `pyright`-check clean — they are the regression test for `SKILL.md` drift. 7. **State flows as named parquet handles**, not as a struct. Primary handle goes first in the `<result>` markdown body — the workflow engine reads link 1 as `NodeResultItem.Uri`. 8. **Hard-stops are data, not exceptions.** Tokens in `open_flags` (JSON list). Every stage from S2 onward calls `split_hard_stops` at entry, processes the active partition, and `pl.concat([active, skipped], how="diagonal_relaxed")` on exit. Apply schema **before** the split or all-hard-stopped batches drop columns. 9. **Column names live in `StrEnum`s.** No string literals in `select` / `with_columns` / `join` / `filter`. 10. **Cascade re-derives every dependent column.** Change VAT → recompute every total that touches it. Change article → recompute GL default. Half-cascades leave the frame internally inconsistent. 11. **Validate against the live computation**, not stored columns (e.g. S8 checks the computed `line_vat` from S6, never a stale OCR-extracted line-level VAT amount). 12. **Flat-package imports cross skills**, with `# type: ignore[import-not-found]`. Relative imports inside the skill. Never `from <skill>.scripts.<module> import …`. 13. **Cognitive complexity stays low.** When a function exceeds the threshold, simplify the data flow (declarative table, polars expression, `when().then()`) — extracting helpers usually hides complexity, not removes it.

## Tests & process

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Tests & process.

Evidence:
- projects/ai-assistant/AGENTS.md: 14. **Tests per skill.** Every skill ships its own `tests/unit/`, `tests/integration/`, `tests/fixtures/`. No shared fixtures across skills. The top-level `projects/ai-assistant/conftest.py` registry exposes each skill's `scripts/` (and optional `tests/fixtures/`) as the active `sys.modules` slots during collection — no per-skill `sys.path.insert(...)` boilerplate. A skill's `tests/conftest.py` is only required when declaring skill-specific fixtures (e.g. `skill_http_config` for HTTP suites). 15. **Fixtures look like real extractions.** No leaked classifications in line-item text — the agent should infer, not be told. msgspec decoders test against a real captured response, not a hand-written dict (FG-1). 16. **Verification quartet after every change**: `pytest` · `ruff check` · `pyright` · `complexipy`. Pre-commit must pass; treat warnings as failures. 17. **Conventional commits scoped to the skill.** `feat(merit-purchase-validate): …`, `fix(merit-purchase-post): …`, `refactor(merit): …`. One logical change per commit. One worktree per skill for parallel work. 18. **No backwards-compatibility code unless asked.** Refactors land on the latest state; broken callers get fixed, not shimmed.
