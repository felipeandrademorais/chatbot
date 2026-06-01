# Parallelism Matrix — Stages × Modules × Owners

Maps **delivery stages** to **code modules**, **primary owner agents** (from `AGENTS.md`), and **default parallelism** within a stage. Use with [multi-agent-model.md](./multi-agent-model.md).

**Owner names** match the AGENTS.md ownership table (“team” = agent specialization label, not a human org chart).

---

## Module ownership reference

| Module | Owner agent | Responsibility |
| ------ | ----------- | -------------- |
| `apps/gateway` | Gateway team | Transport, request validation, job creation |
| `apps/orchestrator` | Orchestrator team | Workflow graph, routing decisions |
| `apps/worker` | Worker team | Specialized execution, tool invocation |
| `apps/web` | Frontend team | User-facing web interface |
| `packages/contracts` | Architecture team | API schemas, event schemas, DTO versions |
| `packages/domain` | Domain team | Pure business logic (framework-independent) |
| `packages/tools` | Tools team | Tool adapters, allowlists, sandbox wrappers |
| `packages/shared` | Shared team | Cross-cutting utilities |
| `packages/test-kits` | QA team | Test utilities and fixtures |

**Global rules**

- One module → one primary owner per sprint.
- Cross-module work: **contract PR first**, then consumers.
- No Implementer edits another owner’s module without explicit handoff.

---

## Stage matrix

Legend: **P** = may run in parallel with other P rows in the same stage (if file/contract rules pass); **S** = sequential gate or single-owner bottleneck; **—** = not in stage scope.

| Stage | Primary modules | Owner(s) | Default parallelism | Notes |
| ----- | ----------------- | -------- | ------------------- | ----- |
| **01-foundation** | `packages/contracts` (skeleton) | Architecture | **P** with docs/tooling tracks | `DOCUMENTATION.md` M1: docs + tooling + contracts in parallel |
| | `packages/shared`, root tooling, `tests/` layout | Shared, QA | **P** | Disjoint paths from contract skeleton |
| | `apps/*` placeholders, `docker-compose` skeleton | Gateway, Orchestrator, Worker, Frontend | **S** after contracts dir exists | Placeholders only; avoid conflicting root `package.json` / compose edits |
| | `packages/domain`, `packages/tools` | Domain, Tools | **—** | Out of scope per stage README |
| **02-infrastructure** | `apps/gateway` | Gateway | **P** vs other apps | Per-app Dockerfiles/health if paths disjoint |
| | `apps/orchestrator` | Orchestrator | **P** | Smoke: gateway → orchestrator is **S** integration task |
| | `apps/worker` | Worker | **P** | |
| | `apps/web` | Frontend | **P** | |
| | `packages/shared` (config, migrations) | Shared | **S** gate | Env schema + migrations before app startup tasks |
| | `migrations/`, `docker-compose` | Shared + Integrator | **S** | Single owner for compose/migration churn per change set |
| **03-core-domain** | `packages/domain` | Domain | **S** within package | Aggregates + use cases: sequence if shared files |
| | `packages/contracts` (error taxonomy) | Architecture | **S** before API consumers | `DomainErrorCode` contract first |
| | `apps/*` | — | **—** | Domain only in scope |
| **04-apis** | `packages/contracts` (OpenAPI) | Architecture | **S** gate | OpenAPI is source of truth (`FR-04-001`) |
| | `apps/gateway` (handlers) | Gateway | **S** after OpenAPI | Maps to domain use-cases |
| | `packages/domain` (consumption only) | Domain | **S** | Read-only unless domain gap — handoff to Domain |
| **05-integrations** | `packages/contracts` (provider schemas) | Architecture | **S** gate | `ProviderRequest` / `ProviderResponse` |
| | `packages/tools` | Tools | **P** after schemas | Adapters behind anti-corruption layers |
| | `apps/orchestrator`, `apps/worker` | Orchestrator, Worker | **S** or **P** | **P** only if disjoint files; shared integration config → **S** |
| **06-frontend** | `apps/web` | Frontend | **S** (single app) | Typed client from OpenAPI — contract frozen first |
| | `packages/contracts` | Architecture | **S** (read/consume) | Generated client from stage 04 |
| **07-observability** | `packages/shared` (telemetry) | Shared | **S** gate | Shared schema before instrumentation |
| | `apps/gateway`, `apps/orchestrator`, `apps/worker` | Gateway, Orchestrator, Worker | **P** | Instrumentation per service if schema merged |
| | `apps/web` | Frontend | **P** | After shared telemetry contract |
| **08-security** | `packages/contracts` (auth claims) | Architecture | **S** gate | Token claims across gateway + web |
| | `apps/gateway`, `apps/web` | Gateway, Frontend | **S** after auth contract | |
| | `packages/tools` (sandbox/allowlist) | Tools | **P** or **S** | Align with `FR-08-002`; may touch worker paths → coordinate |
| **09-scalability** | `apps/gateway`, `apps/orchestrator`, `apps/worker` | Gateway, Orchestrator, Worker | **P** with care | Rate-limit/retry contracts — **S** if same contract files |
| | `packages/domain` (cache invalidation) | Domain | **S** | Per aggregate contract |
| **10-final-hardening** | All modules + `tests/*` | Integrator-led | **S** default | Regression/chaos/DR; minimize parallel blast radius |

---

## Within-stage parallel groups (Coordinator quick reference)

Use only when the [multi-agent-model.md](./multi-agent-model.md) checklist passes.

| Stage | Safe parallel tracks (disjoint modules) | Must stay sequential |
| ----- | ---------------------------------------- | -------------------- |
| 01 | contracts ‖ shared/tooling ‖ docs | compose + workspace root changes |
| 02 | gateway ‖ orchestrator ‖ worker ‖ web (after shared config merged) | migrations + env schema + compose |
| 03 | — (single domain package) | contract taxonomy → domain implementation |
| 04 | — | OpenAPI → gateway handlers |
| 05 | tools adapters ‖ (orchestrator vs worker if files disjoint) | provider schemas → adapters |
| 06 | — | OpenAPI freeze → web client + UI |
| 07 | gateway ‖ orchestrator ‖ worker ‖ web (post-telemetry schema) | `packages/shared/telemetry` first |
| 08 | tools policy ‖ (gateway vs web after auth contract) | auth contract → gateway + web |
| 09 | perf tuning per app if contracts unchanged | shared retry/rate-limit contract edits |
| 10 | limited parallel test/fixture work under QA | Integrator owns merge order |

---

## Contract touchpoints by stage

| Stage | Contract surface | Owner | Consumer owners |
| ----- | ---------------- | ----- | ----------------- |
| 01 | Contract docs skeleton | Architecture | All future stages |
| 02 | Health, env config schema | Architecture + Shared | All apps |
| 03 | Domain errors, domain exports | Domain + Architecture | Gateway (later), APIs |
| 04 | OpenAPI | Architecture | Gateway, Frontend |
| 05 | Provider request/response | Architecture | Tools, Orchestrator, Worker |
| 06 | Workflow status (UI) | Architecture | Frontend, Orchestrator |
| 07 | Telemetry schema | Shared | All apps |
| 08 | Auth claims, authz matrix | Architecture | Gateway, Frontend |
| 09 | Rate-limit, retry, cache invalidation | Architecture + Domain | Gateway, Orchestrator, Worker |
| 10 | All published contracts | Integrator | Verifier (contract tests 100%) |

Any row with multiple writers on the same surface → **sequential** tasks with Integrator reconciliation.

---

## Task ID and handoff

- Coordinator assigns `TASK-<stage>-NNN` per atomic task.
- Each task records **allowed/forbidden paths** and **owner agent** in `docs/handoffs/TASK-<stage>-<slug>.md`.
- Cross-reference module owner from the table above; do not assign two Implementers to the same module in the same sprint without Integrator split of file scopes.

---

## Related documents

| Document | Purpose |
| -------- | ------- |
| [multi-agent-model.md](./multi-agent-model.md) | Role behavior and parallel/sequential rules |
| `AGENTS.md` | Canonical ownership table |
| `DOCUMENTATION.md` §3, §5 | Milestone parallel tracks and contract-first strategy |
| `docs/stages/*/README.md` | Per-stage scope and acceptance criteria |
