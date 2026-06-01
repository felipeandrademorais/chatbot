# Stage 09 Scaling Runbook

## Scope

- Queue tuning and worker concurrency recommendations
- Cache policy and invalidation contracts
- Dependency-failure degradation workflow
- Performance SLA verification process

## Reproducible Commands

1. Install and build contracts/shared changes:
   - `pnpm --filter @chatbot/contracts run test:contract`
   - `pnpm --filter @chatbot/shared run test:unit`
2. Stage 09 verification suites:
   - `pnpm test:integration -- --run tests/integration/queue-backpressure.test.ts tests/integration/dependency-failure-degradation.test.ts`
   - `pnpm test:contract -- --run tests/contract/scalability-contract.test.ts`
   - `pnpm vitest run tests/regression/performance-baseline.test.ts`
3. Optional compose-backed sustained run:
   - `pnpm compose:test`
   - `pnpm vitest run tests/e2e/sustained-load.test.ts`

## Queue Scaling Triggers

- If queue pressure is `elevated` for >5 minutes, increase `WORKER_MAX_CONCURRENCY` by 25%.
- If queue pressure is `saturated` for >1 minute, add one worker replica and increase partition count.
- Keep `maxInFlightPerPartition` <= 8 to avoid head-of-line blocking.

## Cache Policy

- `conversation`: 30s TTL + 5s stale-while-revalidate.
- `session`: 20s TTL + 5s stale-while-revalidate.
- `workflow`: 10s TTL + 2s stale-while-revalidate.
- Security-first invalidation: write/update events evict all related aggregate keys immediately.

## Controlled Failure Strategy

- Retry policy: max 2 retries with bounded exponential backoff.
- Timeout policy: 3s per attempt.
- On repeated Ollama failure, return deterministic degraded response via fallback provider payload.
- Never allow unbounded retries to prevent cascading queue starvation.

## Performance Budget Per Service

- Gateway: p95 <= 300ms for health and internal contract endpoints.
- Orchestrator: p95 <= 450ms for queue tuning/status endpoints.
- Worker: p95 <= 600ms under normal profile and <= 900ms under failure profile.
- Global error budget: <2% request failures for Stage 09 profiles.

## Ambiguity Decision Log

- Ambiguity: Stage requirement names a "business-defined SLA" without exact numbers.
- Security-first fallback decision: enforce bounded retries (max 2), strict timeout (3s), and global p95 ceiling of 800ms for contract validation; failure profile keeps lower TPS requirement but still adheres to <2% error budget.
- Rationale: bounded retries/timeouts prevent queue starvation and reduce blast radius during upstream degradation.
