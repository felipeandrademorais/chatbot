# Stage 01 — Foundation — Continuation Prompt

**Milestone:** M1 Foundation — standards, contracts, base skeleton (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 01 (foundation).

Read in order: start.md, DOCUMENTATION.md, AGENTS.md, docs/stages/01-foundation/README.md, docs/templates/module-contract-template.md, docs/templates/agent-handoff-template.md.

Re-validate: none (first stage). Confirm monorepo layout, templates, and packages/contracts skeleton exist per FR-01-001–003.

Implement only stage 01 scope: repository standards, lint/type/test baseline, docker-compose skeleton (postgres, redis, placeholder services), CI validate pipeline. Do not implement feature-complete business logic or external integrations.

Create atomic backlog TASK-01-001+; classify parallel vs sequential tasks. Execute as Coordinator → Implementer → Verifier → Integrator per start.md §3.

Run mandatory quality gates: lint 0 errors, format, typecheck, stage tests, contract schema lint, compose startup smoke (AC-01-001), CI validate on clean clone (AC-01-002), required templates present (AC-01-003).

Deliver formal handoff using docs/templates/agent-handoff-template.md and complete the stage Final Validation Checklist in docs/stages/01-foundation/README.md.

Do not start stage 02 until stage 01 Definition of Done is 100% complete.
```

## Stage README

`docs/stages/01-foundation/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| — | None (greenfield baseline) |

Before closing stage 01, confirm later stages are **unblocked** by: monorepo layout, `AGENTS.md`, `packages/contracts` initialized, `docker compose up` for core deps.

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/contracts/src/index.ts` | Contract package entry and export surface |
| `packages/contracts/src/message.ts` | Message DTO baseline |
| `packages/contracts/src/tool.ts` | Tool name / execution contracts |
| `packages/contracts/src/agent.ts` | Agent input/result contracts |
| `packages/contracts/src/workflow.ts` | Workflow/job identifiers |
| `docs/templates/module-contract-template.md` | How to author new contracts |

## Expected quality gates

**Global (start.md §6):** lint, format, typecheck, stage tests, contract compatibility, no critical CVEs, smoke for changed areas.

**Stage-specific:**

- `AC-01-001`: `docker compose up` starts core dependencies
- `AC-01-002`: CI validate stage passes on clean clone
- `AC-01-003`: All required template files exist
- Architecture gate: folder layout validation
- Contract: schema lint pass
- `NFR-01-001`: local bootstrap ≤ 10 minutes on clean machine

## Handoff output path

`docs/handoffs/TASK-01-foundation.md`
