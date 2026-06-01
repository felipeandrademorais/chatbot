# QA Re-Validation Report

- **Date/time**: 2026-06-01 ~09:43–09:49 (local)
- **Performed by**: QA Expert (re-validation after fix agents)
- **Repository**: `/Users/admin/Documents/code/chatbot`
- **Reference**: [`docs/qa/qa-validation-report.md`](./qa-validation-report.md) (1 open finding: HIGH-1 residual)
- **Compose isolation**: `COMPOSE_PROJECT_NAME=chatbot-qa-revalidate` (torn down with `docker compose -p chatbot-qa-revalidate --profile dev down -v` at end)
- **Startup delay**: `sleep 180` before compose (allow parallel agents to finish)
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

The **HIGH-1 residual** (Compose web → gateway via `WORKFLOW_API_BASE_URL`) is **resolved**. `docker-compose.yml` sets `WORKFLOW_API_BASE_URL: http://gateway:3000` on the `web` service; form submit returns **302** (redirect to workflow detail), not **502**. All other findings remain **PASS** on spot-check.

---

## Environment

| Item | Value |
| --- | --- |
| Node.js (host) | v24.15.0 |
| pnpm | 9.15.4 |
| Docker Compose | v5.1.3 |
| Node.js (gateway container) | v24.16.0 |
| Ollama models (`ollama list`) | `gemma4:e2b`, `gemma4:e4b` |
| `.env` | Present (used for compose + smoke/security) |

---

## Per-finding re-validation

### HIGH-1 (residual) — Web in Compose: workflow submit not 502

| | |
| --- | --- |
| **Verdict** | **PASS** |
| **Fix verified** | `docker-compose.yml` `web.environment` includes in-network gateway URL. |

```text
$ COMPOSE_PROJECT_NAME=chatbot-qa-revalidate docker compose exec -T web printenv WORKFLOW_API_BASE_URL
http://gateway:3000

$ docker compose exec -T web wget -qO- http://gateway:3000/health/ready
{"status":"ok","service":"gateway",...}
```

**Invalid form (validation, not gateway failure):**

```text
$ curl -X POST http://127.0.0.1:3003/workflows -d 'prompt=qa-revalidate-smoke'
HTTP 400  (body: "Task type is required.")
```

**Valid form submit (user path):**

```text
$ curl -D - -X POST http://127.0.0.1:3003/workflows \
    -d 'taskType=summary&payload=%7B%7D'
HTTP/1.1 302 Found
location: /workflows/wf-9030f881-b6d2-47c9-b4f5-e8c709a8285b
```

No **502 Bad Gateway** on successful gateway reachability.

`.env.example` documents host vs Compose values:

```text
WORKFLOW_API_BASE_URL=http://localhost:3000
# Docker Compose sets http://gateway:3000 on the web service (see docker-compose.yml).
```

---

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

---

### CRIT-2 — `pnpm run test:contract` completes without hang

| | |
| --- | --- |
| **Verdict** | **PASS** |

```text
$ pnpm run test:contract
 Test Files  8 passed (8)   Tests  25 passed (25)   Duration  624ms
packages/contracts … 16 passed
Exit code: 0
```

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
    -d '{"requestId":"qa-reval","workflowId":"wf-qa","model":"gemma4:e2b","prompt":"Say OK","maxOutputTokens":16}'
HTTP 503  {"error":"provider_unavailable","message":"Provider timeout"}
```

Wiring and allowlist are correct; **503** on first call matches README cold-start behavior (`RETRY_TIMEOUT_MS=3000`). No new models pulled (`ollama list` unchanged).

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

**Informational:** README documents `JWT_SECRET` (≥32 chars) and `source .env` for smoke/security — no gap vs prior validation.

---

### LOW-2 — `OLLAMA_BASE_URL` forwarded in Compose

| | |
| --- | --- |
| **Verdict** | **PASS** |

`x-app-environment` includes Ollama vars; worker runtime confirmed (see HIGH-2).

---

## Command summary

| Step | Command | Result |
| --- | --- | --- |
| Wait | `sleep 180` | Done |
| Contract | `pnpm run test:contract` | PASS |
| Compose | `COMPOSE_PROJECT_NAME=chatbot-qa-revalidate docker compose --profile dev up -d --build` | PASS |
| HIGH-1 | `POST /workflows` (valid form) on `:3003` | **302** (not 502) |
| Health | `curl` `:3000–3003/health/ready` | PASS (all 200) |
| Integration | `pnpm run test:integration` | PASS |
| E2E | `pnpm run test:e2e` | PASS |
| Regression | `pnpm exec vitest run tests/regression` | PASS |
| Smoke / security | `source .env && GATEWAY_URL=… pnpm run test:smoke\|test:security` | PASS |
| Teardown | `COMPOSE_PROJECT_NAME=chatbot-qa-revalidate docker compose --profile dev down -v` | Done |

---

## Overall verdict: **PASS**

All nine original inconsistency findings, including the **HIGH-1 Compose web → gateway** residual, are **PASS** for this re-validation run.

| ID | Prior (qa-validation-report) | Re-validation |
| --- | --- | --- |
| CRIT-1 | PASS | PASS |
| CRIT-2 | PASS | PASS |
| HIGH-1 | PARTIAL (502 in Compose) | **PASS** |
| HIGH-2 | PASS | PASS |
| MED-1 | PASS | PASS |
| MED-2 | PASS | PASS |
| MED-3 | PASS | PASS |
| LOW-1 | PASS | PASS |
| LOW-2 | PASS | PASS |

**Open findings: 0**

---

## References

- Prior validation: [`qa-validation-report.md`](./qa-validation-report.md)
- Inconsistency source: [`qa-inconsistency-report.md`](./qa-inconsistency-report.md)
- README: [`../../README.md`](../../README.md) (smoke/security JWT, Ollama cold start)
