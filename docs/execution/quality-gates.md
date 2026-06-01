# Minimum Quality Gates

Source of truth: [start.md §6](../../start.md), [DOCUMENTATION.md §6](../../DOCUMENTATION.md), [AGENTS.md](../../AGENTS.md).

Every delivery must pass all gates below before handoff. Run locally with a single command:

```bash
pnpm quality:gate
# equivalent:
bash scripts/quality-gate.sh
```

CI runs the same checks across jobs (see [CI mapping](#ci-mapping)); the `validate` job runs the orchestrator script for **static** gates only; other gates run in dedicated jobs to avoid duplicating Docker setup.

## Gate matrix

| Gate (start.md §6)                 | Command                                   | Blocking                                | Exit code |
| ---------------------------------- | ----------------------------------------- | --------------------------------------- | --------- |
| Lint (zero errors)                 | `pnpm run lint`                           | Yes                                     | `10`      |
| Valid formatting                   | `pnpm run format:check`                   | Yes                                     | `11`      |
| Typecheck                          | `pnpm run typecheck`                      | Yes                                     | `12`      |
| Stage tests                        | `pnpm run test:unit`                      | Yes                                     | `13`      |
| Compatible contracts               | `pnpm run test:contract`                  | Yes                                     | `14`      |
| No critical/high vulnerabilities   | `pnpm audit --audit-level high`           | Yes (high/critical)                     | `15`      |
| No unversioned breaking changes    | `pnpm run contract:compat` (when defined) | Yes when script exists                  | `16`      |
| Smoke test (changed functionality) | `pnpm run test:smoke`                     | Yes when stack up; skips if unavailable | `17`      |

Orchestrator: `pnpm quality:gate` → `scripts/quality-gate.sh`.

### Security audit policy

Aligned with [DOCUMENTATION.md §6](../../DOCUMENTATION.md):

- **Blocking:** critical and high (`pnpm audit --audit-level high`).
- **Advisory (non-blocking):** moderate and low. Remediate in normal backlog; do not bypass high/critical for delivery.

### Smoke tests

`tests/smoke/*` use `describe.skipIf` when `GATEWAY_URL` (default `http://localhost:3000`) is unreachable. Locally:

1. Start stack: `pnpm run compose:test`
2. Run gate: `pnpm quality:gate`

In CI, smoke runs in `integration` and `smoke` jobs with Docker Compose (see below).

### Contract compatibility

`contract:compat` is optional until published in root `package.json`. When absent, `pnpm run --if-present contract:compat` is a no-op and the gate passes.

## Skip flags (CI / partial runs)

Set to `1` to skip a gate inside `quality-gate.sh`:

| Variable                        | Skips              |
| ------------------------------- | ------------------ |
| `QUALITY_GATE_SKIP_STAGE_TESTS` | Unit / stage tests |
| `QUALITY_GATE_SKIP_CONTRACT`    | Contract tests     |
| `QUALITY_GATE_SKIP_SECURITY`    | `pnpm audit`       |
| `QUALITY_GATE_SKIP_BREAKING`    | `contract:compat`  |
| `QUALITY_GATE_SKIP_SMOKE`       | Smoke tests        |

## CI mapping

| Gate                    | CI job                 | Step                                   |
| ----------------------- | ---------------------- | -------------------------------------- |
| Lint, format, typecheck | `validate`             | `pnpm run quality:gate` (static skips) |
| Stage tests             | `unit`                 | `pnpm run test:unit -- --coverage`     |
| Contract tests          | `contract`             | `pnpm run test:contract`               |
| Breaking changes        | `contract`             | `pnpm run contract:compat`             |
| Security audit          | `security`             | `pnpm audit --audit-level high`        |
| Smoke                   | `integration`, `smoke` | `pnpm run test:smoke`                  |

Extended checks (Sonar, Trivy, gitleaks) are documented in [DOCUMENTATION.md §7](../../DOCUMENTATION.md) and are not part of the minimum local gate script.

## Troubleshooting

| Symptom   | Action                                        |
| --------- | --------------------------------------------- |
| Exit `10` | Fix ESLint errors: `pnpm run lint:fix`        |
| Exit `11` | Run `pnpm run format`                         |
| Exit `12` | Fix TypeScript errors per package             |
| Exit `13` | Fix failing unit tests: `pnpm run test:unit`  |
| Exit `14` | Fix contract tests: `pnpm run test:contract`  |
| Exit `15` | Upgrade or patch deps flagged by `pnpm audit` |
| Exit `17` | Start compose test profile, set `GATEWAY_URL` |
