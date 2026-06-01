# QA Cycle 3 — Full Validation Report

- **Date/time**: 2026-06-01 ~09:51–09:54 (local)
- **Performed by**: QA Expert (third full validation cycle; regression detection)
- **Repository**: `/Users/admin/Documents/code/chatbot`
- **Reference baseline**: [`docs/qa/qa-revalidation-report.md`](./qa-revalidation-report.md) (PASS, 0 open findings)
- **Original findings**: [`docs/qa/qa-inconsistency-report.md`](./qa-inconsistency-report.md) (9 IDs)
- **Compose isolation**: `COMPOSE_PROJECT_NAME=chatbot-qa-cycle3` (torn down with `docker compose -p chatbot-qa-cycle3 --profile dev down -v` at end)
- **Startup delay**: `sleep 120` before compose (parallel-agent avoidance)
- **Ollama constraint**: `ollama list` only — `gemma4:e2b`, `gemma4:e4b`; **no `ollama pull`**

---

## Executive summary

| Metric | Value |
| --- | --- |
| Findings re-checked | 9 / 9 |
| PASS | 9 |
| PARTIAL | 0 |
| FAIL | 0 |
| **Overall verdict** | **PASS** |
| **Open findings** | **0** |

No regressions detected versus the cycle-2 re-validation baseline. **HIGH-1** (Compose web `POST /workflows` must not return **502**) remains **PASS**: invalid submit **400**, valid submit **302**.

---

## Environment

| Item | Value |
| --- | --- |
| Node.js (host) | v24.15.0 |
| pnpm | 9.15.4 |
| Docker Compose | v5.1.3 |
| Node.js (gateway container) | v24.16.0 |
| Ollama models (`ollama list`, before/after) | `gemma4:e2b`, `gemma4:e4b` (unchanged) |
| `.env` | Present |

---

## README contributor flow (step summary)

| Step | Command | Result |
| --- | --- | --- |
| Wait | `sleep 120` | Done |
| Install | `pnpm install` | PASS (lockfile up to date) |
| Unit | `pnpm run test:unit` | PASS |
| Contract | `pnpm run test:contract` | PASS (25 + 16 package tests) |
| Compose | `COMPOSE_PROJECT_NAME=chatbot-qa-cycle3 docker compose --profile dev up -d --build` | PASS (all app services healthy) |
| Integration | `pnpm run test:integration` | PASS (9 passed, 6 skipped) |
| E2E | `pnpm run test:e2e` | PASS (3 passed) |
| Regression | `pnpm exec vitest run tests/regression` | PASS (9 passed) |
| Smoke / security | `source .env && GATEWAY_URL=http://127.0.0.1:3000 pnpm run test:smoke\|test:security` | PASS (1 + 3 tests executed) |
| Teardown | `COMPOSE_PROJECT_NAME=chatbot-qa-cycle3 docker compose --profile dev down -v` | Done |

---

## Per-finding validation (9 original IDs)

### CRIT-1 — Stack healthy; `/health/ready` returns 200

| | |
| --- | --- |
| **Verdict** | **PASS** |

```text
$ curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/health/ready  → 200
$ curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3001/health/ready  → 200
$ curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3002/health/ready  → 200
$ curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3003/health/ready  → 200
```

Compose: gateway, orchestrator, worker, web **healthy**; migrate **Exited (0)**.

---

### CRIT-2 — `pnpm run test:contract` completes without hang

| | |
| --- | --- |
| **Verdict** | **PASS** |

```text
$ pnpm run test:contract
 Test Files  8 passed (8)   Tests  25 passed (25)   Duration  425ms
packages/contracts … 16 passed
Exit code: 0
```

---

### HIGH-1 — Web in Compose: `POST /workflows` must NOT be 502

| | |
| --- | --- |
| **Verdict** | **PASS** |
| **Expectation** | **302** (valid) or **400** (validation); never **502** |

```text
$ COMPOSE_PROJECT_NAME=chatbot-qa-cycle3 docker compose exec -T web printenv WORKFLOW_API_BASE_URL
http://gateway:3000

$ docker compose exec -T web wget -qO- http://gateway:3000/health/ready
{"status":"ok","service":"gateway",...}

$ curl -X POST http://127.0.0.1:3003/workflows -d 'prompt=qa-cycle3-smoke'
HTTP 400  (body: "Task type is required.")

$ curl -D - -o /dev/null -X POST http://127.0.0.1:3003/workflows \
    -d 'taskType=summary&payload=%7B%7D'
HTTP/1.1 302 Found
location: /workflows/wf-ac0af9fa-3bbf-4557-8cee-c692872ac2ba
```

No **502 Bad Gateway** observed.

---

### HIGH-2 — Real LLM path with local Ollama (no pull)

| | |
| --- | --- |
| **Verdict** | **PASS** (cold-start caveat unchanged) |

```text
$ docker compose exec -T worker printenv OLLAMA_BASE_URL OLLAMA_MODEL
http://host.docker.internal:11434
gemma4:e2b

$ curl -X POST http://127.0.0.1:3002/internal/provider/generate \
    -H 'Content-Type: application/json' \
    -d '{"requestId":"qa-cycle3","workflowId":"wf-qa","model":"gemma4:e2b","prompt":"Say OK","maxOutputTokens":16}'
HTTP 503  {"error":"provider_unavailable","message":"Provider timeout"}
```

Endpoint is wired; allowlist uses installed `gemma4:e2b`. **503** on first call matches README cold-start (`RETRY_TIMEOUT_MS=3000`). `ollama list` unchanged (no pull).

---

### MED-1 — Dockerfiles use Node 24

| | |
| --- | --- |
| **Verdict** | **PASS** |

```text
$ docker compose exec -T gateway node -v
v24.16.0
```

`docker/Dockerfile.app` / `Dockerfile.migrate`: `ARG NODE_VERSION=24-alpine`.

---

### MED-2 — `pnpm run test:e2e` passes

| | |
| --- | --- |
| **Verdict** | **PASS** |

```text
$ pnpm run test:e2e
 Test Files  2 passed (2)   Tests  3 passed (3)
Exit code: 0
```

---

### MED-3 — Integration / e2e / regression server tests pass

| | |
| --- | --- |
| **Verdict** | **PASS** |

| Command | Result |
| --- | --- |
| `pnpm run test:integration` | 9 passed, 6 skipped — **0 failures** |
| `pnpm run test:e2e` | 3 passed — **0 failures** |
| `pnpm exec vitest run tests/regression` | 9 passed — **0 failures** |

---

### LOW-1 — Smoke / security run real tests when stack is up

| | |
| --- | --- |
| **Verdict** | **PASS** |

```text
$ source .env && GATEWAY_URL=http://127.0.0.1:3000 pnpm run test:smoke
✓ tests/smoke/gateway-orchestrator.test.ts (1 test)

$ source .env && GATEWAY_URL=http://127.0.0.1:3000 pnpm run test:security
✓ tests/security/authz-dast-smoke.test.ts (3 tests)
```

Tests **executed** (not skipped) with live stack and `JWT_SECRET` from `.env`.

---

### LOW-2 — `OLLAMA_BASE_URL` forwarded in Compose

| | |
| --- | --- |
| **Verdict** | **PASS** |

Worker runtime: `OLLAMA_BASE_URL=http://host.docker.internal:11434` (see HIGH-2).

---

## Regression vs cycle 2

| ID | Cycle 2 (re-validation) | Cycle 3 |
| --- | --- | --- |
| CRIT-1 | PASS | PASS |
| CRIT-2 | PASS | PASS |
| HIGH-1 | PASS | PASS |
| HIGH-2 | PASS | PASS |
| MED-1 | PASS | PASS |
| MED-2 | PASS | PASS |
| MED-3 | PASS | PASS |
| LOW-1 | PASS | PASS |
| LOW-2 | PASS | PASS |

---

## Overall verdict: **PASS**

**Open findings: 0**

### Actionable fixes

None — all nine findings **PASS** for this cycle.

### Informational notes (not open findings)

- **HIGH-2**: First `POST /internal/provider/generate` after idle may return **503** until Ollama warms the model; documented in README.
- **HIGH-1 (historical)**: Original inconsistency report cited OpenAPI divergence; current web client is generated from `v1.0.0.openapi.json` and Compose routing uses `WORKFLOW_API_BASE_URL=http://gateway:3000`.

---

## References

- Prior re-validation: [`qa-revalidation-report.md`](./qa-revalidation-report.md)
- Initial validation: [`qa-validation-report.md`](./qa-validation-report.md)
- Inconsistency source: [`qa-inconsistency-report.md`](./qa-inconsistency-report.md)
- README: [`../../README.md`](../../README.md)
