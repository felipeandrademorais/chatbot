# Stage 06 — Frontend — Continuation Prompt

**Milestone:** M6 Frontend — user-facing workflow (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 06 (frontend).

Read in order: start.md, DOCUMENTATION.md, AGENTS.md, docs/stages/06-frontend/README.md, docs/templates/agent-handoff-template.md.

Re-validate stages 04 and 05: OpenAPI complete and contract-tested; integration adapters (Ollama, tools) stable with fallback/telemetry tests green. Re-run critical API contract tests if UI client generation changed.

Implement only stage 06 scope in apps/web: typed API client from OpenAPI, workflow status timeline, loading/empty/error/success states, recoverable errors and retry actions, telemetry hooks. No deep branding beyond functional baseline.

Key contracts: generated client from packages/contracts/openapi; orchestrator workflow status contract alignment.

Run mandatory quality gates plus: critical user journey E2E (AC-06-001), no runtime type errors on API payloads (AC-06-002), a11y checks on primary screens (AC-06-003), ESLint/TS strict, axe in CI, bundle/performance budgets (LCP < 2.5s target).

Deliver handoff + Final Validation Checklist from docs/stages/06-frontend/README.md.

Do not start stage 07 until stage 06 Definition of Done is 100% complete.
```

## Stage README

`docs/stages/06-frontend/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| **04-apis** | OpenAPI valid, endpoint contracts, error envelope |
| **05-integrations** | Workflow behavior, provider fallbacks (for realistic UI states) |
| **02-infrastructure** | Web service container and compose profile |

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/contracts/openapi/**` | Source for generated typed API client |
| `packages/contracts/src/workflow.ts` | Workflow status aligned with UI state machine |
| `packages/contracts/src/message.ts` | Chat/message payloads in UI |
| `apps/web/**` | Web shell (owner: frontend team) |
| `tests/smoke/**` | Smoke paths involving web (if present) |

## Expected quality gates

**Global:** lint, format, typecheck, stage tests, contracts, security, smoke.

**Stage-specific:**

- `AC-06-001`: critical user journey passes E2E
- `AC-06-002`: no runtime type errors for API payload handling
- `AC-06-003`: accessibility checks pass for primary screens (WCAG 2.2 AA baseline)
- `NFR-06-001`: LCP < 2.5s for primary screen (performance budget)
- Client generation in CI (prevents UI–contract drift)
- Visual regression snapshots for core screens (where configured)

## Handoff output path

`docs/handoffs/TASK-06-frontend.md`
