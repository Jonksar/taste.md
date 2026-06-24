# taste.md

- Target framework: net10.0, LangVersion 14, nullable reference types enabled.
- Naming: .editorconfig enforces C# conventions; see GL006 for domain naming rules.
- DTOs: Use required for mandatory fields, [JsonPropertyName("snake_case")] for JSON serialization.
- DI: Register services with appropriate lifetimes; not every helper needs to be a service.
- Controllers/services: New API work should follow thin controller + scoped service boundaries; see GL003-R08. A good established example is Workflows/Workflows/Api/WorkflowRuns/WorkflowRunsController.cs with WorkflowRunsService.cs.
- EF Core: Soft-delete via interceptors, audit fields (created_at, updated_at).
- Temporal: Activities + workflows with tenant-scoped interceptors.
- MCP: Tool registration in Workflows.Mcp.Dto; descriptions stay lean (token budget).
- Verification.
- C# ice tests.
- Python table-extractor tests.
