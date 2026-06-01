# Stage 03 — Core Domain — Continuation Prompt

**Milestone:** M3 Core Domain — deterministic domain model (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 03 (core-domain).

Read in order: start.md, DOCUMENTATION.md, AGENTS.md, docs/stages/03-core-domain/README.md, docs/templates/agent-handoff-template.md.

Re-validate stages 01 and 02: standards/CI green, compose + migrations + health/readiness + env schema still passing. Do not proceed if infra regressions exist.

Implement only stage 03 scope in packages/domain: aggregates, value objects, use-cases, repository interfaces, domain errors (DomainErrorCode), in-memory test adapters. Framework-independent domain only — no transport or UI.

Key contracts: packages/domain exports; error taxonomy consumed by APIs; DTO schemas in packages/contracts aligned with use-case I/O.

Run mandatory quality gates plus: all invariants tested (AC-03-001), repository contract tests for in-memory and DB adapters (AC-03-002), zero framework imports in domain (AC-03-003), ≥90% line coverage in packages/domain, mutation ≥75% on critical use-cases, architecture lint blocking infra imports.

Deliver handoff with domain API version tag + Final Validation Checklist from docs/stages/03-core-domain/README.md.

Do not start stage 04 until stage 03 Definition of Done is 100% complete.
```

## Stage README

`docs/stages/03-core-domain/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| **01-foundation** | Tooling, contracts package, CI baseline |
| **02-infrastructure** | Compose health, migrations, config schema, service bootstrap |

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/domain/**` | Domain entities, use-cases, repository interfaces |
| `packages/contracts/src/workflow.ts` | Workflow/job IDs and status (orchestration boundary) |
| `packages/contracts/src/message.ts` | Message model for domain boundaries |
| `packages/contracts/src/agent.ts` | Agent I/O where domain hands off to orchestration |
| `DOCUMENTATION.md` §5 | Module ownership — domain must stay framework-free |

## Expected quality gates

**Global:** lint, format, typecheck, stage tests, contracts, security, smoke.

**Stage-specific:**

- `AC-03-001`: all invariants covered by tests
- `AC-03-002`: repository contract tests pass (in-memory + DB adapters)
- `AC-03-003`: domain package has zero framework coupling
- `NFR-03-002`: ≥90% line coverage in `packages/domain`
- `NFR-03-003`: mutation score ≥75% for critical use-cases
- Architecture gate: no infra imports in domain; no `as any` in domain contracts

## Handoff output path

`docs/handoffs/TASK-03-core-domain.md`
