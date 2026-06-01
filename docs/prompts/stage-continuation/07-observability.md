# Stage 07 — Observability — Continuation Prompt

**Milestone:** M7 Observability — production visibility (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 07 (observability).

Read in order: start.md, DOCUMENTATION.md, AGENTS.md, docs/stages/07-observability/README.md, docs/templates/agent-handoff-template.md.

Re-validate stages 02, 04, 05, and 06: services healthy in compose, APIs and integrations emitting predictable behavior, frontend critical E2E green. Traces must cover gateway → orchestrator → worker → integrations path.

Implement only stage 07 scope: structured logs with correlation IDs on all services, Prometheus metrics endpoints, distributed tracing, shared telemetry schema, dashboards (API, queue, agent, Ollama health), SLO-based alerts and operational runbook.

Key contracts: packages/shared/telemetry schema; standardized log/trace attributes (requestId, workflowId on critical paths).

Run mandatory quality gates plus: dashboard covers API/queue/agent/Ollama (AC-07-001), trace spans on critical path (AC-07-002), P1/P2 alerts tested in staging (AC-07-003), telemetry overhead < 5% throughput impact, architecture gate blocking services without instrumentation.

Deliver handoff + operational runbook + Final Validation Checklist from docs/stages/07-observability/README.md.

Do not start stage 08 until stage 07 Definition of Done is 100% complete.
```

## Stage README

`docs/stages/07-observability/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| **06-frontend** | Critical E2E journey (trace continuity includes UI-initiated flows) |
| **05-integrations** | Provider telemetry, Ollama health signals |
| **04-apis** | Gateway metrics and request correlation |
| **02-infrastructure** | Compose stack, service discovery, health endpoints |

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/shared/src/**/telemetry/**` | Shared telemetry schema (per stage README) |
| `packages/contracts/src/health.ts` | Health signals for dashboards |
| `packages/contracts/src/workflow.ts` | workflowId for span attributes |
| `apps/gateway/**`, `apps/orchestrator/**`, `apps/worker/**` | Instrumentation points |
| `DOCUMENTATION.md` §6 | Coverage/Sonar gates alongside telemetry CI checks |

## Expected quality gates

**Global:** lint, format, typecheck, stage tests, contracts, security, smoke.

**Stage-specific:**

- `AC-07-001`: dashboard covers API, queue, agent, and Ollama runtime health
- `AC-07-002`: trace spans visible for critical transaction path
- `AC-07-003`: P1/P2 alert policies tested end-to-end
- `NFR-07-001`: telemetry overhead < 5% throughput impact
- `NFR-07-002`: 100% critical path spans include requestId and workflowId
- CI: mandatory telemetry fields in integration tests; architecture gate for instrumentation

## Handoff output path

`docs/handoffs/TASK-07-observability.md`
