# Stage 05 — Integrations — Continuation Prompt

**Milestone:** M5 Integrations — external provider adapters (Ollama local first) (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 05 (integrations).

Read in order: start.md, DOCUMENTATION.md, AGENTS.md, docs/stages/05-integrations/README.md, docs/templates/agent-handoff-template.md.

Re-validate stages 02, 03, and 04: infra health/migrations, domain API stable, OpenAPI + gateway contract tests green. APIs must not embed provider logic.

Implement only stage 05 scope in packages/tools and related adapters: Ollama local-first LLM adapter (default), tool adapter layer with allowlists, retry (max 2, exponential backoff), circuit breaker, ProviderRequest/ProviderResponse normalization, model lifecycle (pull, warmup, health-check, fallback), usage telemetry (tokens/cost/errors). Offline-capable default path via local Ollama.

Key contracts: packages/contracts ProviderRequest/ProviderResponse and OllamaModelContract schemas; packages/contracts/src/tool.ts for tool invocation.

Run mandatory quality gates plus: Ollama adapter contract tests (AC-05-001), fallback proven via failure simulation (AC-05-002), telemetry persisted per request (AC-05-003), secret scanning, CI Ollama smoke container where configured.

Deliver handoff + integration failure/rate-limit docs + Final Validation Checklist from docs/stages/05-integrations/README.md.

Do not start stage 06 until stage 05 Definition of Done is 100% complete.
```

## Stage README

`docs/stages/05-integrations/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| **04-apis** | OpenAPI valid, endpoint contracts, error envelope |
| **03-core-domain** | Use-cases callable from orchestrator/worker paths |
| **02-infrastructure** | Worker/gateway runtime, compose profiles, health |

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/contracts/src/tool.ts` | Tool names, execution results, allowlist surface |
| `packages/contracts/src/agent.ts` | Agent input/result, usage metadata |
| `packages/contracts/**` | `ProviderRequest`, `ProviderResponse`, `OllamaModelContract` (per stage README) |
| `packages/tools/**` | Adapter implementations (owner: tools team) |
| `apps/worker/**` | Tool invocation execution |
| `apps/orchestrator/**` | Workflow routing to providers |

## Expected quality gates

**Global:** lint, format, typecheck, stage tests, contracts, security, smoke.

**Stage-specific:**

- `AC-05-001`: local Ollama adapter contract tests pass
- `AC-05-002`: fallback path proven via failure simulation
- `AC-05-003`: token/cost telemetry persisted for each request
- `NFR-05-001`: provider timeout ≤ 30s default
- `NFR-05-002`: retries max 2 with exponential backoff
- `NFR-05-004`: default path works fully offline with local Ollama
- Secret scanning + credential policy in CI

## Handoff output path

`docs/handoffs/TASK-05-integrations.md`
