# Stage 04 — APIs — Continuation Prompt

**Milestone:** M4 APIs — stable external/internal APIs (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 04 (apis).

Read in order: start.md, DOCUMENTATION.md, AGENTS.md, docs/stages/04-apis/README.md, docs/templates/module-contract-template.md, docs/templates/agent-handoff-template.md.

Re-validate stage 03 DoD: domain API stable, invariants and repository contract tests green, no cross-layer violations. Re-validate stage 02 health/config if gateway handlers changed.

Implement only stage 04 scope: REST endpoints, OpenAPI under packages/contracts/openapi, request validation middleware, handlers mapped to domain use-cases, standardized error envelope, API versioning. No provider-specific integration logic (stage 05).

Key contracts: OpenAPI as source of truth; DomainErrorCode → HTTP mapping; packages/contracts DTOs.

Run mandatory quality gates plus: OpenAPI published in CI artifacts (AC-04-001), 100% public endpoint contract tests (AC-04-002), breaking schema change fails unless major bump (AC-04-003), OpenAPI lint, contract diff gate, Sonar/lint/type.

Deliver handoff with deprecation policy + Final Validation Checklist from docs/stages/04-apis/README.md.

Do not start stage 05 until stage 04 Definition of Done is 100% complete.
```

## Stage README

`docs/stages/04-apis/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| **03-core-domain** | Domain DoD, repository contracts, zero framework coupling |
| **02-infrastructure** | Gateway container health, env config (if API layer touches runtime) |
| **01-foundation** | CI and contract tooling baseline |

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/contracts/openapi/**` | Published OpenAPI spec (source of truth) |
| `packages/contracts/src/index.ts` | Exported DTOs and types |
| `packages/contracts/src/health.ts` | Health routes on gateway |
| `apps/gateway/**` | Transport, validation, job creation (owner: gateway team) |
| `tests/contract/**` | Contract/architecture tests |
| `DOCUMENTATION.md` §5 | REST contract + backward compatibility rules |

## Expected quality gates

**Global:** lint, format, typecheck, stage tests, contracts, security, smoke.

**Stage-specific:**

- `AC-04-001`: OpenAPI docs generated and published in CI artifacts
- `AC-04-002`: all endpoint contract tests pass
- `AC-04-003`: breaking schema change fails pipeline unless version bumped
- `NFR-04-001`: P95 non-LLM endpoint latency < 400ms (where measurable)
- `NFR-04-003`: 100% contract test coverage for public endpoints
- OpenAPI lint + contract diff checker in CI

## Handoff output path

`docs/handoffs/TASK-04-apis.md`
