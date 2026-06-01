# Stage 10 Operations Checklist

Status: **DRAFT - SECURITY-FIRST**

## Pre-release gates

- [ ] `pnpm run test:regression` passes on release branch.
- [ ] `pnpm run test:rollback` passes within `ROLLBACK_RTO_SECONDS` target.
- [ ] `pnpm run contract:freeze` passes (or exception approved and recorded).
- [ ] Security report artifact uploaded (`reports/security-audit.json`).
- [ ] License report artifact uploaded (`reports/license-report.json` or `.txt`).

## Release execution

- [ ] Release workflow executed from semver tag.
- [ ] Staging deploy and smoke steps completed.
- [ ] Critical E2E rehearsal completed.
- [ ] Production deploy approved by engineering owner.
- [ ] Post-deploy smoke passed.

## Rollback and DR preparedness

- [ ] Rollback drill executed with `workflow_dispatch` + `rollback_to_sha`.
- [ ] Rollback duration recorded and under RTO target.
- [ ] Recovery ownership confirmed (engineering/security/operations).

## Evidence references

- CI run URL:
- Release run URL:
- Rollback run URL:
- Security report path:
- License report path:
