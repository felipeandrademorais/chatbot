# Project Success Criteria

**Project status: NOT COMPLETE**

Per [start.md §12](../start.md#12-final-success-criteria), the project is complete only when every item below is satisfied. Until then, status remains **NOT COMPLETE**.

Track per-stage acceptance and DoD in [execution/stage-dod-aggregator.md](execution/stage-dod-aggregator.md). Run structural checks with `pnpm readiness:check`; run full quality gates with `bash scripts/check-project-readiness.sh --full` (requires `quality:gate` script in `package.json`).

---

## 1. Stage DoD (01–10)

| Gate | Verification | Doc |
| ---- | ------------ | --- |
| Stage 01 DoD complete | All `AC-01-*` pass; foundation checklist signed | [01-foundation](stages/01-foundation/README.md#definition-of-done) |
| Stage 02 DoD complete | All `AC-02-*` pass; infra reproducible + runbook | [02-infrastructure](stages/02-infrastructure/README.md#definition-of-done) |
| Stage 03 DoD complete | All `AC-03-*` pass; domain API versioned | [03-core-domain](stages/03-core-domain/README.md#definition-of-done) |
| Stage 04 DoD complete | All `AC-04-*` pass; API contracts versioned | [04-apis](stages/04-apis/README.md#definition-of-done) |
| Stage 05 DoD complete | All `AC-05-*` pass; adapters replaceable | [05-integrations](stages/05-integrations/README.md#definition-of-done) |
| Stage 06 DoD complete | All `AC-06-*` pass; contract-generated clients only | [06-frontend](stages/06-frontend/README.md#definition-of-done) |
| Stage 07 DoD complete | All `AC-07-*` pass; operational runbook published | [07-observability](stages/07-observability/README.md#definition-of-done) |
| Stage 08 DoD complete | All `AC-08-*` pass; security baseline published | [08-security](stages/08-security/README.md#definition-of-done) |
| Stage 09 DoD complete | All `AC-09-*` pass; performance budget + capacity guide | [09-scalability](stages/09-scalability/README.md#definition-of-done) |
| Stage 10 DoD complete | All `AC-10-*` pass; go/no-go signed | [10-final-hardening](stages/10-final-hardening/README.md#definition-of-done) |

**Aggregator status:** [stage-dod-aggregator.md](execution/stage-dod-aggregator.md) (default **NOT COMPLETE** per row until evidence recorded).

**Quick verification (per stage, after implementation):**

```bash
# Update aggregator rows to COMPLETE only with evidence; then spot-check:
grep -E '^- \[ \]|^- \[x\]' docs/stages/*/README.md
```

---

## 2. CI/CD green

| Criterion | Verification command / link |
| --------- | --------------------------- |
| PR/push CI workflow present | File: [.github/workflows/ci.yml](../.github/workflows/ci.yml) |
| Validate job (lint, format, types) | `pnpm format:check && pnpm lint && pnpm typecheck` |
| Unit tests in CI | `pnpm test:unit` |
| Integration (compose) in CI | `pnpm compose:test && pnpm test:integration` |
| Contract tests in CI | `pnpm test:contract` |
| Smoke tests in CI | `pnpm test:smoke` |
| CI green on default branch | `gh run list --workflow=ci.yml --branch=main --limit=1` or GitHub Actions UI |
| Release workflow defined | [.github/workflows/release.yml](../.github/workflows/release.yml) |
| Nightly quality workflow defined | [.github/workflows/nightly-quality.yml](../.github/workflows/nightly-quality.yml) |

Policy reference: [DOCUMENTATION.md §7](../DOCUMENTATION.md#7-cicd-strategy-docker--compose).

---

## 3. Quality gate approved

| Criterion | Verification command / link |
| --------- | --------------------------- |
| ESLint 0 errors | `pnpm lint` |
| Prettier clean | `pnpm format:check` |
| TypeScript strict, 0 errors | `pnpm typecheck` |
| Unit tests pass | `pnpm test:unit` |
| Contract tests pass | `pnpm test:contract` |
| Integration tests pass | `pnpm compose:test && pnpm test:integration` |
| Smoke tests pass | `pnpm test:smoke` |
| Coverage thresholds (when enforced) | CI unit job + Sonar (see `sonar-project.properties`) |
| Full quality profile (M10) | `bash scripts/check-project-readiness.sh --full` → runs `pnpm quality:gate` when defined |

Policy reference: [DOCUMENTATION.md §6](../DOCUMENTATION.md#6-quality-gate-policy-mandatory), [AGENTS.md](../AGENTS.md#quality-gate-requirements).

Global checklist mirror: [DOCUMENTATION.md §12](../DOCUMENTATION.md#12-final-global-quality-checklist).

---

## 4. Security — no critical findings

| Criterion | Verification command / link |
| --------- | --------------------------- |
| 0 critical / 0 high vulnerabilities (policy) | CI `security` job in [ci.yml](../.github/workflows/ci.yml); dependency audit |
| No secrets in tracked files | `gitleaks detect` or CI secrets scan (when configured) |
| Container scan on build | CI `build` / image scan steps |
| Security stage AC met | [08-security README](stages/08-security/README.md#acceptance-criteria) |
| SBOM at build (target) | Release/build pipeline artifacts |

Policy reference: [DOCUMENTATION.md §6](../DOCUMENTATION.md#6-quality-gate-policy-mandatory) (vulnerability policy), stage 08 DoD.

---

## 5. Rollback tested

| Criterion | Verification command / link |
| --------- | --------------------------- |
| Rollback workflow input documented | [release.yml](../.github/workflows/release.yml) (`rollback_to_sha`) |
| Rollback script exists | `test -f scripts/rollback-production.sh` |
| Rollback rehearsal (AC-10-002) | Manual: `workflow_dispatch` on Release with `rollback_to_sha`; record in aggregator |
| DB forward-only + compensating migrations | [DOCUMENTATION.md §11](../DOCUMENTATION.md#11-rollback-and-recovery-strategy) |
| Post-deploy smoke after rollback | `scripts/smoke-production.sh` (when present) |

---

## 6. Documentation updated

| Criterion | Verification command / link |
| --------- | --------------------------- |
| Architecture blueprint current | [DOCUMENTATION.md](../DOCUMENTATION.md) |
| Agent execution rules current | [AGENTS.md](../AGENTS.md) |
| All stage READMEs present (01–10) | `pnpm readiness:check` (structural) |
| Handoff template available | [docs/templates/agent-handoff-template.md](templates/agent-handoff-template.md) |
| Infra runbook (stage 02+) | [02-infrastructure/runbook.md](stages/02-infrastructure/runbook.md) |
| Success criteria + aggregator maintained | This file + [stage-dod-aggregator.md](execution/stage-dod-aggregator.md) |
| Release notes / ops checklist (M10) | Recorded at stage 10 DoD sign-off |

---

## 7. Automated readiness check

| Command | Purpose |
| ------- | ------- |
| `pnpm readiness:check` | Fail if required repo artifacts missing (lightweight) |
| `bash scripts/check-project-readiness.sh --full` | Above + `pnpm quality:gate` when script exists |

---

## Sign-off

| Role | Name | Date | Status |
| ---- | ---- | ---- | ------ |
| Engineering owner | | | NOT COMPLETE |
| Security owner | | | NOT COMPLETE |
| Operations owner | | | NOT COMPLETE |

**Final rule:** If any row in sections 1–6 is not satisfied, project status remains **NOT COMPLETE**.
