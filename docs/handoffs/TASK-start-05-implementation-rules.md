# Agent Handoff — TASK-start-05-implementation-rules

## Header

- Stage: start.md bootstrap (§5 Implementation Rules)
- Task ID: TASK-start-05-implementation-rules
- From Agent: Executor
- To Agent: Verifier / Integrator
- Commit SHA: (uncommitted — local workspace)
- Timestamp: 2026-06-01

## Objective

Enforce and document start.md §5 non-negotiable implementation rules: Docker/compose, strict TypeScript, contract-first boundaries, and no `any` in core contracts.

## Scope

### Changed / added

- `docs/execution/docker-requirements.md` (new)
- `docs/execution/contract-first-checklist.md` (new)
- `scripts/check-contract-first.sh` (new, executable)
- `eslint.config.mjs` — scoped override for `packages/contracts/src/**/*.ts`
- `.github/workflows/ci.yml` — contract job: boundary script + contracts ESLint

### Not modified (already compliant)

- `docker-compose.yml` — `dev` and `test` profiles present; `docker compose config` OK
- `docker/**`, root `Dockerfile` — no fixes required
- `tsconfig.base.json` / package tsconfigs — all extend base with `strict: true`
- App sources — no `@chatbot/domain` imports

## Contracts

- References: `packages/contracts/**`, `docs/execution/contract-first-checklist.md`
- No contract schema changes in this task

## Work Completed

1. Documented Docker-first execution (profiles, env, images, CI alignment).
2. Documented contract-first workflow and PR checklist.
3. Added grep-based `scripts/check-contract-first.sh` (apps → no domain; contracts → no explicit `any` text).
4. Tightened ESLint for `packages/contracts/src` and wired CI steps in `contract` job.

## Enforced vs documented-only

| Rule | Enforced | Documented only |
| ---- | -------- | ----------------- |
| Docker / compose mandatory | CI already uses `--profile test`; `compose:dev` / `compose:test` scripts | `docker-requirements.md` |
| Strict TypeScript | Existing `tsconfig.base.json` (`strict`, `noImplicitAny`, `exactOptionalPropertyTypes`) | Checklist + handoff note |
| Contract-first | `scripts/check-contract-first.sh` + CI step | `contract-first-checklist.md` |
| No `any` in core contracts | ESLint override + CI `eslint packages/contracts/src` + script grep | Same docs |
| No bypass lint/gates | Unchanged (existing CI jobs) | start.md §6 referenced in checklist |

## Evidence

```bash
POSTGRES_PASSWORD=test docker compose config -q   # exit 0
bash scripts/check-contract-first.sh              # contract-first: OK
pnpm lint                                         # exit 0
pnpm exec eslint packages/contracts/src --max-warnings 0  # exit 0
```

## Open Issues

- None blocking. Optional: add root `package.json` script `check:contract-first` for local ergonomics (not required by task).

## Next Steps

1. Verifier: confirm CI `contract` job on a PR branch.
2. Coordinators: link stage READMEs to `docs/execution/*` where useful.
3. Stage 03: implement domain behind contracts without adding app → domain imports.
