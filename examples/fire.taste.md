# taste.md

Generated taste preferences. Include this file from `AGENTS.md` or `CLAUDE.md` when you want agents to apply these evidence-backed project preferences.

Formula: `confidence = clamp01(reward - lambda * anchorDrift)`
Lambda Semantic: `taste inertia`

## No Duplication

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
No Duplication.

Evidence:
- guidelines/GL001_environment_configuration.md: A variable must appear in either `.env.defaults` OR `.env.example`, **never both**. * Has default? → `.env.defaults` * Needs secret/user input? → `.env.example`

## Load Order in Code

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Load Order in Code.

Evidence:
- guidelines/GL001_environment_configuration.md: Applications should load environment variables in this specific order to allow overrides: 1. Load `.env` (overrides defaults) 2. Load `.env.defaults` (provides fallbacks)

## Use .envrc for Local Dev

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use .envrc for Local Dev.

Evidence:
- guidelines/GL001_environment_configuration.md: Use `.envrc` (with direnv) to automatically load defaults in the shell.

## Minimal Environment Variables

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Minimal Environment Variables.

Evidence:
- guidelines/GL001_environment_configuration.md: Avoid defining environment variables for internal constants. Use them only for: * External service API keys/secrets. * Infrastructure settings that change between environments (dev/prod). * Feature flags.

## Implicit Client Configuration

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Implicit Client Configuration.

Evidence:
- guidelines/GL001_environment_configuration.md: Do not manually pass environment variables to clients that auto-discover them.

## Avoid Opaque Configuration

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid Opaque Configuration.

Evidence:
- guidelines/GL001_environment_configuration.md: Avoid using generic environment variables (like `ENV=PROD`) to infer multiple behaviors. Use specific flags for specific features.

## Use Custom Exception Classes

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use Custom Exception Classes.

Evidence:
- guidelines/GL002_error_handling.md: Create domain-specific exception classes instead of raising `HTTPException` directly in business logic. Inherit from Python's built-in exceptions where appropriate (e.g. `ValueError`) or the base `Exception`.

## Handle Exceptions at the Route Layer

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Handle Exceptions at the Route Layer.

Evidence:
- guidelines/GL002_error_handling.md: Convert custom exceptions to HTTP responses in route handlers. Group related exceptions when possible.

## Preserve Exception Context

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Preserve Exception Context.

Evidence:
- guidelines/GL002_error_handling.md: Always use `raise ... from e` when wrapping exceptions to preserve the original traceback.

## Define Error Classes Close to Usage

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Define Error Classes Close to Usage.

Evidence:
- guidelines/GL002_error_handling.md: Place exception classes in the module where they are primarily used, or in a dedicated `exceptions.py` if shared within a package.

## Use Consistent Error Codes

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use Consistent Error Codes.

Evidence:
- guidelines/GL002_error_handling.md: Define error codes as constants and use them consistently across the application for programmatic error handling.

## Catch Specific Exceptions

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Catch Specific Exceptions.

Evidence:
- guidelines/GL002_error_handling.md: Never catch `Exception` broadly unless you are at the very top level (entry point) or strictly logging/re-raising. Catch specific exceptions (e.g., `msgspec.ValidationError`, `KeyError`) to avoid masking unexpected errors.

## Log Full Exception Context

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Log Full Exception Context.

Evidence:
- guidelines/GL002_error_handling.md: When logging exceptions, always use `logger.exception` or pass `exc_info=True` to preserve the stack trace.

## Service Layer Pattern

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Service Layer Pattern.

Evidence:
- guidelines/GL003_code_organization.md: Centralize business logic in a "Service Layer" that is agnostic of the execution context (HTTP, Temporal, CLI).

## Interface Isolation (Keep the Edge Thin)

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Interface Isolation (Keep the Edge Thin).

Evidence:
- guidelines/GL003_code_organization.md: Interface layers should be thin wrappers that handle protocol-specifics (JSON serialization, DTOs, routing) and delegate work to the Service Layer.

## Distributed Data Models

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Distributed Data Models.

Evidence:
- guidelines/GL003_code_organization.md: Define data models (`msgspec.Struct`, `dataclass`) in the module that owns the logic, rather than forcing a single global `models.py`.

## Avoid Circular Dependencies

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid Circular Dependencies.

Evidence:
- guidelines/GL003_code_organization.md: Dependencies should flow towards the center (domain logic) and up to the Service Layer.

## Project Naming

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Project Naming.

Evidence:
- guidelines/GL003_code_organization.md: Choose project names that describe the **functionality** (domain), not the deployment method.

## Domain Event Purity

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Domain Event Purity.

Evidence:
- guidelines/GL003_code_organization.md: Events should represent domain state changes, not implementation details or external data transfer objects.

## Dependency Injection over Global State

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Dependency Injection over Global State.

Evidence:
- guidelines/GL003_code_organization.md: Inject dependencies (clients, config, headers) into classes/functions rather than accessing global state or environment variables directly within the implementation.

## Use msgspec.Struct for Data Models

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use msgspec.Struct for Data Models.

Evidence:
- guidelines/GL004_code_style.md: Prefer `msgspec.Struct` over `dataclasses` or `pydantic.BaseModel` for internal data structures and DTOs. It offers better performance and cleaner syntax.

## Enforce Strict Type Hinting

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Enforce Strict Type Hinting.

Evidence:
- guidelines/GL004_code_style.md: Use modern type hinting features. Enable strict type checking in your editor/linter. - Use `typing.Self` for return types of builder methods or classmethods returning instances. - Use `typing.Annotated` for dependency injection or extra metadata. - Avoid `Any` whenever possible.

## Use Polars for Data Processing

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use Polars for Data Processing.

Evidence:
- guidelines/GL004_code_style.md: Use `polars` for all dataframe and tabular data operations. Avoid `pandas`.

## Use Structured Logging

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use Structured Logging.

Evidence:
- guidelines/GL004_code_style.md: Use `structlog` instead of the standard `logging` module or `print` statements.

## Use Async Context Managers for Resources

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use Async Context Managers for Resources.

Evidence:
- guidelines/GL004_code_style.md: Use `@asynccontextmanager` for managing lifecycles of services, connections, or resources that need setup and teardown.

## Use Top-Level Imports

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use Top-Level Imports.

Evidence:
- guidelines/GL004_code_style.md: Avoid inline imports inside functions unless there's a specific reason (circular import avoidance, optional dependency).

## Avoid Magic Numbers

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid Magic Numbers.

Evidence:
- guidelines/GL004_code_style.md: Use configuration values or named constants instead of literal numbers in code.

## Avoid Mutating Data Structures

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid Mutating Data Structures.

Evidence:
- guidelines/GL004_code_style.md: Prefer immutable patterns over mutation, especially when working with shared data.

## Construct Objects with Correct Types

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Construct Objects with Correct Types.

Evidence:
- guidelines/GL004_code_style.md: Create objects with the correct types from the start instead of converting types after construction.

## Avoid Unnecessary Fields

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid Unnecessary Fields.

Evidence:
- guidelines/GL004_code_style.md: Don't add fields to models that aren't used. Remove `extra` fields, debug flags, or temporary additions before merging.

## Simplify & Reduce Verbosity

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Simplify & Reduce Verbosity.

Evidence:
- guidelines/GL004_code_style.md: Avoid unnecessary intermediate variables or explicit `field()` definitions in `msgspec.Struct` unless absolutely necessary.

## Pythonic Built-ins

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Pythonic Built-ins.

Evidence:
- guidelines/GL004_code_style.md: Use Python's built-in functions effectively. Avoid custom sorting logic when `max(iterable, key=...)` works. Use direct `datetime` comparisons.

## Avoid Unsafe Casting

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid Unsafe Casting.

Evidence:
- guidelines/GL004_code_style.md: Do not use `cast()` to force types if the design allows for proper type safety. Fix the interface or abstraction instead.

## Efficient Data Processing (Polars & Arrow)

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Efficient Data Processing (Polars & Arrow).

Evidence:
- guidelines/GL004_code_style.md: Minimize conversions between Polars DataFrames and PyArrow Tables. If a lightweight operation can be done in Arrow, do it there without converting to Polars.

## Write Concise, Human-Style Tests

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Write Concise, Human-Style Tests.

Evidence:
- guidelines/GL005_testing.md: Tests should be straightforward and focused. Avoid verbose patterns that emulate test frameworks or appear LLM-generated.

## Group Tests with Classes

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Group Tests with Classes.

Evidence:
- guidelines/GL005_testing.md: Grouping tests in classes is encouraged for organization and scoping fixtures, provided you avoid `setup_method`/`teardown_method` in favor of fixtures.

## Use pytest Fixtures Appropriately

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use pytest Fixtures Appropriately.

Evidence:
- guidelines/GL005_testing.md: Use fixtures for shared setup, but don't over-engineer test infrastructure. Fixtures can be defined within test classes for local scope.

## Use Parametrization

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use Parametrization.

Evidence:
- guidelines/GL005_testing.md: Use `@pytest.mark.parametrize` to test multiple input/output combinations concisely, rather than writing multiple similar test functions.

## Test Behavior, Not Implementation

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Test Behavior, Not Implementation.

Evidence:
- guidelines/GL005_testing.md: Focus tests on observable behavior and outputs, not internal implementation details.

## Async Testing

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Async Testing.

Evidence:
- guidelines/GL005_testing.md: For async functions, write async tests. Projects typically use `pytest-asyncio` with `asyncio_mode = "auto"`.

## Keep Test Files Focused

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Keep Test Files Focused.

Evidence:
- guidelines/GL005_testing.md: Each test file should focus on a single module or feature. Avoid mixing unrelated tests.

## Test Logic, Not Boilerplate

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Test Logic, Not Boilerplate.

Evidence:
- guidelines/GL005_testing.md: Avoid writing tests that verify trivial property assignments or existence. Tests must verify actual logic or behavior changes.

## Avoid Enum Mirror Tests

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid Enum Mirror Tests.

Evidence:
- guidelines/GL005_testing.md: Do not add tests that only assert enum members equal their literal string values (for example, `assert ReviewStatus.USER_APPROVED == "user_approved"`). These tests mirror declarations without validating behavior and are considered boilerplate.

## Test Prompt Contracts, Not Prompt Prose

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Test Prompt Contracts, Not Prompt Prose.

Evidence:
- guidelines/GL005_testing.md: Do not test `SKILL.md` or other prompt files by asserting literal prose fragments are substrings of the prompt text. For example, avoid `assert "...full instruction sentence..." in skill_text`; this pins wording instead of behavior.

## Efficient Fakes

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Efficient Fakes.

Evidence:
- guidelines/GL005_testing.md: When using `MemoryFileSystem` or similar fakes, modify the fake class itself to support required features (e.g., timestamps) rather than subclassing it in individual test files. This keeps tests cleaner and improves the shared test utilities.

## Never Commit .DS_Store Files

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Never Commit .DS_Store Files.

Evidence:
- guidelines/GL006_git_practices.md: macOS `.DS_Store` files should never be committed. They are already in the root `.gitignore`.

## Keep Changes Scoped to PR Purpose

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Keep Changes Scoped to PR Purpose.

Evidence:
- guidelines/GL006_git_practices.md: Do not include unrelated file changes in a pull request. Each PR should focus on a single feature or fix.

## Avoid Modifying Root-Level .gitignore

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Avoid Modifying Root-Level .gitignore.

Evidence:
- guidelines/GL006_git_practices.md: The root `.gitignore` applies to all projects. Only add entries that are truly universal. Project-specific ignores should go in project-level `.gitignore` files.

## Commit Lock Files

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Commit Lock Files.

Evidence:
- guidelines/GL006_git_practices.md: Always commit dependency lock files to ensure reproducible builds. This locks exact versions of dependencies for all developers and CI/CD.

## Commit Configuration Files

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Commit Configuration Files.

Evidence:
- guidelines/GL006_git_practices.md: Ensure project configuration files are committed to maintain consistent environments.

## Don't Commit IDE Workspace Files

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Don't Commit IDE Workspace Files.

Evidence:
- guidelines/GL006_git_practices.md: Files like `*.code-workspace`, `.idea/`, `.vscode/` with personal settings should not be committed unless they contain shared team configurations.

## Clean Up Before PR

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Clean Up Before PR.

Evidence:
- guidelines/GL006_git_practices.md: Before submitting a PR: 1. Remove debug print statements 2. Remove commented-out code 3. Remove temporary files 4. Verify no secrets in committed files

## Enable Docker BuildKit

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Enable Docker BuildKit.

Evidence:
- guidelines/GL007_cicd.md: Always enable BuildKit in GitHub workflows for better caching and performance.

## Python Projects with uv

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Python Projects with uv.

Evidence:
- guidelines/GL007_cicd.md: For Python projects, use `uv` for dependency management. Use the `astral-sh/setup-uv` action for setup and caching. Ensure you lock dependencies and use the correct Python version.

## Monorepo Working Directories

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Monorepo Working Directories.

Evidence:
- guidelines/GL007_cicd.md: When projects are located in subdirectories, define the working directory at the job level or use environment variables to avoid repetition and errors.

## Use Correct Branch Names

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use Correct Branch Names.

Evidence:
- guidelines/GL007_cicd.md: Ensure workflow triggers use the correct branch names. The main branch is `master` in this repo.

## Keep Workflows Minimal

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Keep Workflows Minimal.

Evidence:
- guidelines/GL007_cicd.md: Only include necessary steps in workflows. Avoid redundant builds or tests that are covered elsewhere.

## Use Consistent Workflow Naming

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use Consistent Workflow Naming.

Evidence:
- guidelines/GL007_cicd.md: Follow the naming convention: `porter_<project_name>.yml` for porter deployment workflows.

## Class-Based Activities with Dependency Injection

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Class-Based Activities with Dependency Injection.

Evidence:
- guidelines/GL008_temporal.md: Define activities as methods on an `attrs` class. This allows you to inject dependencies (like services or configuration) when initializing the worker, rather than relying on global state or complex closures.

## Use msgspec.Struct for Data Transfer

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Use msgspec.Struct for Data Transfer.

Evidence:
- guidelines/GL008_temporal.md: Use `msgspec.Struct` for all activity inputs and outputs. This ensures type safety and high-performance serialization.

## Worker Configuration

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Worker Configuration.

Evidence:
- guidelines/GL008_temporal.md: Initialize the activity class with its dependencies and register its bound methods with the worker.

## Error Handling and Retries

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Error Handling and Retries.

Evidence:
- guidelines/GL008_temporal.md: * **Exceptions:** Allow standard exceptions to propagate from activities. This signals failure to the Temporal service, triggering the retry policy defined by the workflow. * **Retries:** Do not define retry policies in the `@activity.defn` decorator unless absolutely necessary. Retry policies should be defined by the caller (the workflow) to maintain flexibility.

## Keep Activities Focused

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Keep Activities Focused.

Evidence:
- guidelines/GL008_temporal.md: Activities should handle Temporal-specific concerns (receiving input, formatting output) and delegate business logic to domain services.

## Why Avoid Mocks?

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Why Avoid Mocks?

Evidence:
- guidelines/GL009_testing_without_mocks.md: 1. **Tests become brittle** - Mocks couple tests to implementation details rather than behavior 2. **False confidence** - Mocks can pass even when the real integration would fail 3. **Harder to refactor** - Changes to internal APIs break mocked tests 4. **Poor readability** - Mock setup with `MagicMock`, `AsyncMock`, `patch`, etc. adds cognitive overhead 5. **Maintenance burden** - Mocks require constant updates as code evolves

## What to Use Instead

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
What to Use Instead.

Evidence:
- guidelines/GL009_testing_without_mocks.md: 1. **Real implementations** - Use actual classes with simplified behavior 2. **Test doubles** - Create lightweight structs specifically for testing 3. **In-memory alternatives** - Use memory-based versions of I/O dependencies 4. **Composition over mocking** - Design code to accept injected dependencies

## Pattern 1: Test-Specific Structs

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Pattern 1: Test-Specific Structs.

Evidence:
- guidelines/GL009_testing_without_mocks.md: Instead of mocking interfaces, create simple struct implementations with exactly the behavior needed for testing.

## Pattern 2: In-Memory Implementations

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Pattern 2: In-Memory Implementations.

Evidence:
- guidelines/GL009_testing_without_mocks.md: Use in-memory versions of I/O dependencies rather than mocking them.

## Pattern 3: Multiple Focused Test Doubles

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Pattern 3: Multiple Focused Test Doubles.

Evidence:
- guidelines/GL009_testing_without_mocks.md: Create separate test doubles for different test scenarios rather than one complex mock.

## Pattern 4: Simple Functions for Callbacks

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Pattern 4: Simple Functions for Callbacks.

Evidence:
- guidelines/GL009_testing_without_mocks.md: For simple callback dependencies, use plain functions instead of mocks.

## Dependency Injection

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Dependency Injection.

Evidence:
- guidelines/GL009_testing_without_mocks.md: Design code to accept dependencies as parameters rather than creating them internally.

## Protocol-Based Interfaces

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Protocol-Based Interfaces.

Evidence:
- guidelines/GL009_testing_without_mocks.md: Use protocols (structural typing) rather than abstract base classes for interfaces.

## Pitfall 1: Overusing Fixtures

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Pitfall 1: Overusing Fixtures.

Evidence:
- guidelines/GL009_testing_without_mocks.md: Don't create complex fixture hierarchies to avoid duplication. Test doubles should be simple enough to instantiate directly.

## Pitfall 2: Testing Implementation Details

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Pitfall 2: Testing Implementation Details.

Evidence:
- guidelines/GL009_testing_without_mocks.md: Just because you're not using mocks doesn't mean you should test private methods or internal state.

## Pitfall 3: Creating Mini-Frameworks

Confidence: `1.000`
Reward: `1.000`
Anchor Drift: `0.000`
Lambda: `0.350`
Scope: `repository`

Rule:
Pitfall 3: Creating Mini-Frameworks.

Evidence:
- guidelines/GL009_testing_without_mocks.md: Keep test doubles simple. Don't build elaborate test infrastructure.
