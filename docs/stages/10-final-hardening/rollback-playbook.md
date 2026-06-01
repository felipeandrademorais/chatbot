# Stage 10 Rollback Playbook

Status: **ACTIVE (DRY-RUN DEFAULT)**

## Objective

Validate rollback readiness end-to-end and prove recovery inside RTO.

## Preconditions

1. A previously known-good image SHA exists.
2. Release workflow has completed at least one successful deployment run.
3. On-call engineering owner is available.

## Rehearsal (local/CI dry-run)

```bash
ROLLBACK_TARGET_SHA=<sha> ROLLBACK_RTO_SECONDS=3600 pnpm run test:rollback
```

This invokes:

- `scripts/rollback-production.sh`
- `scripts/smoke-production.sh`

## Production rollback (manual workflow dispatch)

1. Open GitHub Actions `Release` workflow.
2. Run `workflow_dispatch` with `rollback_to_sha=<sha-without-prefix>`.
3. Confirm `rollback` job succeeds.
4. Verify post-rollback smoke.
5. Record elapsed time and compare with RTO target.

## Security-first rule for ambiguity

If rollback target choice is ambiguous, roll back to the **latest previously verified stable SHA** and log the decision in release notes before continuing.
