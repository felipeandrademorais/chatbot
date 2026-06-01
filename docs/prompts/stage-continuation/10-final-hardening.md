# Stage 10 — Final Hardening — Continuation Prompt

**Milestone:** M10 Final Hardening — release readiness (`DOCUMENTATION.md` §3)

## Paste-ready prompt

```text
Continue execution from stage 10 (final-hardening).

Read in order: start.md, DOCUMENTATION.md (§12 Final Success Criteria), AGENTS.md, docs/stages/10-final-hardening/README.md, docs/templates/agent-handoff-template.md.

Re-validate stages 01–09: each stage DoD and Final Validation Checklist satisfied; no open critical ambiguities. Freeze contract versions for release candidate — post-freeze changes require explicit exception.

Scope: NO net-new features. Execute full regression matrix, chaos/failure drills on critical dependencies, rollback and recovery playbook rehearsal, release checklist with evidence attachments.

Run full quality profile: all mandatory gates green on release branch (AC-10-001), rollback rehearsal within RTO (AC-10-002), 0 critical/high vulnerabilities and 0 critical code smells (AC-10-003), CI full suite including nightly-grade checks, security and license reports attached, deploy blocked on any mandatory failure.

Deliver handoff + release notes + operations checklist + go/no-go record + project-level completion check against start.md §12.

Production go-live only after engineering sign-off.
```

## Stage README

`docs/stages/10-final-hardening/README.md`

## Dependency stages to re-validate

| Stage | Re-validate |
| ----- | ----------- |
| **01-foundation** | Standards, templates, CI baseline |
| **02-infrastructure** | Compose, migrations, health, runbooks |
| **03-core-domain** | Domain coverage, mutation, invariants |
| **04-apis** | OpenAPI, contract tests, compatibility gate |
| **05-integrations** | Ollama, fallback, telemetry |
| **06-frontend** | E2E, a11y, performance budgets |
| **07-observability** | Dashboards, traces, alerts, runbooks |
| **08-security** | AuthZ matrix, scans, tool allowlists |
| **09-scalability** | Load SLA, scaling runbook, baselines |

## Key contracts to read

| Path | Purpose |
| ---- | ------- |
| `packages/contracts/**` | Frozen versions for release candidate |
| `packages/contracts/openapi/**` | Full compatibility scan |
| All `packages/contracts/__tests__/**` | Contract regression suite |
| `tests/**` (unit, integration, contract, smoke) | Full validation matrix |
| `DOCUMENTATION.md` §6 | Full quality gate policy for release |
| `start.md` §12 | Project NOT COMPLETE until all items pass |

## Expected quality gates

**Global (release profile):** entire `DOCUMENTATION.md` §6 — ESLint 0 errors, Prettier, strict TS, coverage thresholds (85% overall, 90% domain), mutation targets, 100% contract tests, E2E smoke on release branch.

**Stage-specific:**

- `AC-10-001`: all quality gates green on release branch
- `AC-10-002`: rollback rehearsal successful within RTO target
- `AC-10-003`: no critical/high vulnerabilities; no critical code smells
- `NFR-10-001`: zero open critical defects
- `NFR-10-002`: release candidate passes all mandatory quality gates
- `NFR-10-003`: operational readiness documented and approved
- Contract freeze enforced; exception process for post-freeze changes

**Project completion (`start.md` §12):** stages 01–10 DoD complete; CI/CD green; quality gate approved; security no critical findings; rollback tested; documentation updated.

## Handoff output path

`docs/handoffs/TASK-10-final-hardening.md`
