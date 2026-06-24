# taste.md

Generated taste preferences. Include this file from `AGENTS.md` or `CLAUDE.md` when you want agents to apply these evidence-backed project preferences.

Formula: `confidence = clamp01(reward - lambda * anchorDrift)`
Lambda Semantic: `taste inertia`

## Implemented behavior must match the contract

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Implemented behavior must match the contract.

Evidence:
- guidelines/GL001_http_openapi_dto_contracts.md: If a request DTO exposes fields such as a file name list, the handler and downstream logic must apply them. Silent partial success—ignoring inputs the client sent—is a contract bug.

## Explicit wire mapping with snake_case JSON

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Explicit wire mapping with snake_case JSON.

Evidence:
- guidelines/GL001_http_openapi_dto_contracts.md: Outward-facing DTOs should map JSON with `[JsonPropertyName("snake_case")]` and mark mandatory fields `required`. Avoid relying on global naming policies or implicit defaults that drift from the published OpenAPI.

## Honest nullability and required

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Honest nullability and required.

Evidence:
- guidelines/GL001_http_openapi_dto_contracts.md: Use `required string` for mandatory values and `string?` when absent is valid. A non-nullable reference without `required` can deserialize as `null` or default without surfacing a problem until later.

## Consistent header naming

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Consistent header naming.

Evidence:
- guidelines/GL001_http_openapi_dto_contracts.md: Converge on one spelling per concept (for example `x-user-email`, `x-organization`). Use the same canonical names in middleware, handlers, and integration tests so callers are not expected to try multiple variants.

## Handle missing vs empty headers correctly

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Handle missing vs empty headers correctly.

Evidence:
- guidelines/GL001_http_openapi_dto_contracts.md: Treat missing headers and empty string values as different cases. Prefer `StringValues` comparisons so you do not conflate "header absent" with "header present but blank".

## Mutually exclusive behaviors as separate endpoints

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Mutually exclusive behaviors as separate endpoints.

Evidence:
- guidelines/GL001_http_openapi_dto_contracts.md: Do not overload a single flag or string to mean unrelated modes ("download as-is" vs "convert for tables"). Split into distinct routes or operations so OpenAPI and clients stay unambiguous.

## Consistent filter/search semantics

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Consistent filter/search semantics.

Evidence:
- guidelines/GL001_http_openapi_dto_contracts.md: List and search endpoints that accept the same kind of filter (name, email, status) should share rules for case sensitivity, trimming, and partial vs exact match unless documented otherwise.

## CancellationToken forwarding

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
CancellationToken forwarding.

Evidence:
- guidelines/GL001_http_openapi_dto_contracts.md: Public async methods that accept `CancellationToken` must pass it (or a linked token) to all downstream async I/O: EF Core, `HttpClient`, streams, and other awaitable APIs.

## Map invalid input to 4xx

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Map invalid input to 4xx.

Evidence:
- guidelines/GL002_errors_status_codes_and_observable_semantics.md: Validation failures and bad client input should map to `400`, `404`, `422`, etc., via the project’s exception types and middleware—not bubble up as unhandled `500` responses.

## Try* methods must not throw

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Try* methods must not throw.

Evidence:
- guidelines/GL002_errors_status_codes_and_observable_semantics.md: Methods named `Try*` should report success or failure without throwing for the expected failure path. Separate parsing or lookup from exceptions used for control flow.

## Refactors preserve observable semantics

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Refactors preserve observable semantics.

Evidence:
- guidelines/GL002_errors_status_codes_and_observable_semantics.md: When restructuring code, keep defaults, error payload shapes, header precedence, and merge rules identical unless the change is explicitly versioned and documented.

## await using for streams and resources

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
await using for streams and resources.

Evidence:
- guidelines/GL002_errors_status_codes_and_observable_semantics.md: Use `await using` for async-disposable resources (`IAsyncDisposable`) so disposal runs even if code after acquisition throws.

## Handle null after deserialization

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Handle null after deserialization.

Evidence:
- guidelines/GL002_errors_status_codes_and_observable_semantics.md: `JsonSerializer.Deserialize<T>` returns `default(T)` for `null` JSON or failure modes—do not suppress with `!` on untrusted payloads.

## Narrowly scoped exception handling

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Narrowly scoped exception handling.

Evidence:
- guidelines/GL002_errors_status_codes_and_observable_semantics.md: Catch the specific exception you can recover from. Catching `Exception` hides programming errors and unrelated failures.

## Health/alerting aggregates must not contradict underlying results

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Health/alerting aggregates must not contradict underlying results.

Evidence:
- guidelines/GL002_errors_status_codes_and_observable_semantics.md: Aggregates for health checks and alerts must not report success when inner steps failed, and summaries must not contradict detail results.

## Shell helpers must report failure when commands fail

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Shell helpers must report failure when commands fail.

Evidence:
- guidelines/GL002_errors_status_codes_and_observable_semantics.md: Shell wrappers and process helpers must propagate non-zero exit codes and surface command failure—do not print success while the underlying command failed or exits non-zero.

## Not every helper needs to be a DI service

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Not every helper needs to be a DI service.

Evidence:
- guidelines/GL003_architecture_di_lifetime_and_layering.md: Stateless utilities and small orchestration types can be plain classes or extension methods. Register services when you need substitution, per-scope state, or external resources.

## Service lifetime must match mutable state

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Service lifetime must match mutable state.

Evidence:
- guidelines/GL003_architecture_di_lifetime_and_layering.md: A scoped service is created per request (or per scope). Mutable counters or caches on that service reset when the scope ends—match lifetime to how long state must live.

## Reduce parameter arity

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Reduce parameter arity.

Evidence:
- guidelines/GL003_architecture_di_lifetime_and_layering.md: Long parameter lists obscure call sites and encourage positional mistakes. Prefer a context object or split methods along cohesive axes.

## DTO packages stay DTO-only

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
DTO packages stay DTO-only.

Evidence:
- guidelines/GL003_architecture_di_lifetime_and_layering.md: Keep request/response models and OpenAPI shapes in DTO assemblies free of mapping logic. Map between domain and wire in application or infrastructure layers.

## Feature config lives with the feature

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Feature config lives with the feature.

Evidence:
- guidelines/GL003_architecture_di_lifetime_and_layering.md: Buckets, queues, and flags specific to a feature belong in that feature’s configuration and registration, not in generic shared modules such as `Common.Aws`, unless they are truly cross-cutting primitives.

## Pick the right API boundary

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Pick the right API boundary.

Evidence:
- guidelines/GL003_architecture_di_lifetime_and_layering.md: Internal callers should use internal services or integration clients, not customer-facing BFF routes, when a direct in-process or service-to-service call is clearer and cheaper.

## PR scope discipline

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
PR scope discipline.

Evidence:
- guidelines/GL003_architecture_di_lifetime_and_layering.md: Keep structural refactors separate from behavior changes. Do not combine mechanical moves (folders, namespaces, DI wiring) with edits to business rules, defaults, or validation in the same pull request.

## Keep controllers thin

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Keep controllers thin.

Evidence:
- guidelines/GL003_architecture_di_lifetime_and_layering.md: Controllers should define the HTTP surface: routes, authorization, header/path/query/body binding, and HTTP result mapping. Put validation, lookups, persistence, downstream calls, DTO mapping, and domain orchestration in scoped services.

## No N+1 queries

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
No N+1 queries.

Evidence:
- guidelines/GL004_data_access_ef_core_and_sql_migrations.md: Do not execute database lookups inside per-row loops. Batch-load related data first, then join in memory or use a single query with includes.

## EF Include must be assigned

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
EF Include must be assigned.

Evidence:
- guidelines/GL004_data_access_ef_core_and_sql_migrations.md: `Include` returns a new `IQueryable`. If you discard the return value, related entities are not loaded.

## Migration house conventions

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Migration house conventions.

Evidence:
- guidelines/GL004_data_access_ef_core_and_sql_migrations.md: Use `DEFAULT gen_random_uuid()` for UUID primary keys, add standard audit columns on new tables, and grant tenant roles consistently.

## Never edit deployed migrations

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Never edit deployed migrations.

Evidence:
- guidelines/GL004_data_access_ef_core_and_sql_migrations.md: Migrations that have run anywhere are immutable. Add a follow-up migration instead of rewriting history.

## Tenant-schema migrations use placeholders

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Tenant-schema migrations use placeholders.

Evidence:
- guidelines/GL004_data_access_ef_core_and_sql_migrations.md: Reference tenant objects with `$schema$`, not a fixed schema name.

## Defensive drops

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Defensive drops.

Evidence:
- guidelines/GL004_data_access_ef_core_and_sql_migrations.md: Removal scripts should tolerate partial application and drift across environments.

## FK and ON DELETE conventions

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
FK and ON DELETE conventions.

Evidence:
- guidelines/GL004_data_access_ef_core_and_sql_migrations.md: New `*_id` reference columns should declare foreign keys. Prefer `ON DELETE SET NULL` when the child can outlive optional parents.

## Dictionary keys must be safe for duplicates

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Dictionary keys must be safe for duplicates.

Evidence:
- guidelines/GL004_data_access_ef_core_and_sql_migrations.md: `ToDictionary` throws when keys repeat. Use `GroupBy` plus aggregation, `ToLookup`, or explicit duplicate handling.

## Registration matches interfaces

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Registration matches interfaces.

Evidence:
- guidelines/GL005_mcp_tool_contracts_and_registration.md: Every tool exposed to discovery must have a live handler implementation. Remove registration when the implementation is deleted.

## Tool docs align with implementation

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Tool docs align with implementation.

Evidence:
- guidelines/GL005_mcp_tool_contracts_and_registration.md: Descriptions and parameter docs must reflect real behavior after refactors.

## Defaults must not accidentally clear data

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Defaults must not accidentally clear data.

Evidence:
- guidelines/GL005_mcp_tool_contracts_and_registration.md: Optional DTO fields with sentinel defaults must not overwrite existing state on partial PATCH-style updates.

## Descriptions stay lean

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Descriptions stay lean.

Evidence:
- guidelines/GL005_mcp_tool_contracts_and_registration.md: Keep MCP tool and parameter descriptions short; put long examples in tests or human docs.

## Types shared between HTTP and MCP need JSON attributes

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Types shared between HTTP and MCP need JSON attributes.

Evidence:
- guidelines/GL005_mcp_tool_contracts_and_registration.md: Query-bound models reused for MCP JSON need explicit JSON names, not only `[FromQuery]`.

## Method ordering follows usage (Style — also applicable to non-MCP service classes)

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Method ordering follows usage (Style — also applicable to non-MCP service classes).

Evidence:
- guidelines/GL005_mcp_tool_contracts_and_registration.md: Order MCP service methods in the same sequence a typical session uses them.

## Use precise domain vocabulary

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use precise domain vocabulary.

Evidence:
- guidelines/GL006_naming_and_domain_semantics.md: Prefer the domain term that matches the concept: template, expression, content, and similar words are not interchangeable.

## Names match what call sites pass

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Names match what call sites pass.

Evidence:
- guidelines/GL006_naming_and_domain_semantics.md: Parameter names should describe the value callers provide, not an internal representation detail.

## Domain constants over string literals

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Domain constants over string literals.

Evidence:
- guidelines/GL006_naming_and_domain_semantics.md: Compare using named constants or enums instead of scattered magic strings.

## No shadowing of context types

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
No shadowing of context types.

Evidence:
- guidelines/GL006_naming_and_domain_semantics.md: Avoid locals named `context` when a framework or tenant context is already in scope.

## Consistent naming within a change

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Consistent naming within a change.

Evidence:
- guidelines/GL006_naming_and_domain_semantics.md: New types and file names should follow the naming pattern already used in that feature area.

## CancellationToken convention

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
CancellationToken convention.

Evidence:
- guidelines/GL006_naming_and_domain_semantics.md: Use `cancellationToken` or the team-standard abbreviation `ct` consistently; avoid ambiguous `token`.

## Validate configuration at startup

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Validate configuration at startup.

Evidence:
- guidelines/GL007_configuration_validation_and_operational_realism.md: Fail fast with explicit messages when required settings are missing or invalid. Avoid eager static fields that throw during type initialization when a variable is optional for some environments.

## Non-production must not point at production infrastructure

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Non-production must not point at production infrastructure.

Evidence:
- guidelines/GL007_configuration_validation_and_operational_realism.md: Review builder overrides for S3 bucket names, queue names, and connection strings. Pointing staging or local compose at production resources is a blocking review finding.

## .env.example stays truthful

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
.env.example stays truthful.

Evidence:
- guidelines/GL007_configuration_validation_and_operational_realism.md: Every setting the application reads at runtime should appear in `.env.example`. Use obviously fake placeholders, and document intentional duplication (for example, the same queue name referenced from two services).

## Safe config parsing

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Safe config parsing.

Evidence:
- guidelines/GL007_configuration_validation_and_operational_realism.md: Prefer established parsing helpers and explicit failure modes instead of `int.Parse` on raw environment strings that may be empty or malformed.

## Cross-service configuration keys must align

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Cross-service configuration keys must align.

Evidence:
- guidelines/GL007_configuration_validation_and_operational_realism.md: Mismatched names such as `TEMPORAL_QUEUE` versus `TEMPORAL_TASK_QUEUE` across services cause workers to poll the wrong queue with no obvious error at build time.

## When changing limits, update every enforcement point

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
When changing limits, update every enforcement point.

Evidence:
- guidelines/GL007_configuration_validation_and_operational_realism.md: Raising a limit in one layer (for example, controllers) while leaving validation or downstream checks at the old value creates user-visible inconsistency and support churn.

## Docker Compose conventions — depends_on, pinned image versions

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Docker Compose conventions — depends_on, pinned image versions.

Evidence:
- guidelines/GL007_configuration_validation_and_operational_realism.md: Declare `depends_on` when one container needs another to be started first for meaningful operation. Pin image digests or semver tags; avoid unpinned `:latest` in anything meant to be reproducible.

## Startup readiness — wait for dependencies before accepting traffic

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Startup readiness — wait for dependencies before accepting traffic.

Evidence:
- guidelines/GL007_configuration_validation_and_operational_realism.md: Fail fast or retry until dependencies such as databases are reachable before the host accepts traffic, so early requests do not fail opaquely.

## Whitelist tenant headers

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Whitelist tenant headers.

Evidence:
- guidelines/GL008_multitenancy_security_and_authorization.md: Do not copy all inbound headers into tenant or trace context. Accept only headers your application owns and documents.

## Resolve tenant or organization at invocation time

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Resolve tenant or organization at invocation time.

Evidence:
- guidelines/GL008_multitenancy_security_and_authorization.md: Read organization and user headers when the HTTP request is handled, not in constructors or field initializers. Background jobs and scoped services will otherwise capture stale or empty values.

## Escape SQL wildcards

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Escape SQL wildcards.

Evidence:
- guidelines/GL008_multitenancy_security_and_authorization.md: User-controlled strings used in `LIKE` or `ILIKE` must escape `%` and `_` so users cannot broaden matches unintentionally or probe data.

## Validate filenames before S3 keys

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Validate filenames before S3 keys.

Evidence:
- guidelines/GL008_multitenancy_security_and_authorization.md: Reject path-like or traversal names rather than silently stripping characters. Build object keys only from validated segments.

## New controllers must carry [Authorize]

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
New controllers must carry [Authorize].

Evidence:
- guidelines/GL008_multitenancy_security_and_authorization.md: When the API uses per-controller authorization rather than global `RequireAuthorization()`, omitting the attribute exposes anonymous access.

## Tenant propagation consistency

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Tenant propagation consistency.

Evidence:
- guidelines/GL008_multitenancy_security_and_authorization.md: Apply the same tenant scope and header extraction for every similar message publisher so consumers always see the same context shape.

## Do not read JWT claims before middleware runs

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Do not read JWT claims before middleware runs.

Evidence:
- guidelines/GL008_multitenancy_security_and_authorization.md: Avoid field initializers or constructor bodies that assume `User`, email, or tenant claims exist before authentication middleware has executed.

## Remove dead code after refactors

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Remove dead code after refactors.

Evidence:
- guidelines/GL009_code_hygiene_and_review_discipline.md: Delete unused usings, unused constructor parameters, unreachable types, and no-op helpers. Keep dependency injection surfaces minimal and honest.

## Comments explain "why" not "what"

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Comments explain "why" not "what".

Evidence:
- guidelines/GL009_code_hygiene_and_review_discipline.md: Comments should capture rationale, invariants, or tradeoffs. Do not narrate code that already states the same thing.

## AI-generated edits need extra vetting

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
AI-generated edits need extra vetting.

Evidence:
- guidelines/GL009_code_hygiene_and_review_discipline.md: Watch for large commented blocks that re-enable old code, accidental formatting-only churn, and configuration changes bundled with unrelated edits. Treat AI-assisted pull requests as higher risk until proven otherwise.

## Async surface should be honest

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Async surface should be honest.

Evidence:
- guidelines/GL009_code_hygiene_and_review_discipline.md: Methods that perform I/O should be `async` and return `Task` / `Task<T>`. Avoid synchronous public APIs that block on network or disk.

## Do not commit machine-local artifacts

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Do not commit machine-local artifacts.

Evidence:
- guidelines/GL009_code_hygiene_and_review_discipline.md: Avoid checked-in `TestResults` GUID paths, coverage output, and developer-specific `.csproj` `UserProperties`. Keep the repository reproducible on any machine.

## When deleting features, ensure remaining coverage

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
When deleting features, ensure remaining coverage.

Evidence:
- guidelines/GL009_code_hygiene_and_review_discipline.md: Removing tests for deleted features is correct, but re-run coverage or risk analysis on adjacent flows so regressions are not unguarded.

## Prefer arrays over List<T> for immutable results

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Prefer arrays over List<T> for immutable results.

Evidence:
- guidelines/GL009_code_hygiene_and_review_discipline.md: For fixed-shape, read-only API results, `T[]` signals immutability and avoids accidental mutation by callers.

## Don't reach ActivityExecutionContext from HTTP/non-activity code

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Don't reach ActivityExecutionContext from HTTP/non-activity code.

Evidence:
- guidelines/GL010_temporal_and_durable_execution.md: Workflow and activity code must not assume HTTP request scope. Do not read `ActivityExecutionContext` (or other Temporal activity host state) from ASP.NET Core controllers, middleware, or other non-activity entry points.

## Don't use nullable CancellationToken? on activity signatures called from non-activity code

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Don't use nullable CancellationToken? on activity signatures called from non-activity code.

Evidence:
- guidelines/GL010_temporal_and_durable_execution.md: Helpers and services invoked from both MVC (or other non-Temporal callers) and activities must use ordinary `CancellationToken` parameters. Nullable `CancellationToken?` defaults invite wrong overload resolution and blur host boundaries.

## Timeouts must be coherent with real upper bounds

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Timeouts must be coherent with real upper bounds.

Evidence:
- guidelines/GL010_temporal_and_durable_execution.md: `StartToCloseTimeout`, `ScheduleToCloseTimeout`, and related limits must reflect **documented worst-case** duration for the operation (including retries and downstream slowness), not optimistic defaults.

## Payloads stay replay-safe

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Payloads stay replay-safe.

Evidence:
- guidelines/GL010_temporal_and_durable_execution.md: Workflow inputs, signals, and query results deserialized from history must remain compatible with **older** serialized payloads. Adding required JSON members without a rollout strategy breaks in-flight workflows on replay.

## Do not remove unrelated interceptors

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Do not remove unrelated interceptors.

Evidence:
- guidelines/GL010_temporal_and_durable_execution.md: Worker registration changes (including reverts) must preserve cross-cutting interceptors such as `TracingInterceptor`. Dropping them removes trace context propagation without a compile-time error.

## Do not drop tenant or organization wiring

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Do not drop tenant or organization wiring.

Evidence:
- guidelines/GL010_temporal_and_durable_execution.md: Interceptors or middleware that set `OrganizationProvider`, tenant IDs, or similar ambient context must remain unless **every** activity has an explicit alternative (e.g. passing `OrganizationId` on every input and never reading ambient state).

## Activity rename and removal are rollout risks

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Activity rename and removal are rollout risks.

Evidence:
- guidelines/GL010_temporal_and_durable_execution.md: Renaming or removing an activity type breaks workflows that still have **scheduled or retrying** tasks referencing the old name. Treat renames as a **versioned migration** (deprecate old activity, deploy workers that implement both, drain in-flight, then remove).

## Use IHttpClientFactory, not new HttpClient()

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use IHttpClientFactory, not new HttpClient().

Evidence:
- guidelines/GL011_performance_async_and_remote_io.md: Creating `new HttpClient()` per request (especially from scoped services) exhausts ephemeral ports and causes `SocketException` under load. Resolve clients from `IHttpClientFactory` or typed `HttpClient` registered with `AddHttpClient`.

## Reset stream Position before re-read (only when seekable)

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Reset stream Position before re-read (only when seekable).

Evidence:
- guidelines/GL011_performance_async_and_remote_io.md: After writing to a stream (for example via `CopyToAsync` or a library `SaveAs`), callers that need to read the same buffer must reset `Position`. Non-seekable streams (many network streams) cannot be rewound; branching on `CanSeek` avoids spurious exceptions.

## I/O tradeoffs should be intentional

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
I/O tradeoffs should be intentional.

Evidence:
- guidelines/GL011_performance_async_and_remote_io.md: An extra S3 `HeadObject` or metadata round-trip for validation is fine when the team **documents** the reason (integrity, concurrency guard). Accidental duplicate calls from copy-paste or redundant validation paths waste money and latency.

## Prefer provider-native remote operations

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Prefer provider-native remote operations.

Evidence:
- guidelines/GL011_performance_async_and_remote_io.md: For object storage, prefer server-side copy APIs over download-then-reupload. For HTTP list APIs, follow pagination cursors until the API reports completion instead of assuming a single page fits all rows.

## Avoid scalability-hostile patterns

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid scalability-hostile patterns.

Evidence:
- guidelines/GL011_performance_async_and_remote_io.md: Loading entire tables into memory and filtering in process (for example JSON contains checks for GUIDs) does not scale and bypasses indexes. Push predicates to the database with proper indexing.

## Do not accept expensive inputs then ignore them

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Do not accept expensive inputs then ignore them.

Evidence:
- guidelines/GL011_performance_async_and_remote_io.md: If a method kicks off parallel downloads or remote calls, the implementation must **consume** the results for correctness. Silent discards hide bugs and burn cost.

## Distributed locks must cover all side effects

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Distributed locks must cover all side effects.

Evidence:
- guidelines/GL012_concurrency_atomicity_and_locking.md: If a lock protects a sequence such as append to storage then publish a message, releasing the lock **between** steps allows another worker to interleave. Hold one lock for the full causal chain or redesign idempotency boundaries.

## Lock consistently or enforce a single-threaded contract

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Lock consistently or enforce a single-threaded contract.

Evidence:
- guidelines/GL012_concurrency_atomicity_and_locking.md: Types with shared mutable fields (`_position`, counters, buffers) that are used from multiple threads must synchronize **every** mutating path or document that the type is owned by a single thread (for example, only used inside one hosted service loop).

## Multi-step persistence should be transactional

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Multi-step persistence should be transactional.

Evidence:
- guidelines/GL012_concurrency_atomicity_and_locking.md: Deleting or updating related aggregates in multiple `SaveChanges` calls without a transaction can leave the database in a **partial** state if the second save fails.

## Rollback paths preserve cross-cutting side effects

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Rollback paths preserve cross-cutting side effects.

Evidence:
- guidelines/GL012_concurrency_atomicity_and_locking.md: Compensation logic after a failed step must run the same external cleanup, domain events, and notifications as the happy-path delete. Skipping Auth0 offboarding or tenant deletion events on rollback leaves orphaned external state.

## Case-insensitive header maps

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Case-insensitive header maps.

Evidence:
- guidelines/GL012_concurrency_atomicity_and_locking.md: HTTP headers are case-insensitive. Building `Dictionary<string, string>` from incoming headers with default comparer can throw on "Authorization" vs "authorization" duplicates.

## Avoid time-of-check-time-of-use races

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid time-of-check-time-of-use races.

Evidence:
- guidelines/GL012_concurrency_atomicity_and_locking.md: Checking `File.Exists` or `HeadObject` then performing the operation creates a race: another process can delete or replace the object between check and use. Prefer **try the operation** and handle `NotFound`, or use atomic APIs (conditional writes, etags).
