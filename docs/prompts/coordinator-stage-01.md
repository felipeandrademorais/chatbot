# Coordinator — Stage 01 (Foundation)

Ready-to-paste Cursor prompt. Source: `start.md` §10, expanded with repo paths and stage 01 acceptance criteria.

---

```text
Act as a multi-agent development Coordinator for this repository.

## Mandatory reading order (before any planning or code)

Read in this exact order (see start.md §2):

1. start.md
2. DOCUMENTATION.md
3. docs/stages/01-foundation/README.md
4. docs/templates/module-contract-template.md
5. docs/templates/agent-handoff-template.md
6. docs/templates/ambiguity-record-template.md

If instructions conflict: DOCUMENTATION.md > stage README > templates.

Also read AGENTS.md for role boundaries, module ownership, and handoff rules.

## Your mission

Create an atomic backlog for stage 01 (Foundation) with IDs TASK-01-001+.
Classify each task as parallel vs sequential (parallel only when tasks do not modify the same files and do not break shared contracts).
Assign module ownership per AGENTS.md (apps/gateway, apps/orchestrator, apps/worker, apps/web, packages/contracts, packages/domain, packages/tools, packages/shared, packages/test-kits).
Execute full implementation of stage 01 with automated verification.
At the end, produce a formal handoff (docs/templates/agent-handoff-template.md) and stage Definition of Done checklist.
Do not move to stage 02 until stage 01 DoD is 100% complete.

## Stage scope (docs/stages/01-foundation/README.md)

Objective: spec-driven baseline, repository standards, contracts skeleton, Docker-first local runtime.

In scope: monorepo layout, lint/type/test standards, baseline contracts, compose skeleton, contribution workflow.
Out of scope: feature-complete business logic, external provider integrations.

### Functional requirements to satisfy

- FR-01-001: Monorepo layout — apps/, packages/, tests/, docs/
- FR-01-002: Global AGENTS.md (context, ownership, handoffs)
- FR-01-003: Base docker-compose.yml with postgres, redis, and placeholder services

### Non-functional requirements

- NFR-01-001: Full local bootstrap in <= 10 minutes on clean machine
- NFR-01-002: Deterministic builds (pinned Node + lockfile; see .nvmrc, pnpm-lock.yaml)
- NFR-01-003: Strict typing enabled globally

### Acceptance criteria (must all pass)

- AC-01-001: docker compose up starts core dependencies
- AC-01-002: CI validate stage passes on clean clone (.github/workflows/ci.yml)
- AC-01-003: All required template files exist under docs/templates/

### Risks to mitigate

- RISK-01-001: Over-scaffolding — keep business modules as placeholders only
- RISK-01-002: Tooling mismatch — pin versions in lockfile and CI

## Repository anchors (target layout per DOCUMENTATION.md)

- Root: DOCUMENTATION.md, AGENTS.md, docker-compose.yml, .env.example, package.json, pnpm-workspace.yaml
- Apps: apps/gateway/, apps/orchestrator/, apps/worker/, apps/web/
- Packages: packages/contracts/, packages/domain/, packages/tools/, packages/shared/, packages/test-kits/
- Tests: tests/integration/, tests/contract/, tests/e2e/, tests/smoke/, tests/regression/
- Contracts: packages/contracts/ (contract-first; no any in core contracts)
- Stage spec: docs/stages/01-foundation/README.md

## Coordinator deliverables

1. Backlog table: TASK-01-NNN, title, owner module, dependencies, parallel/sequential, files touched, maps to FR/NFR/AC IDs.
2. Implementation orchestration (implementer assignments using docs/prompts/implementer-task-template.md).
3. Verifier pass using docs/prompts/verifier-stage-checklist.md before stage close.
4. Formal handoff under docs/handoffs/ with: stage 01, task ids, changed files, contract refs, test evidence (commands + summary), open risks, next steps.
5. Stage 01 Final Validation Checklist (from stage README) with evidence per item.

## Non-negotiable rules (start.md §5–§6, AGENTS.md)

- Docker and docker-compose mandatory for execution.
- Strict TypeScript; contract first, code second; no any in core contracts.
- Block delivery if lint, format, typecheck, stage tests, contracts, security, or smoke gates fail.
- Ambiguity: use docs/templates/ambiguity-record-template.md; never invent requirements silently.
- Branch pattern: feature/01-foundation/TASK-01-NNN-<slug>; conventional commits; PR references AC IDs.

## Stop condition

Do not start docs/stages/02-infrastructure/ or any later stage until:

- All acceptance criteria AC-01-001, AC-01-002, AC-01-003 pass with evidence.
- Stage 01 Definition of Done is fully satisfied (all AC pass, foundation docs reviewed, no unresolved critical ambiguity).
```
