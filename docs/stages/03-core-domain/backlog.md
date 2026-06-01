# Stage 03 — Core Domain Backlog

Atomic tasks for `03-core-domain`. Execute sequential chains in order; tasks marked **parallel** may run concurrently when they touch disjoint paths.

## Dependency graph

```text
TASK-03-001 → TASK-03-002 → {003,004,005 parallel} → TASK-03-006 → {007,008 parallel} → TASK-03-009 → TASK-03-010 → TASK-03-011
```

## Tasks

| ID | Title | Type | Depends on | Owner scope |
| --- | --- | --- | --- | --- |
| TASK-03-001 | Ubiquitous language glossary + `DOMAIN_VERSION` | sequential | — | `packages/domain/src/glossary.ts` |
| TASK-03-002 | Domain error taxonomy (`DomainErrorCode`, `DomainError`) | sequential | 001 | `packages/domain/src/errors/**`, `packages/contracts/src/domain/errors.ts` |
| TASK-03-003 | Value objects (IDs, message content, timestamps) | **parallel** | 002 | `packages/domain/src/value-objects/**` |
| TASK-03-004 | Entity + aggregate roots with invariants | **parallel** | 002 | `packages/domain/src/entities/**`, `aggregates/**` |
| TASK-03-005 | Use-case DTO contracts (v1) | **parallel** | 002 | `packages/contracts/src/domain/**` |
| TASK-03-006 | Repository interfaces | sequential | 003, 004 | `packages/domain/src/repositories/**` |
| TASK-03-007 | In-memory repository adapters | **parallel** | 006 | `packages/domain/src/adapters/in-memory/**` |
| TASK-03-008 | Application use cases | **parallel** | 005, 006 | `packages/domain/src/use-cases/**` |
| TASK-03-009 | Public package exports + contract re-exports | sequential | 007, 008 | `packages/domain/src/index.ts`, `packages/contracts/src/index.ts` |
| TASK-03-010 | Unit tests (entities, use cases, invariants) | sequential | 009 | `packages/domain/__tests__/**` |
| TASK-03-011 | Repository contract tests + architecture gate (no infra imports) | sequential | 010 | `packages/domain/__tests__/**`, `tests/contract/domain-architecture.test.ts` |

## Acceptance mapping

| Criterion | Tasks |
| --- | --- |
| AC-03-001 | 004, 010 |
| AC-03-002 | 007, 011 |
| AC-03-003 | 011 |

## Parallelization notes

- **003 / 004 / 005** share only `DomainError` — safe in parallel after 002.
- **007 / 008** both depend on 006 but different directories — parallel.
- Do **not** parallelize contract index changes (009) with implementers editing the same export surface.
