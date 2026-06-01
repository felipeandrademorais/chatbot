# QA End-to-End Validation & Inconsistency Report

- **Date/time**: 2026-06-01 ~08:44–09:20 (UTC-3)
- **Performed by**: QA Expert (automated end-to-end validation following `README.md` as source of truth)
- **Repository**: `/Users/admin/Documents/code/chatbot`
- **Scope**: Execute the documented setup/run/test flow exactly as a new contributor, validate the full
  user-facing flow (gateway → orchestrator → worker → web, including a real chat/workflow request hitting
  the LLM provider via **local Ollama only**), and report any inconsistency between the README and reality.

> **No application source code was modified.** Only this report and the `docs/qa/` directory were created.
> One throwaway probe file (`._qa_repro.mjs`) was created at repo root to reproduce a Fastify bug and was
> deleted immediately after use.

---

## 1. Environment summary

| Item | Value |
| --- | --- |
| OS | Darwin 25.5.0, arm64 (macOS) |
| Node.js | v24.15.0 (satisfies README `>=24.0.0 <25.0.0`) |
| pnpm | 9.15.4 (matches pinned `pnpm@9.15.4`) |
| Docker | 29.4.3 |
| Docker Compose | v5.1.3 |
| Ollama | 0.24.0 |
| Ollama models installed (`ollama list`) | `gemma4:e2b` (7.2 GB), `gemma4:e4b` (9.6 GB) |
| Ollama model used for chat test | **None usable** — see CRIT/HIGH findings. No model was pulled/downloaded (constraint honored). |

### Ollama constraint compliance
- `ollama list` was run first; only the two already-installed `gemma4` models exist locally.
- **No `ollama pull` / no model download was performed at any point** (confirmed: `ollama list` identical
  before and after the run).
- The application could **not** be pointed at an installed model without (a) triggering a model download
  and (b) modifying source — see **HIGH-2**. This is recorded as a blocker rather than worked around.

---

## 2. Step-by-step command log (README order)

| # | README step | Command | Result |
| --- | --- | --- | --- |
| 1 | Getting started §1 | `pnpm install` | **PASS** (lockfile up to date, 10 workspace projects) |
| 2 | Getting started §2 | `.env` from `.env.example` (required `POSTGRES_PASSWORD`, `JWT_SECRET`) | **PASS** (valid `.env` already present with both secrets set) |
| 3 | Testing | `pnpm run test:unit` | **PASS** (tools 10, domain 37, shared 24+1 skipped, web 8; apps gateway/orch/worker have no unit tests) |
| 4 | Testing / Quality gate | `pnpm run test:contract` | **FAIL** — hangs ~120 s, exits 1 (see **CRIT-2**) |
| 4b | (isolation) | per-package `pnpm -r run --if-present test:contract` | PASS alone (16 tests) — failure is in root `tests/contract` |
| 5 | Getting started §3 | `pnpm run compose:dev` | **FAIL** — orchestrator never healthy, killed (exit 137); gateway never starts (see **CRIT-1**) |
| 5b | Getting started §3 (migrate service) | `migrate` container | **PASS** (`migrations_complete`, applied `001`) |
| 6 | Testing | `pnpm run test:integration` | **FAIL** — 3 files / 5 tests fail (all server-`inject` hangs); 2 passed, 4 files skipped |
| 7 | Testing | `pnpm run test:e2e` | **FAIL** — exits 1: web `test:e2e` script targets a file excluded by its own vitest `include` (see **MED-2**) |
| 7b | Testing | `vitest run tests/e2e` | **FAIL** — frontend critical journey times out (server-`inject` hang) |
| 8 | Testing | `pnpm run test:smoke` | SKIPPED (guarded: requires a live gateway, which cannot start) |
| 9 | Testing | `pnpm run test:security` | SKIPPED (guarded: requires a live stack, which cannot start) |
| 10 | Testing | `vitest run tests/regression` (perf) | **FAIL** — 1 test (frontend perf budget) times out on `inject`; 4 files pass |
| 11 | Full E2E user flow | gateway→orchestrator→worker→web + real LLM chat | **FAIL / BLOCKED** — stack cannot reach healthy state; no wired LLM path; Ollama constraints (see **CRIT-1**, **HIGH-1**, **HIGH-2**) |

Raw evidence captured in `/tmp/contract_full.log`, `/tmp/api_openapi.log`, `/tmp/compose_dev.log` during the run.

---

## 3. Findings

### CRIT-1 — Every HTTP request hangs forever; the stack never becomes healthy
- **Severity**: Critical
- **README step involved**: "Getting started §3 – Run the stack with Docker Compose" (`pnpm run compose:dev`),
  and the README claim that every app exposes working `/health/live` and `/health/ready` probes.
- **Root cause**: `packages/shared/src/server/create-service-server.ts` registers a **synchronous** `onRequest`
  hook with arity 1 that neither returns a Promise nor calls Fastify's `done` callback:

```92:109:packages/shared/src/server/create-service-server.ts
export async function createServiceServer(options: ServiceServerOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: options.logLevel },
  })

  app.addHook('onRequest', (request) => {
    const context = parseTelemetryContext(request.headers)
    ...
    request.telemetryStartNs = process.hrtime.bigint()
  })
```

  On Fastify 5.8.5 (installed), a non-async `onRequest` hook that returns `undefined` and ignores `done`
  never advances the request lifecycle, so **every request hangs indefinitely**.
- **Expected**: Services respond to requests; `/health/ready` returns `200`; containers become healthy and
  `compose:dev` brings up the full stack.
- **Actual**:
  - Minimal reproduction (Fastify 5.8.5): repo-style sync hook → request `TIMEOUT_3S`; async hook → `200`.
  - In the running `chatbot-orchestrator` container, the log shows the inbound healthcheck request but **no
    response is ever emitted**:

```
{"msg":"Server listening at http://127.0.0.1:3001"}
{"reqId":"req-1","req":{"method":"GET","url":"/health/ready",...},"msg":"incoming request"}
   (no "request completed" log — request hangs)
```

  - `pnpm run compose:dev` therefore failed:

```
Container chatbot-orchestrator Error dependency orchestrator failed to start
dependency failed to start: container chatbot-orchestrator exited (137)
 ELIFECYCLE  Command failed with exit code 1.
```

    `docker compose ps -a` afterward: `chatbot-orchestrator Exited (137)`, `chatbot-web Exited (137)`,
    `chatbot-worker Exited (137)`, `chatbot-gateway` only `Created` (never started). `migrate Exited (0)`.
- **Impact**: The documented primary run command does not produce a working system. No service (gateway,
  orchestrator, worker, web) can serve any request, so the entire user-facing flow is impossible.
- **Suggested fix**: Make the `onRequest` hook `async` (or accept and call `done`). E.g.
  `app.addHook('onRequest', async (request) => { ... })`. This single change unblocks all services and the
  health-probe-gated container startup.

### CRIT-2 — `pnpm run test:contract` hangs (~120 s) and fails
- **Severity**: Critical (documented Testing / Quality-gate command is broken)
- **README step involved**: "Testing – `pnpm run test:contract`" and "Contributing – Quality gates".
- **Expected**: Contract suite passes quickly.
- **Actual**: `vitest run tests/contract` hangs on `tests/contract/api-openapi.contract.test.ts`; isolated run:

```
 ❯ tests/contract/api-openapi.contract.test.ts (7 tests | 6 failed) 120075ms
   × serves published OpenAPI contract 20006ms → Test timed out in 20000ms.
   × creates session via versioned endpoint 20002ms → Test timed out in 20000ms.
   ... (every test that calls app.inject() times out; only the pure-assertion test passes)
 Test Files  1 failed (1)   Tests  6 failed | 1 passed (7)   Duration 120.52s
```
- **Root cause**: Same as CRIT-1 — the test builds a real gateway via `createGatewayServer` and every
  `app.inject(...)` hangs.
- **Suggested fix**: Fix CRIT-1.

### HIGH-1 — Web ↔ Gateway OpenAPI contracts diverge; the web workflow flow cannot work
- **Severity**: High
- **README step involved**: README "Key features"/"Getting started §5" claim the published OpenAPI spec
  (`packages/contracts/openapi/workflows.v1.json`) is consumed by the web client; the Docker build runs
  `generate:client` against `workflows.v1.json`.
- **Expected**: The web client and the gateway speak the same contract.
- **Actual** — the two specs are incompatible:

  | | Web client (generated from `workflows.v1.json`) | Gateway (implements/serves `v1.0.0.openapi.json`) |
  | --- | --- | --- |
  | `POST /api/v1/workflows` | success **202**, body `{ taskType, payload }` | success **201**, body requires `requestId, workflowId, conversationId, taskId, taskType` |
  | `GET /api/v1/workflows/{id}` | **200** (status polling) | **does not exist** |
  | `POST /api/v1/workflows/{id}/retry` | **202** | **does not exist** |
  | extra gateway routes | — | `/workflows/{id}/tasks/{taskId}/complete`, `/workflows/{id}/cancel` |

  The web client (`apps/web/src/api/client.ts`) treats any non-`202` as an error and calls
  `GET /api/v1/workflows/{id}` for the detail page — both unsupported by the gateway. Submitting a workflow
  from the web UI would always fail (HTTP 502 from the web layer), and the workflow detail/retry pages cannot
  function.
- **Impact**: Even after CRIT-1 is fixed, the documented user-facing workflow flow is broken end-to-end.
- **Suggested fix**: Converge on a single contract — either implement `workflows.v1.json` (202 + `GET {id}` +
  `/retry`) in the gateway, or regenerate the web client from `v1.0.0.openapi.json` and update `apps/web`
  request/response handling accordingly. (Per AGENTS.md, contract-first: fix `packages/contracts` first.)

### HIGH-2 — No working LLM/chat path; Ollama cannot be used per the constraints (BLOCKER)
- **Severity**: High (blocks the "real chat/workflow request that hits the LLM provider" objective)
- **README step involved**: "Local-first LLM provider — Ollama is the default provider"; request-flow diagram
  (`Worker → LLM`).
- **Findings**:
  1. **No runtime path invokes Ollama for generation.** The running services expose only health/telemetry and
     scalability/config endpoints. The single Ollama-related endpoint, `worker
     /internal/scalability/ollama-resilience`, is hard-coded to **reject** and return a degraded fallback
     (`() => Promise.reject(new Error('ollama provider unavailable'))`). The real `OllamaLocalAdapter`
     (`packages/tools/src/ollama-local-adapter.ts`) is **not wired** into any queue consumer or HTTP route.
  2. **`OllamaLocalAdapter.prepareModel()` always pulls the model before generating**
     (`await this.pullModel(model)` → `POST /api/pull`), which would **download** a model on every request —
     a direct violation of the "no pull / no download" constraint.
  3. **The approved-model allowlist is hardcoded** to `llama3.1:8b-instruct-q4_K_M` and
     `qwen2.5:7b-instruct-q4_K_M`. The locally installed models (`gemma4:e2b`, `gemma4:e4b`) are **not**
     approved, so the adapter would reject them (`Model ... is not approved by OllamaModelContract`). There is
     **no documented env/config var** to select a model.
  4. **Compose does not pass `OLLAMA_BASE_URL` to containers.** `docker-compose.yml`'s `x-app-environment`
     omits `OLLAMA_BASE_URL` entirely, and on macOS `http://localhost:11434` inside a container would not
     reach the host Ollama anyway (needs `host.docker.internal`).
- **Expected**: A chat/workflow request flows to the worker and is fulfilled by a local Ollama model.
- **Actual**: Impossible without (a) pulling a non-installed approved model (disallowed), and (b) source/config
  changes to wire the adapter, allow the installed `gemma4` model, skip the pull, and pass `OLLAMA_BASE_URL`.
- **Suggested fix**: Wire `OllamaLocalAdapter` into the worker's job path; make the model allowlist and base
  URL configurable via env (e.g. `OLLAMA_MODEL`, plumb `OLLAMA_BASE_URL` into `x-app-environment`); gate the
  `pull` step (skip when the model is already present, e.g. check `/api/tags`); document the model-selection
  variable in the README/`.env.example`.

### MED-1 — Docker images run Node 22, but README/`package.json` require Node 24
- **Severity**: Medium
- **README step involved**: "Tech stack"/"Prerequisites" — "Node.js 24 LTS (`>=24.0.0 <25.0.0`)".
- **Expected**: Containers run Node 24.
- **Actual**: `docker/Dockerfile.app` and `Dockerfile.migrate` use `node:22-alpine`. Every in-container build
  prints `WARN Unsupported engine: wanted: {"node":">=24.0.0 <25.0.0"} (current: {"node":"v22.22.3"})`.
- **Suggested fix**: Bump the Docker base image to `node:24-alpine` (and align CI), or relax the documented
  Node requirement.

### MED-2 — `pnpm run test:e2e` fails (misconfigured web `test:e2e` script)
- **Severity**: Medium (documented command exits non-zero)
- **README step involved**: "Testing – `pnpm run test:e2e`".
- **Expected**: Command passes (or no-ops cleanly).
- **Actual**:

```
apps/web test:e2e$ vitest run ../../tests/e2e/frontend-critical-journey.e2e.test.ts
apps/web test:e2e: No test files found, exiting with code 1
apps/web test:e2e: include: src/**/*.test.ts
 ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @chatbot/web@0.1.0 test:e2e ... Exit status 1
```

  The web package's `test:e2e` script points at a file outside `src/`, but its vitest `include` is
  `src/**/*.test.ts`, so vitest finds no test and exits 1, failing the whole recursive command.
- **Suggested fix**: Add the e2e path to the web vitest config `include` (or use a dedicated e2e config), or
  move the e2e runner to the root (`tests/e2e`) consistently with `test:performance`.

### MED-3 — Integration / e2e / regression suites fail on every server-backed test
- **Severity**: Medium (downstream symptom of CRIT-1, but they are documented test commands that fail)
- **Actual failures observed** (all are `app.inject(...)` timeouts):
  - `tests/integration`: `scalability-config-endpoints` (3 tests — gateway, orchestrator, worker),
    `frontend-workflow.integration` (1), `dependency-failure-degradation` (1).
  - `tests/e2e`: `frontend-critical-journey` (2).
  - `tests/regression`: `frontend-performance-budget` (1).
- **Suggested fix**: Fix CRIT-1; re-run.

### LOW-1 — Live-stack-gated suites silently skip and can never run
- **Severity**: Low
- **README step involved**: "Testing – `test:smoke`, `test:security`".
- **Actual**: `tests/smoke` and `tests/security` use `describe.skipIf(!stackAvailable ...)`. They report
  PASS/skip with **0 executed tests** because the stack cannot start (CRIT-1). A green-looking run here is
  misleading — no smoke/security coverage actually executes.
- **Suggested fix**: After CRIT-1, run these against the live compose stack; consider failing (not skipping)
  in CI contexts where a stack is expected.

### LOW-2 — `.env.example` advertises `OLLAMA_BASE_URL` but Compose ignores it
- **Severity**: Low (related to HIGH-2)
- **Actual**: `.env.example` documents `OLLAMA_BASE_URL=http://localhost:11434`, implying it configures the
  services, but `docker-compose.yml` never forwards it into any container.
- **Suggested fix**: Add `OLLAMA_BASE_URL` to `x-app-environment` and document the host-reachability caveat
  for Docker Desktop on macOS (`host.docker.internal`).

---

## 4. Summary table of findings

| ID | Severity | Area | README step / command | Verdict |
| --- | --- | --- | --- | --- |
| CRIT-1 | Critical | `create-service-server.ts` Fastify `onRequest` hook hangs all requests | `pnpm run compose:dev`; health probes | FAIL |
| CRIT-2 | Critical | `tests/contract/api-openapi.contract.test.ts` hangs 120 s | `pnpm run test:contract` | FAIL |
| HIGH-1 | High | Web client ↔ gateway OpenAPI contracts diverge | web workflow flow / `generate:client` | FAIL |
| HIGH-2 | High | No wired LLM path; Ollama pull-on-request + model allowlist + missing base URL | "real chat hits LLM"; Ollama default | BLOCKED |
| MED-1 | Medium | Docker base image Node 22 vs required Node 24 | Prerequisites / Tech stack | FAIL |
| MED-2 | Medium | Web `test:e2e` script vs vitest `include` mismatch | `pnpm run test:e2e` | FAIL |
| MED-3 | Medium | integration/e2e/regression server tests time out | `test:integration`, `test:e2e`, perf | FAIL |
| LOW-1 | Low | smoke/security suites silently skip (no coverage) | `test:smoke`, `test:security` | WARN |
| LOW-2 | Low | `OLLAMA_BASE_URL` documented but unused by Compose | `.env.example` / compose | WARN |

**Counts**: Critical 2 · High 2 · Medium 3 · Low 2 — **9 findings total.**

---

## 5. Overall verdict

**BROKEN (as a running system).**

- The building blocks pass: `pnpm install`, `.env` setup, `pnpm run test:unit`, package-level contract tests,
  and database migrations (in the `migrate` container) all work.
- However, the **documented primary run command (`pnpm run compose:dev`) does not produce a working stack** —
  every service hangs on the very first request because of the synchronous Fastify `onRequest` hook (CRIT-1),
  so health probes never pass and the orchestrator/gateway/worker/web never reach a usable state.
- A documented quality-gate command (`pnpm run test:contract`) and `pnpm run test:e2e` also fail.
- The **full user-facing end-to-end flow could not be exercised**, and a **real chat request hitting a local
  Ollama model is not achievable** without violating the no-download constraint and modifying source (HIGH-2).

### Blockers that stopped full validation
1. **CRIT-1** — services never respond / stack never healthy ⇒ no gateway/orchestrator/worker/web flow.
2. **HIGH-2** — only `gemma4:e2b`/`gemma4:e4b` are installed locally; they are not in the app's hardcoded
   approved-model allowlist, the adapter would `pull` (download) on every request, and no LLM path is wired
   into the running services. Per the mandatory "no pull / use installed model only" constraint, the chat
   step was recorded as blocked rather than worked around.
