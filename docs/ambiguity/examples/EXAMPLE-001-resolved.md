# Ambiguity Record

## Metadata

- Ambiguity ID: `AMBIG-2026-05-28-gateway-rate-limit`
- Stage: `04-apis`
- Reported by: `implementer-gateway`
- Date: `2026-05-28`
- Status: `resolved`

## Ambiguous Statement

> "The gateway should rate-limit abusive clients."

## Why Ambiguous

- Missing measurable criteria: no requests-per-second, burst size, window, or identity key (IP vs API key vs user).
- Competing interpretations: edge-only throttling vs shared Redis counter; HTTP 429 vs 503; whether limits apply per route or globally.

## Proposed Interpretations

1. **Option A — Per-IP fixed window (in-memory):** 100 requests per minute per client IP at the gateway process; return `429 Too Many Requests` with `Retry-After`. **Trade-offs:** simple, no Redis dependency; inaccurate behind NAT; not consistent across gateway replicas.
2. **Option B — Per-API-key token bucket (Redis):** configurable limits per key in Redis; return `429` with standard headers; orchestrator/worker exempt via internal network allowlist. **Trade-offs:** accurate and horizontal; adds Redis hot path and operational tuning; stricter default for anonymous traffic (reject without key).

## Decision

- Selected option: **Option B**
- Decision owner: `platform-architect` (human); fallback not used.
- Rationale: Stage 04 acceptance criteria require consistent limits across replicas and authenticated clients; Option B satisfies measurable SLOs (documented default: 60 req/min burst 120 for standard keys). Anonymous requests without a key receive `401` before rate limit evaluation (security-first default).

## Impact

- Contracts impacted: `packages/contracts` — add `RateLimitHeaders` to error responses; document `429` body shape.
- Tests impacted: contract tests for `429`; integration test with Redis fixture in `apps/gateway`.
- Risk if wrong: under Option A, replica skew could allow abuse; over-tight Option B defaults could throttle legitimate burst traffic — mitigated via env-configured limits in stage 09.
