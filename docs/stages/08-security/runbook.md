# Stage 08 Security Baseline and Runbook

## Purpose

Define enforceable security controls, exception handling, and operational drills for Stage 08.

## Security Baseline

- Authentication: protected gateway routes require signed `Bearer` JWT (`HS256`).
- Authorization: deny-by-default role/action matrix from `@chatbot/contracts` (`DEFAULT_AUTHORIZATION_MATRIX`).
- Tool execution: per-agent allowlist enforcement with timeout and input-size sandbox limits.
- CI security gates: secret scan (`gitleaks`), SAST (`Semgrep`), dependency audit (`pnpm audit --audit-level high`), container scan (`Trivy`), DAST authz smoke tests.
- Vulnerability thresholds:
  - Critical: `0` allowed.
  - High: `0` allowed on release branch and release workflow.

## Exception Process

When a control cannot be satisfied immediately:

1. Open an exception record in stage handoff with:
   - control name
   - technical reason
   - temporary compensating control
   - explicit expiry date
2. Require owner + reviewer approval before merge.
3. Block release if exception is expired.

No silent exceptions are allowed.

## Incident Response Procedure (Drill)

1. Detect: CI/security alert, runtime auth anomaly, or secret-leak signal.
2. Contain:
   - disable affected token/secret
   - revoke compromised credentials
   - restrict impacted route or tool policy
3. Eradicate:
   - patch root cause
   - re-run security test suite (`pnpm run test:security`)
4. Recover:
   - redeploy from clean artifact
   - validate with smoke + DAST checks
5. Post-incident:
   - record timeline and corrective actions
   - add regression coverage

## Credential Rotation Procedure (Tested)

### JWT signing key rotation

1. Generate new 32+ character secret.
2. Update deployment secret store for `JWT_SECRET`.
3. Redeploy gateway/web with new secret.
4. Validate:
   - old token fails (`401 invalid_token`)
   - new token succeeds for authorized role (`200`)
5. Document rotation timestamp and operator.

### Evidence

- Unit coverage: `packages/shared/__tests__/auth.test.ts` validates old tokens fail after secret rotation.
- Integration/security coverage: `tests/security/authz-dast-smoke.test.ts`.
