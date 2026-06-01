# Stage 09 — Scalability — Continuation Prompt

**Milestone:** M9 Scalability — throughput and resilience (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 09 (scalability).

Read in order: start.md, DOCUMENTATION.md, AGENTS.md, docs/stages/09-scalability/README.md, docs/templates/agent-handoff-template.md.

Re-validate stages 02 through 08: full compose stack healthy, APIs and integrations stable, frontend E2E green, observability dashboards and traces usable for bottleneck analysis, security gates and auth matrix enforced.

Implement only stage 09 scope: load profiles (normal/peak/failure), worker concurrency and queue partitioning tuning, cache policies for high-frequency reads, rate-limit/retry contracts across gateway/orchestrator/worker/Ollama adapter, cache invalidation per aggregate type, performance baselines and scaling runbook.

Use observability dashboards for evidence-first optimization (benchmark before tuning).

Run mandatory quality gates plus: load tests meet SLA thresholds (AC-09-001), stability during controlled dependency failure (AC-09-002), documented reproducible optimizations (AC-09-003), <2% error rate at target TPS, p95 workflow SLA, graceful degradation on Ollama failures.

Deliver handoff + performance budget per service + capacity planning guide + Final Validation Checklist from docs/stages/09-scalability/README.md.

Do not start stage 10 until stage 09 Definition of Done is 100% complete.
```

## Stage README

`docs/stages/09-scalability/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| **08-security** | Auth overhead, rate limits under load |
| **07-observability** | Metrics/traces for bottleneck analysis |
| **06-frontend** | E2E still green after tuning |
| **05-integrations** | Ollama fallback under failure injection |
| **04-apis** | Latency budgets, timeout/retry conformance |
| **03-core-domain** | Cache invalidation vs aggregates |
| **02-infrastructure** | Queue/backpressure, compose scale profile |

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/contracts/src/workflow.ts` | Workflow/job throughput boundaries |
| `packages/contracts/**` | Rate-limit and retry contracts (per stage README) |
| `apps/orchestrator/**` | Queue routing and concurrency |
| `apps/worker/**` | Worker concurrency settings |
| `packages/tools/**` | Ollama adapter timeouts/retries under load |
| Stage 07 dashboards/runbooks | Evidence for optimization decisions |

## Expected quality gates

**Global:** lint, format, typecheck, stage tests, contracts, security, smoke.

**Stage-specific:**

- `AC-09-001`: load tests meet SLA thresholds
- `AC-09-002`: system stable during controlled dependency failure
- `AC-09-003`: optimization changes documented and reproducible
- `NFR-09-001`: sustain target TPS with < 2% error rate
- `NFR-09-002`: p95 workflow completion within business SLA
- `NFR-09-003`: graceful degradation under Ollama failures
- Nightly performance pipeline with threshold asserts (where configured)

## Handoff output path

`docs/handoffs/TASK-09-scalability.md`
