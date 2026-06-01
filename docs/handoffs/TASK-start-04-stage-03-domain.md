# Agent Handoff — Stage 03 Core Domain

## Header

- Stage: `03-core-domain`
- Task ID: `TASK-start-04-stage-03-domain`
- From Agent: Executor
- To Agent: Integrator / Verifier
- Commit SHA: _(uncommitted — user requested no git commit)_
- Timestamp: 2026-06-01

## Objective

Deliver Stage 03 core domain: backlog, `packages/domain` implementation, domain DTO contracts, tests, and architecture gate per `docs/stages/03-core-domain/README.md`.

## Scope

### Files created / modified

- `docs/stages/03-core-domain/backlog.md`
- `packages/contracts/src/domain/**`
- `packages/contracts/src/index.ts`
- `packages/contracts/__tests__/domain.contract.test.ts`
- `packages/domain/**` (full implementation)
- `tests/contract/domain-architecture.test.ts`
- `docs/handoffs/TASK-start-04-stage-03-domain.md`

### Forbidden (not touched)

- `apps/gateway`, `apps/orchestrator`, `apps/worker`, `apps/web`

## Contracts

- `@chatbot/contracts` domain DTOs v1.0.0: `CreateSession*`, `CreateConversation*`, `AppendMessage*`, `StartWorkflow*`, `CompleteWorkflowTask*`, `CancelWorkflow*`, `DomainErrorCode`, `DomainErrorPayload`
- `@chatbot/domain` `DOMAIN_VERSION` `1.0.0`

## Work Completed

1. Atomic backlog `TASK-03-001` … `TASK-03-011` with parallel/sequential map.
2. Domain error taxonomy (`DomainError`, contract `DomainErrorCode`).
3. Aggregates: `Conversation`, `Session`, `WorkflowExecution`; entities `ConversationMessage`, `WorkflowTask`.
4. Six use cases with in-memory repository adapters.
5. Unit + repository contract + architecture tests; coverage gate ≥90% lines.

## Evidence

### Commands

```bash
pnpm --filter @chatbot/contracts run build
pnpm --filter @chatbot/domain run build
pnpm --filter @chatbot/domain test          # 28 passed
pnpm --filter @chatbot/domain run test:coverage  # 95.42% lines (threshold 90%)
pnpm --filter @chatbot/domain run typecheck # pass
pnpm --filter @chatbot/contracts run test:unit   # 13 passed
pnpm exec vitest run tests/contract/domain-architecture.test.ts  # 1 passed
pnpm eslint packages/domain/src packages/contracts/src/domain tests/contract/domain-architecture.test.ts  # pass
```

### Coverage summary (`@chatbot/domain`)

| Metric | Result |
| --- | --- |
| Lines | 95.42% |
| Statements | 95.42% |
| Branches | 91.66% |
| Functions | 97.1% |

## Acceptance Criteria

| ID | Status | Notes |
| --- | --- | --- |
| AC-03-001 | PASS | Invariant tests: conversation ordering, session duplicate link, workflow transitions, message validation |
| AC-03-002 | PASS | Repository contract tests on in-memory adapters |
| AC-03-003 | PASS | `tests/contract/domain-architecture.test.ts` forbids fastify/pg/redis/bullmq/zod imports |

## Definition of Done (Stage 03)

| Item | Status |
| --- | --- |
| Domain API version tagged (`DOMAIN_VERSION` 1.0.0) | Done |
| Domain contracts exported without `as any` | Done |
| Domain invariants validated | Done |
| 90% line coverage in `packages/domain` | Done (95.42%) |
| Mutation threshold ≥75% critical use-cases | **Not run** (no Stryker config in repo yet) |
| Contract exports documented | Done via contract modules + handoff |
| No cross-layer violations | Done (architecture test) |

## Open Issues / Risks

- `RISK-03-001`: Mitigated via behavior on aggregates (append, transitions, link).
- `RISK-03-002`: Architecture lint covers known infra packages; extend list when new deps appear.
- **NFR-03-003**: Mutation testing not executed — recommend nightly Stryker job in stage 10.
- `@vitest/coverage-v8@3.2.6` vs `vitest@3.2.4` peer warning — align versions in a follow-up chore.
- PostgreSQL repository adapters deferred to stage 04/05 (in-memory only for stage 03).

## Next Steps

1. Stage 04: wire gateway/orchestrator to domain use cases + persistence adapters.
2. Add Stryker (or equivalent) for mutation gate on use-cases.
3. Integrator: run full `pnpm test:unit` and CI validate on branch.
