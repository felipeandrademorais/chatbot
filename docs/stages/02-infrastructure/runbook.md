# Stage 02 Infrastructure Runbook

## Bootstrap (local)

1. `cp .env.example .env` and set `POSTGRES_PASSWORD`.
2. `docker compose --profile dev up -d --build`
3. Verify: `curl -sf http://localhost:3000/health/ready`

## Bootstrap (CI / test profile)

```bash
cp .env.example .env
sed -i 's/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=ci-test-password/' .env
docker compose --profile test up -d --build --wait
pnpm run test:integration
pnpm run test:smoke
```

The **test** profile runs `postgres`, `redis`, `migrate`, `orchestrator`, and `gateway`.

## Migrations

- SQL files: `migrations/NNN_description.sql`
- Checksums stored in `schema_migrations`; editing applied files fails fast.
- Manual run: `pnpm --filter @chatbot/shared run build && POSTGRES_HOST=localhost POSTGRES_PASSWORD=... pnpm --filter @chatbot/shared run migrate`

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `Bind for 0.0.0.0:5432 failed: port is already allocated` | Another Postgres uses 5432. In `.env` set `POSTGRES_PUBLISH_PORT=5433` and `POSTGRES_PORT=5433` for host tools, then `docker compose down` and start again. |
| `POSTGRES_PASSWORD is required` | Set password in `.env` |
| Gateway readiness 503 | Check `docker compose logs orchestrator` |
| Migration checksum mismatch | Add a new migration; do not edit applied SQL |

## Health endpoints

| Service | Ready |
| ------- | ----- |
| gateway | `:3000/health/ready` |
| orchestrator | `:3001/health/ready` |
| worker | `:3002/health/ready` |
| web | `:3003/health/ready` |
