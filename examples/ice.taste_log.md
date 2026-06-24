# taste_log.md

Generated taste audit log. Keep this beside `taste.md` when you want to inspect confidence, evidence, and contradictions.

Formula: `confidence = clamp01(reward - lambda * anchorDrift)`
Lambda Semantic: `taste inertia`

## Target framework: net10.0, LangVersion 14, nullable reference types enabled

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Target framework: net10.0, LangVersion 14, nullable reference types enabled.

Evidence:
- AGENTS.md: Target framework: net10.0, LangVersion 14, nullable reference types enabled

## Naming: .editorconfig enforces C# conventions; see GL006 for domain naming rules

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Naming: .editorconfig enforces C# conventions; see GL006 for domain naming rules.

Evidence:
- AGENTS.md: Naming: .editorconfig enforces C# conventions; see GL006 for domain naming rules

## DTOs: Use required for mandatory fields, [JsonPropertyName("snake_case")] for JSON serialization

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
DTOs: Use required for mandatory fields, [JsonPropertyName("snake_case")] for JSON serialization.

Evidence:
- AGENTS.md: DTOs: Use required for mandatory fields, [JsonPropertyName("snake_case")] for JSON serialization

## DI: Register services with appropriate lifetimes; not every helper needs to be a service

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
DI: Register services with appropriate lifetimes; not every helper needs to be a service.

Evidence:
- AGENTS.md: DI: Register services with appropriate lifetimes; not every helper needs to be a service

## Controllers/services: New API work should follow thin controller + scoped service boundaries; see GL003-R08. A good established example is Workflows/Workflows/Api/WorkflowRuns/WorkflowRunsController.cs with WorkflowRunsService.cs.

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Controllers/services: New API work should follow thin controller + scoped service boundaries; see GL003-R08. A good established example is Workflows/Workflows/Api/WorkflowRuns/WorkflowRunsController.cs with WorkflowRunsService.cs.

Evidence:
- AGENTS.md: Controllers/services: New API work should follow thin controller + scoped service boundaries; see GL003-R08. A good established example is Workflows/Workflows/Api/WorkflowRuns/WorkflowRunsController.cs with WorkflowRunsService.cs.

## EF Core: Soft-delete via interceptors, audit fields (created_at, updated_at)

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
EF Core: Soft-delete via interceptors, audit fields (created_at, updated_at).

Evidence:
- AGENTS.md: EF Core: Soft-delete via interceptors, audit fields (created_at, updated_at)

## Temporal: Activities + workflows with tenant-scoped interceptors

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Temporal: Activities + workflows with tenant-scoped interceptors.

Evidence:
- AGENTS.md: Temporal: Activities + workflows with tenant-scoped interceptors

## MCP: Tool registration in Workflows.Mcp.Dto; descriptions stay lean (token budget)

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
MCP: Tool registration in Workflows.Mcp.Dto; descriptions stay lean (token budget).

Evidence:
- AGENTS.md: MCP: Tool registration in Workflows.Mcp.Dto; descriptions stay lean (token budget)

## Verification

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Verification.

Evidence:
- docs/superpowers/specs/2026-06-03-email-to-file-library-ingestion-design.md: Manual: **done (2026-06-03)** — a forward to `asd+invoices@reiterate.com` reached `email-receiver@reiterate.com` with the `+invoices` tag preserved in `To:`, confirming catch-all delivery for an unrecognized base and tag preservation. The remaining manual check is end-to-end after the `EmailService` change ships: the same forward should produce an `email_logs` row and a file in `"YYYY-MM invoices"`.

## C# ice tests

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
C# ice tests.

Evidence:
- docs/superpowers/specs/2026-06-16-bank-transaction-code-tag-design.md: Add or update tests around `TagsServiceSplitModelTests`:

## Python table-extractor tests

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Python table-extractor tests.

Evidence:
- docs/superpowers/specs/2026-06-16-bank-transaction-code-tag-design.md: Add or update tests around tagging and tag extraction:
