# QA Final Validation Report

- **Date/time**: 2026-06-01 ~09:25–09:34 (local)
- **Performed by**: QA Expert (final validation after parallel fix agents)
- **Repository**: `/Users/admin/Documents/code/chatbot`
- **Reference**: [`docs/qa/qa-inconsistency-report.md`](./qa-inconsistency-report.md) (9 findings)
- **Compose isolation**: `COMPOSE_PROJECT_NAME=chatbot-qa-final` (torn down with `docker compose -p chatbot-qa-final down -v` at end)
- **Ollama constraint**: Only `gemma4:e2b` and `gemma4:e4b` used; **no `ollama pull`** (model list identical before/after)

---

## Executive summary

| Metric | Value |
| --- | --- |
| Findings validated | 9 / 9 |
| PASS | 8 |
| PARTIAL | 1 (HIGH-1) |
| FAIL | 0 |
| **Overall verdict** | **PARTIAL** |
| **Open findings** | **1** (compose web → gateway routing via `WORKFLOW_API_BASE_URL`) |

Eight of nine original issues are fully resolved in code and automated tests. The stack starts healthy, contract/integration/e2e/regression suites pass, and the worker can call a local Ollama model without downloading. One operational gap remains: the **web container in Docker Compose** cannot submit workflows to the gateway because `WORKFLOW_API_BASE_URL` is not set for in-network access (`http://gateway:3000`).

---

## Environment

| Item | Value |
| --- | --- |
| Node.js | v24.15.0 |
| pnpm | 9.15.4 |
| Docker Compose | v5.1.3 |
| Ollama models (`ollama list`) | `gemma4:e2b`, `gemma4:e4b` (unchanged) |
| `.env` (validation tweaks) | `OLLAMA_BASE_URL=http://host.docker.internal:11434`, `OLLAMA_MODEL=gemma4:e2b`, `OLLAMA_SKIP_PULL=true` |

---

## Per-finding validation

### CRIT-1 — Stack healthy; `/health/ready` returns 200

| | |
| --- | --- |
| **Verdict** | **PASS** |
| **Evidence** | `COMPOSE_PROJECT_NAME=chatbot-qa-final docker compose --profile dev up -d --build` — all services started; orchestrator/gateway/worker/web reached healthy. |

```text
$ curl -sS http://127.0.0.1:3000/health/ready  → HTTP 200  (gateway)
$ curl -sS http://127.0.0.1:3001/health/ready  → HTTP 200  (orchestrator)
$ curl -sS http://127.0.0.1:3002/health/ready  → HTTP 200  (worker)
$ curl -sS http://127.0.0.1:3003/health/ready  → HTTP 200  (web)
```

`create-service-server.ts` now uses an **async** `onRequest` hook (fix for the original hang).

---

### CRIT-2 — `pnpm run test:contract` completes without hang

| | |
| --- | --- |
| **Verdict** | **PASS** |
| **Evidence** | |

```text
$ pnpm run test:contract
✓ tests/contract/api-openapi.contract.test.ts (7 tests) 50ms
 Test Files  8 passed (8)   Tests  25 passed (25)   Duration  408ms
packages/contracts … 16 passed
Exit code: 0
```

Previously ~120 s timeout on `app.inject()`; now completes in under 1 s.

---

### HIGH-1 — Web workflow aligns with gateway

| | |
| --- | --- |
| **Verdict** | **PARTIAL** |
| **API / contract alignment** | **PASS** — Gateway implements `POST /api/v1/workflows` → **202**, `GET /api/v1/workflows/{id}` → **200**, matching web client expectations. Contract test `frontend-client-contract.test.ts` passes. Integration `frontend-workflow.integration.test.ts` and e2e `frontend-critical-journey.e2e.test.ts` pass. |
| **Compose user path** | **FAIL** — Browser/form submit to web in Compose returns **502**. |

**Gateway (host → :3000):**

```text
POST /api/v1/workflows → HTTP 202
{"workflowId":"wf-f9e3d239-7501-41e9-b679-945f551d5d6b","status":"pending",...}
GET  /api/v1/workflows/wf-f9e3d239-... → HTTP 200
```

**Web (host → :3003, Compose stack):**

```text
POST /workflows (form) → HTTP 502 Bad Gateway
```

**Cause:** `docker-compose.yml` does not pass `WORKFLOW_API_BASE_URL` to the `web` service. Host `.env` has `WORKFLOW_API_BASE_URL=http://localhost:3000`, which inside the web container points at the web process itself, not `gateway:3000`. Gateway service correctly sets `ORCHESTRATOR_URL: http://orchestrator:3001` for in-network use; web needs the same pattern.

**Suggested fix (implementers):** Add to `x-app-environment` or `web.environment`:

`WORKFLOW_API_BASE_URL: ${WORKFLOW_API_BASE_URL:-http://gateway:3000}`

and document host vs in-compose values in `.env.example`.

---

### HIGH-2 — Real LLM path with local Ollama (no pull)

| | |
| --- |
| **Verdict** | **PASS** (with cold-start caveat) |
| **Evidence** | Worker exposes `/internal/provider/generate` wired to `OllamaLocalAdapter` with env-driven model allowlist. |

```text
$ docker compose exec -T worker printenv OLLAMA_BASE_URL OLLAMA_MODEL
http://host.docker.internal:11434
gemma4:e2b

# First call (cold model): HTTP 503 {"error":"provider_unavailable","message":"Provider timeout"}
# After host warm-up of gemma4:e2b via Ollama API:
POST /internal/provider/generate → HTTP 200
{"provider":"ollama","model":"gemma4:e2b","outputText":"OK","finishReason":"stop",...}
```

`ollama list` before and after: only `gemma4:e2b`, `gemma4:e4b` (no new models).

**Caveat:** Default `RETRY_TIMEOUT_MS=3000` may fail on first inference before the model is loaded; subsequent calls succeed (~771 ms). Consider documenting warm-up or increasing timeout for local dev.

---

### MED-1 — Dockerfiles use Node 24

| | |
| --- | --- |
| **Verdict** | **PASS** |
| **Evidence** | `docker/Dockerfile.app` and `docker/Dockerfile.migrate` use `ARG NODE_VERSION=24-alpine`. |

```text
$ docker compose exec -T gateway node -v
v24.16.0
```

No `Unsupported engine` warnings observed during this build.

---

### MED-2 — `pnpm run test:e2e` passes

| | |
| --- | --- |
| **Verdict** | **PASS** |
| **Evidence** | Root script runs `vitest run tests/e2e` (not the broken web-only path). |

```text
$ pnpm run test:e2e
✓ tests/e2e/frontend-critical-journey.e2e.test.ts (2 tests) 53ms
 Test Files  1 passed | 1 skipped   Tests  2 passed | 1 skipped
Exit code: 0
```

`apps/web/vitest.config.ts` includes `../../tests/e2e/**/*.test.ts` for package-local runs.

---

### MED-3 — Integration / e2e / regression server tests pass

| | |
| --- | --- |
| **Verdict** | **PASS** |
| **Evidence** | |

| Command | Result |
| --- | --- |
| `pnpm run test:integration` | 8 passed, 7 skipped — **0 failures** |
| `pnpm run test:e2e` | 2 passed — **0 failures** |
| `pnpm exec vitest run tests/regression` | 9 passed — **0 failures** |

Server `inject()` tests complete in tens of milliseconds (no timeouts).

---

### LOW-1 — Smoke / security run real tests when stack is up

| | |
| --- | --- |
| **Verdict** | **PASS** (when env + stack available) |
| **Evidence** | With live stack and `source .env` (for `JWT_SECRET`): |

```text
$ source .env && GATEWAY_URL=http://127.0.0.1:3000 pnpm run test:smoke
✓ tests/smoke/gateway-orchestrator.test.ts (1 test)

$ source .env && GATEWAY_URL=http://127.0.0.1:3000 pnpm run test:security
✓ tests/security/authz-dast-smoke.test.ts (3 tests)
```

Without sourcing `.env`, suites still **skip** (0 executed) even if the gateway is up — README could mention exporting `JWT_SECRET` for smoke/security.

`tests/integration/compose-health.test.ts` with stack URLs: **1 passed**.

---

### LOW-2 — `OLLAMA_BASE_URL` forwarded in Compose

| | |
| --- | --- |
| **Verdict** | **PASS** |
| **Evidence** | `docker-compose.yml` `x-app-environment` includes `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_APPROVED_MODELS`, `OLLAMA_FALLBACK_MODEL` with Docker-friendly defaults (`host.docker.internal`). Worker container confirmed at runtime (see HIGH-2). |

---

## Command summary (README-aligned)

| Step | Command | Result |
| --- | --- | --- |
| Install | `pnpm install` | (assumed OK; lockfile present) |
| Contract | `pnpm run test:contract` | PASS |
| Compose | `COMPOSE_PROJECT_NAME=chatbot-qa-final docker compose --profile dev up -d --build` | PASS |
| Integration | `pnpm run test:integration` | PASS |
| E2E | `pnpm run test:e2e` | PASS |
| Regression | `pnpm exec vitest run tests/regression` | PASS |
| Smoke | `source .env && GATEWAY_URL=… pnpm run test:smoke` | PASS (1 test) |
| Security | `source .env && GATEWAY_URL=… pnpm run test:security` | PASS (3 tests) |
| Teardown | `COMPOSE_PROJECT_NAME=chatbot-qa-final docker compose --profile dev down -v` | Done |

---

## Overall verdict: **PARTIAL**

The platform is **substantially fixed** relative to the inconsistency report: services respond, documented test commands pass, Docker uses Node 24, Ollama is wired with installed models and no pull, and smoke/security execute against a live stack when JWT is available.

**Remaining issue (1 open):**

| ID | Issue | Severity |
| --- | --- | --- |
| HIGH-1 (residual) | Web UI workflow submit over Docker Compose returns **502** because `WORKFLOW_API_BASE_URL` is not set for in-network gateway access | High (user-facing compose flow) |

All other original findings (CRIT-1, CRIT-2, HIGH-2, MED-1–3, LOW-1, LOW-2) are **PASS** for this validation run.

---

## Recommendations for implementers

1. Add `WORKFLOW_API_BASE_URL` to Compose for the `web` service (default `http://gateway:3000`).
2. Document that `pnpm run test:smoke` / `test:security` require `JWT_SECRET` (e.g. `source .env`). — **Addressed in README** (Testing → Smoke and security; Contributing).
3. Optional: increase `RETRY_TIMEOUT_MS` for local Ollama cold starts or document model warm-up. — **Addressed in README** (Testing → Local Ollama and worker provider cold start).

---

## References

- Prior report: [`qa-inconsistency-report.md`](./qa-inconsistency-report.md)
- README: [`../../README.md`](../../README.md)
