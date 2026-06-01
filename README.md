# chatbot

A multi-service, AI-first chatbot platform built as a TypeScript monorepo. It is engineered around a
**spec-driven**, **contract-first** model in which a centralized orchestrator routes work to specialized
workers, with deterministic integration contracts between modules and strict, CI-enforced quality gates.

The platform is **Docker-first** (every service runs in containers via Docker Compose) and **local-first**
for inference (Ollama is the default LLM provider, so the default execution path can run fully offline).

> The functional and architectural source of truth lives in [`DOCUMENTATION.md`](DOCUMENTATION.md) and the
> per-stage specs under [`docs/stages/`](docs/stages). This README summarizes what currently exists in the
> repository.

---

## Key features

- **Multi-service architecture** — independent `gateway`, `orchestrator`, `worker`, and `web` apps that
  communicate through versioned contracts.
- **Job-based execution** — the gateway validates requests and pushes jobs onto a queue; the orchestrator
  owns routing and workflow decisions; workers perform specialized execution and tool invocation.
- **Local-first LLM provider** — Ollama is the default provider interface, with provider timeouts, bounded
  retries, circuit breaking, and fallback routing defined in the integration contracts.
- **Tool sandboxing** — tool adapters live behind allowlists with validated, structured input
  (`packages/tools`), so agents never get unrestricted tool access.
- **Contract-first boundaries** — API schemas, event schemas, and DTO versions are centralized in
  `packages/contracts`, including a published OpenAPI spec (`packages/contracts/openapi/workflows.v1.json`)
  consumed by the web client via generated types.
- **Framework-independent domain** — pure business logic in `packages/domain` with no transport/framework
  coupling.
- **Observability baseline** — structured JSON logging (Pino), Prometheus metrics (`prom-client`), and
  correlation IDs (`requestId`, `workflowId`) standardized across services.
- **Health probes** — every app exposes `/health/live` and `/health/ready`, wired into Docker Compose
  healthchecks and startup ordering.
- **Quality-gated by CI** — lint, formatting, strict type checks, unit/contract/integration/E2E tests,
  and contract-compatibility checks gate every change.

---

## Architecture overview

This is a pnpm workspace monorepo (`apps/*` and `packages/*`).

```text
.
├── apps/
│   ├── gateway/        # @chatbot/gateway — transport, request validation, job creation
│   ├── orchestrator/   # @chatbot/orchestrator — workflow graph, routing decisions
│   ├── worker/         # @chatbot/worker — specialized execution, tool invocation
│   └── web/            # @chatbot/web — user-facing web interface (typed OpenAPI client)
├── packages/
│   ├── contracts/      # @chatbot/contracts — API/event schemas, DTO versions, OpenAPI spec
│   ├── domain/         # @chatbot/domain — pure, framework-independent business logic
│   ├── tools/          # @chatbot/tools — tool adapters, allowlists, sandbox wrappers
│   ├── shared/         # @chatbot/shared — cross-cutting utilities, config, DB, migrations, telemetry
│   └── test-kits/      # @chatbot/test-kits — test utilities and fixtures
├── tests/              # contract, integration, e2e, smoke, regression, security suites
├── docs/               # architecture stages (01–10) and templates
├── docker/             # Dockerfiles (Dockerfile.app, Dockerfile.migrate)
├── docker-compose.yml  # postgres, redis, migrate, gateway, orchestrator, worker, web
└── package.json        # root workspace scripts
```

### Module ownership

| Module                | Responsibility                                |
| --------------------- | --------------------------------------------- |
| `apps/gateway`        | Transport, request validation, job creation   |
| `apps/orchestrator`   | Workflow graph, routing decisions              |
| `apps/worker`         | Specialized execution, tool invocation         |
| `apps/web`            | User-facing web interface                      |
| `packages/contracts`  | API schemas, event schemas, DTO versions       |
| `packages/domain`     | Pure business logic (framework-independent)    |
| `packages/tools`      | Tool adapters, allowlists, sandbox wrappers    |
| `packages/shared`     | Cross-cutting utilities (config, DB, telemetry)|
| `packages/test-kits`  | Test utilities and fixtures                    |

### Request flow

```text
User → Gateway → Queue (BullMQ + Redis) → Orchestrator → Worker(s) → LLM / Tools / PostgreSQL
                                                                  ↓
                                                  Result returns back through the queue
```

The platform is delivered incrementally across ten documented stages (foundation → infrastructure →
core domain → APIs → integrations → frontend → observability → security → scalability → final hardening).
See [`docs/stages/`](docs/stages) for the per-stage specifications.

---

## Tech stack

| Layer            | Technology                                                       |
| ---------------- | ---------------------------------------------------------------- |
| Language         | TypeScript (strict mode)                                         |
| Runtime          | Node.js 24 LTS (`>=24.0.0 <25.0.0`)                              |
| Package manager  | pnpm 9 (`pnpm@9.15.4`)                                           |
| HTTP framework   | Fastify 5                                                        |
| Queue + cache    | Redis 7 + BullMQ                                                 |
| Database         | PostgreSQL 16                                                    |
| Validation       | Zod                                                              |
| Logging          | Pino (structured JSON)                                           |
| Metrics          | `prom-client` (Prometheus)                                       |
| LLM provider     | Ollama (local-first)                                             |
| Testing          | Vitest (unit/contract/integration/e2e), Stryker (mutation)      |
| Containerization | Docker + Docker Compose                                          |

> Versions reflect `package.json`, `AGENTS.md`, `DOCUMENTATION.md`, and `docker-compose.yml`. Note the
> runtime targets **Node.js 24**.

---

## Prerequisites

- **Node.js 24 LTS** (`>=24.0.0 <25.0.0`)
- **pnpm 9** (pinned to `9.15.4`)
- **Docker** and **Docker Compose** (the full stack runs in containers)

---

## Getting started

### 1. Clone and install

```bash
git clone <repository-url>
cd chatbot
pnpm install
```

### 2. Configure environment

Copy the example environment file and set the required secrets before starting the stack:

```bash
cp .env.example .env
```

At minimum, set the **required** variables (Compose will refuse to start without them):

- `POSTGRES_PASSWORD` — database password
- `JWT_SECRET` — secret used for authentication tokens

Other notable variables (see [`.env.example`](.env.example) for the full list):

- `POSTGRES_PUBLISH_PORT` (default `5433`), `REDIS_PUBLISH_PORT` (default `6380`) — host-side ports chosen
  to avoid clashing with a local Postgres/Redis.
- `GATEWAY_PORT` (`3000`), `ORCHESTRATOR_PORT` (`3001`), `WORKER_PORT` (`3002`), `WEB_PORT` (`3003`).
- `OLLAMA_BASE_URL` (default `http://localhost:11434`).
- Scalability tuning knobs (rate limits, retries, worker concurrency, cache TTLs).

### 3. Run the stack with Docker Compose

The Compose file defines two profiles. The `migrate` service runs database migrations automatically before
the app services start.

```bash
# Dev profile: postgres, redis, migrate, gateway, orchestrator, worker, web
pnpm run compose:dev

# Test profile: postgres, redis, migrate, gateway, orchestrator (waits for healthy)
pnpm run compose:test

# Tear everything down (and remove volumes)
pnpm run compose:down
```

Once the dev stack is healthy, services are reachable on the host at:

- Gateway: `http://localhost:3000`
- Orchestrator: `http://localhost:3001`
- Worker: `http://localhost:3002`
- Web: `http://localhost:3003`

Each service exposes `/health/live` and `/health/ready`.

### 4. Run migrations directly (optional)

Migrations run automatically via the `migrate` Compose service, but you can also run them from the host
(useful when connecting to a published Postgres port):

```bash
pnpm run migrate
```

### 5. Build and run apps locally (optional)

```bash
pnpm run build          # build every workspace package (pnpm -r run build)
pnpm --filter @chatbot/gateway run start
pnpm --filter @chatbot/orchestrator run start
pnpm --filter @chatbot/worker run start
pnpm --filter @chatbot/web run start
```

The web app generates its typed API client from the OpenAPI contract during build
(`pnpm --filter @chatbot/web run generate:client`).

---

## Testing

All test commands are defined in the root `package.json` and run with Vitest (some orchestrate shell
scripts). The suites live under [`tests/`](tests) and per-package `__tests__`/`*.test.ts` files.

```bash
pnpm run test:unit          # unit tests across all workspaces
pnpm run test:contract      # contract tests (tests/contract + package-level contract tests)
pnpm run test:integration   # integration suites (tests/integration)
pnpm run test:e2e           # end-to-end suites (per-package, if present)
pnpm run test:smoke         # smoke tests (tests/smoke)
pnpm run test:security      # security suites (tests/security)
pnpm run test:performance   # performance/regression + e2e (tests/regression + tests/e2e)
pnpm run test:regression    # regression matrix (scripts/run-regression-matrix.sh)
pnpm run test:chaos         # chaos drills (scripts/run-chaos-drills.sh)
pnpm run test:rollback      # rollback rehearsal (scripts/run-rollback-rehearsal.sh)
pnpm run release:readiness  # regression + chaos + rollback combined
```

What the suites cover (see `tests/`):

- **contract** — OpenAPI conformance, telemetry/health/domain architecture, provider payloads, foundation baseline.
- **integration** — compose health & migrations, Ollama fallback, telemetry pipeline, queue backpressure,
  dependency-failure degradation, frontend workflow, Postgres repository contracts.
- **e2e** — frontend critical journey, sustained load.
- **regression** — performance baselines, load-profile execution, frontend performance/accessibility budgets,
  stage-10 hardening.
- **smoke** — gateway ↔ orchestrator path.
- **security** — authorization / DAST smoke.

#### Smoke and security (live stack)

`pnpm run test:smoke` and `pnpm run test:security` call the gateway over HTTP. They **skip every test** unless both of the following are true:

- The gateway responds at `GATEWAY_URL` (default `http://localhost:3000`; start the stack with `pnpm run compose:dev` and wait for healthchecks).
- `JWT_SECRET` is set and at least **32 characters** (the same value the running stack uses).

Load secrets from `.env` before running — without `JWT_SECRET`, Vitest reports 0 executed tests even when the gateway is up:

```bash
source .env
GATEWAY_URL=http://127.0.0.1:3000 pnpm run test:smoke
GATEWAY_URL=http://127.0.0.1:3000 pnpm run test:security
```

You can `export JWT_SECRET=...` instead of `source .env` if you prefer not to load the full file.

#### Local Ollama and worker provider cold start

The worker exposes `POST /internal/provider/generate` (wired to the local Ollama adapter). With the default **`RETRY_TIMEOUT_MS=3000`**, the **first** call after a model has been idle may time out and return **503** `provider_unavailable` while Ollama loads the model into memory. Later calls typically succeed once the model is warm.

For local development, either **warm up** the configured model on the host (must match `OLLAMA_MODEL`, e.g. in `.env`) before hitting the worker endpoint, or **raise** `RETRY_TIMEOUT_MS` in `.env` and restart the stack.

Mutation testing is available for the domain package:

```bash
pnpm --filter @chatbot/domain run test:mutation
```

---

## Contributing

Quality is enforced by CI; prompt text is never the final authority. Before opening a PR, make sure the
quality gates pass locally.

### Quality gates

Every delivery must pass (CI blocks if any fail):

- **ESLint**: 0 errors
- **Prettier**: all files formatted (CI fails on diff)
- **TypeScript**: strict mode, 0 errors
- **Tests**: stage/relevant suites passing
- **Contracts**: compatible (no unversioned breaking changes)
- **Security**: no critical/high vulnerabilities
- **Smoke test** for changed functionality

When validating against a **running** Compose stack, `pnpm run test:smoke` and `pnpm run test:security` need `JWT_SECRET` from `.env` (see [Smoke and security (live stack)](#smoke-and-security-live-stack)); otherwise those suites skip.

Run the checks locally:

```bash
pnpm run lint            # eslint .
pnpm run format:check    # prettier --check .
pnpm run typecheck       # tsc --noEmit across workspaces
pnpm run test:unit
pnpm run openapi:lint    # lint the OpenAPI spec
pnpm run contract:compat # contract compatibility check
pnpm run quality:gate    # aggregate quality gate (scripts/quality-gate.sh)
```

Use `pnpm run lint:fix` and `pnpm run format` to auto-fix issues.

### Commits and branches

- **Conventional Commits**: `type(scope): message` (e.g. `feat(orchestrator): add routing fallback`).
  Scope should reference a stage or module (`stage-04`, `contracts`, `orchestrator`, …). Commit messages are
  linted via `pnpm run commitlint`.
- **Branching**: `feature/<stage-id>/<task-id>-<slug>` for implementation work; `main` is releasable only.
- **Pull requests**: reference the relevant stage and acceptance-criteria IDs, include test evidence, and
  keep changes scoped to a single owned module. Cross-module changes require a contract PR first; breaking
  changes require a version bump.

### Coding conventions

- TypeScript strict mode; **no `any`** in core contracts.
- Max cyclomatic complexity 10 per function; max cognitive complexity 15.
- Contract-first: define/extend contracts in `packages/contracts` before implementation.

See [`AGENTS.md`](AGENTS.md) and [`DOCUMENTATION.md`](DOCUMENTATION.md) for the full conventions and policy.

---

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 chatbot contributors.
