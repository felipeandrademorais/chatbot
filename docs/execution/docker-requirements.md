# Docker execution requirements

This document enforces **start.md §5** and **DOCUMENTATION.md** (Docker-first deployment). Local and CI execution of the application stack must use Docker Compose unless a stage README explicitly documents a narrower exception.

## Mandatory

| Requirement | Enforcement |
| ----------- | ------------- |
| `docker` + `docker compose` available | Required on developer machines and CI runners |
| `docker-compose.yml` at repo root | Single compose file for infra + apps |
| `.env` from `.env.example` | `POSTGRES_PASSWORD` required; compose fails without it |
| Profiles `dev` and `test` | Services gated with `profiles: [dev]` and/or `[test]` |

## Profiles

### Default (no profile)

Always starts:

- `postgres` (PostgreSQL 16)
- `redis` (Redis 7)

Use for host-only tools or bringing up dependencies before a profiled stack.

### `dev`

Full local stack:

- `migrate` → `orchestrator`, `gateway`, `worker`, `web`
- All app services use `docker/Dockerfile.app`; migrations use `docker/Dockerfile.migrate`

```bash
cp .env.example .env   # set POSTGRES_PASSWORD
pnpm run compose:dev   # docker compose --profile dev up -d --build
```

### `test`

CI and integration/smoke tests (minimal app surface):

- `migrate` → `orchestrator`, `gateway`
- `worker` and `web` are **dev-only** (not in test profile)

```bash
pnpm run compose:test  # docker compose --profile test up -d --build --wait
```

See `docs/stages/02-infrastructure/runbook.md` for troubleshooting.

## Environment

- Copy `.env.example` → `.env` before `docker compose up`.
- Host-published ports default to `5433` (Postgres) and `6380` (Redis) to avoid clashes with local daemons.
- Inside the compose network, apps use `postgres:5432` and `redis:6379` (see `x-app-environment` in `docker-compose.yml`).

## Images

| Path | Purpose |
| ---- | ------- |
| `docker/Dockerfile.app` | Multi-stage build per app (`APP_NAME`, `APP_PACKAGE`, `APP_PORT` build args) |
| `docker/Dockerfile.migrate` | One-shot migration runner |
| `Dockerfile` (root) | CI/security default image (gateway-focused) |

## Validation

```bash
POSTGRES_PASSWORD=local-dev docker compose config
pnpm run compose:down   # tear down dev + test profiles
```

CI uses `--profile test` in the `integration` and `smoke` jobs (`.github/workflows/ci.yml`).

## What is documented-only here

Compose profiles, healthchecks, and Dockerfiles were already aligned with stage 02; this file records the contract. No structural compose changes are required when `docker compose config` succeeds and profiles match the runbook.
