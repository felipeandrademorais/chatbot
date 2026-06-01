# Stage 02 — Infrastructure — Continuation Prompt

**Milestone:** M2 Infrastructure — compose stack and runtime bootstrap (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 02 (infrastructure).

Read in order: start.md, DOCUMENTATION.md, AGENTS.md, docs/stages/02-infrastructure/README.md, docs/stages/02-infrastructure/runbook.md (if present), docs/templates/agent-handoff-template.md.

Re-validate stage 01 DoD: compose skeleton, CI baseline, packages/contracts initialized, templates committed. Re-run compose smoke if stage 01 handoff is stale.

Implement only stage 02 scope: Dockerfiles for gateway/orchestrator/worker/web, migration pipeline, env schema validation at startup, /health/live and /health/ready, dev and test compose profiles. No domain workflows.

Key contracts: packages/contracts/src/health.ts (HEALTH_ROUTES, liveness/readiness types); packages/shared config and health modules as referenced in stage README.

Run mandatory quality gates plus: all core containers healthy (AC-02-001), migrations in CI (AC-02-002), failed startup fails pipeline (AC-02-003), no secrets in tracked files, health endpoints on all services.

Deliver handoff + infra runbook updates + Final Validation Checklist from docs/stages/02-infrastructure/README.md.

Do not start stage 03 until stage 02 Definition of Done is 100% complete.
```

## Stage README

`docs/stages/02-infrastructure/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| **01-foundation** | Monorepo standards, CI validate, compose skeleton, contracts directory, template files (AC-01-001–003) |

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/contracts/src/health.ts` | `/health/live`, `/health/ready`, `HEALTH_ROUTES` |
| `packages/contracts/__tests__/health.contract.test.ts` | Health contract tests |
| `packages/shared/src/config/env-schema.ts` | Validated env schema (config contract) |
| `packages/shared/src/config/load-config.ts` | Startup config loading |
| `packages/shared/src/health/checks.ts` | Readiness check implementations |
| `packages/shared/src/migrations/` | Migration runner / CLI |
| `tests/integration/compose-health.test.ts` | Compose health integration (if present) |
| `tests/integration/compose-migrations.test.ts` | Migration integration (if present) |

## Expected quality gates

**Global:** lint, format, typecheck, stage tests, contracts, security scan, smoke.

**Stage-specific:**

- `AC-02-001`: all core containers start healthy
- `AC-02-002`: migrations execute automatically in CI
- `AC-02-003`: failed container startup returns non-zero CI status
- `NFR-02-001`: cold start stack < 120s (dev machine)
- `NFR-02-002`: no hardcoded secrets
- CI: compose test profile, static secret scan, architecture gate for health endpoints

## Handoff output path

`docs/handoffs/TASK-02-infrastructure.md`
