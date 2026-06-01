# Stage 08 — Security — Continuation Prompt

**Milestone:** M8 Security — policy hardening (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 08 (security).

Read in order: start.md, DOCUMENTATION.md, AGENTS.md, docs/stages/08-security/README.md, docs/templates/agent-handoff-template.md.

Re-validate stages 02, 04, 05, and 07: runtime bootstrap secure, APIs protected and contract-tested, tool allowlists at integration layer, observability can detect auth failures. Fix any infra secret-scan regressions before auth work.

Implement only stage 08 scope: authN/authZ (gateway + web), JWT claims contract, role-based authorization matrix, per-agent tool allowlists and sandboxed execution, secret manager usage, SAST/dependency/secret/container scans as mandatory CI gates, threat model and deny-by-default policies.

Key contracts: auth token claims shared across gateway and web; authorization matrix by role and action; packages/contracts tool allowlist alignment.

Run mandatory quality gates plus: no unauthenticated access to protected resources (AC-08-001), all security scans pass thresholds (AC-08-002), tool permissions enforced per agent role (AC-08-003), 0 critical / 0 high vulnerabilities on release branch, 100% security hotspot review.

Deliver handoff + security baseline + incident/credential rotation procedures + Final Validation Checklist from docs/stages/08-security/README.md.

Do not start stage 09 until stage 08 Definition of Done is 100% complete.
```

## Stage README

`docs/stages/08-security/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| **07-observability** | Alerts/runbooks for security-relevant failures |
| **05-integrations** | Tool allowlists, sandbox boundaries |
| **04-apis** | Protected endpoint matrix, error envelope |
| **02-infrastructure** | Secret scanning, no hardcoded credentials |

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/contracts/src/tool.ts` | Tool allowlist and execution contract |
| `packages/contracts/src/agent.ts` | Agent roles and execution boundaries |
| `packages/contracts/openapi/**` | Secured endpoint definitions |
| `apps/gateway/**` | Auth middleware (transport owner) |
| `apps/web/**` | Client auth token handling |
| `DOCUMENTATION.md` §6 | Vulnerability policy (0 critical, 0 high) |

## Expected quality gates

**Global:** lint, format, typecheck, stage tests, contracts, smoke.

**Stage-specific:**

- `AC-08-001`: no unauthenticated access to protected resources
- `AC-08-002`: all security scans pass threshold policies
- `AC-08-003`: tool execution permissions enforced per agent role
- `NFR-08-001`: 0 critical vulnerabilities
- `NFR-08-002`: 0 high vulnerabilities on release branch
- `NFR-08-003`: 100% security hotspot review rate
- Semgrep/Sonar security rules, container scan, DAST smoke in CI

## Handoff output path

`docs/handoffs/TASK-08-security.md`
