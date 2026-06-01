# Stage DoD Aggregator

**Project status: NOT COMPLETE**

Update `Status` and `Evidence` only when verifiable proof exists (CI run URL, command output, signed handoff). Default for all rows: **NOT COMPLETE**.

Master checklist: [project-success-criteria.md](../project-success-criteria.md).

---

## Summary

| Stage | Name | DoD status | Last verified |
| ----- | ---- | ----------- | ------------- |
| 01 | Foundation | NOT COMPLETE | — |
| 02 | Infrastructure | NOT COMPLETE | — |
| 03 | Core Domain | NOT COMPLETE | — |
| 04 | APIs | NOT COMPLETE | — |
| 05 | Integrations | NOT COMPLETE | — |
| 06 | Frontend | NOT COMPLETE | — |
| 07 | Observability | NOT COMPLETE | — |
| 08 | Security | NOT COMPLETE | — |
| 09 | Scalability | NOT COMPLETE | — |
| 10 | Final Hardening | NOT COMPLETE | — |

---

## Stage 01 — Foundation

Spec: [docs/stages/01-foundation/README.md](../stages/01-foundation/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-01-001 | AC | `docker compose up` starts core dependencies | NOT COMPLETE | `pnpm compose:dev` or `docker compose --profile dev up -d` |
| AC-01-002 | AC | CI validate stage passes on clean clone | NOT COMPLETE | `pnpm format:check && pnpm lint && pnpm typecheck`; CI validate job |
| AC-01-003 | AC | All required template files exist | NOT COMPLETE | `pnpm readiness:check` |
| DoD-01-1 | DoD | All acceptance criteria pass | NOT COMPLETE | All AC rows COMPLETE |
| DoD-01-2 | DoD | Foundation docs reviewed and versioned (`v1.0.0`) | NOT COMPLETE | Version tag in stage README / release notes |
| DoD-01-3 | DoD | No unresolved critical ambiguity | NOT COMPLETE | No open critical [ambiguity records](../templates/ambiguity-record-template.md) |
| FVC-01-1 | Checklist | Local bootstrap successful | NOT COMPLETE | `pnpm install && pnpm compose:dev` |
| FVC-01-2 | Checklist | CI baseline green | NOT COMPLETE | `gh run list --workflow=ci.yml --limit=1` |
| FVC-01-3 | Checklist | Standards files committed | NOT COMPLETE | `AGENTS.md`, `DOCUMENTATION.md`, eslint/prettier/tsconfig |
| FVC-01-4 | Checklist | Contracts directory initialized | NOT COMPLETE | `packages/contracts/` with tests |

---

## Stage 02 — Infrastructure

Spec: [docs/stages/02-infrastructure/README.md](../stages/02-infrastructure/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-02-001 | AC | All core containers start healthy | NOT COMPLETE | `pnpm compose:test` |
| AC-02-002 | AC | Migrations execute automatically in CI | NOT COMPLETE | `pnpm test:integration` (compose-migrations) |
| AC-02-003 | AC | Failed container startup fails pipeline | NOT COMPLETE | CI integration job non-zero on failure |
| DoD-02-1 | DoD | Infrastructure reproducible local/CI | NOT COMPLETE | Same compose profiles local + CI |
| DoD-02-2 | DoD | Runbook for bootstrap and troubleshooting | NOT COMPLETE | [runbook.md](../stages/02-infrastructure/runbook.md) reviewed |
| FVC-02-1 | Checklist | Compose profiles validated | NOT COMPLETE | dev + test profiles |
| FVC-02-2 | Checklist | Migration forward path verified | NOT COMPLETE | `pnpm migrate` |
| FVC-02-3 | Checklist | Readiness probes working | NOT COMPLETE | `pnpm test:integration` (compose-health) |
| FVC-02-4 | Checklist | Infra CI jobs green | NOT COMPLETE | CI integration + contract jobs |

---

## Stage 03 — Core Domain

Spec: [docs/stages/03-core-domain/README.md](../stages/03-core-domain/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-03-001 | AC | All invariants covered by tests | NOT COMPLETE | `pnpm --filter @chatbot/domain test:unit` |
| AC-03-002 | AC | Repository contract tests pass (both adapters) | NOT COMPLETE | Domain integration/contract tests |
| AC-03-003 | AC | Domain package zero framework coupling | NOT COMPLETE | Architecture lint / dependency graph |
| DoD-03-1 | DoD | Domain API version tagged and documented | NOT COMPLETE | Contract version in `packages/contracts` |
| DoD-03-2 | DoD | Domain contracts consumed without `as any` | NOT COMPLETE | `pnpm typecheck`; lint ban on `any` in domain |
| FVC-03-1 | Checklist | Domain invariants validated | NOT COMPLETE | Unit + invariant tests green |
| FVC-03-2 | Checklist | Mutation threshold met | NOT COMPLETE | Nightly mutation job (when enabled) |
| FVC-03-3 | Checklist | Contract exports documented | NOT COMPLETE | `packages/contracts` README or exports |
| FVC-03-4 | Checklist | No cross-layer violations | NOT COMPLETE | Architecture gate in CI |

---

## Stage 04 — APIs

Spec: [docs/stages/04-apis/README.md](../stages/04-apis/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-04-001 | AC | OpenAPI docs generated and published in CI | NOT COMPLETE | CI artifact / OpenAPI lint job |
| AC-04-002 | AC | All endpoint contract tests pass | NOT COMPLETE | `pnpm test:contract` |
| AC-04-003 | AC | Breaking schema change fails without major bump | NOT COMPLETE | Contract diff gate in CI |
| DoD-04-1 | DoD | Public and internal API contracts versioned | NOT COMPLETE | Version tags on OpenAPI/schemas |
| DoD-04-2 | DoD | Deprecation policy documented | NOT COMPLETE | Stage 04 docs / API changelog |
| FVC-04-1 | Checklist | OpenAPI valid and complete | NOT COMPLETE | OpenAPI linter |
| FVC-04-2 | Checklist | Endpoint contracts tested | NOT COMPLETE | `pnpm test:contract` |
| FVC-04-3 | Checklist | Error envelope standardized | NOT COMPLETE | Contract tests + gateway handlers |
| FVC-04-4 | Checklist | Compatibility gate configured | NOT COMPLETE | CI contract job |

---

## Stage 05 — Integrations

Spec: [docs/stages/05-integrations/README.md](../stages/05-integrations/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-05-001 | AC | Local Ollama adapter contract tests pass | NOT COMPLETE | `packages/tools` / integration tests |
| AC-05-002 | AC | Fallback path proven via failure simulation | NOT COMPLETE | Failure-injection / nightly tests |
| AC-05-003 | AC | Token/cost telemetry persisted per request | NOT COMPLETE | Integration test + DB assertions |
| DoD-05-1 | DoD | Provider adapters replaceable without API/domain change | NOT COMPLETE | Adapter interface tests |
| DoD-05-2 | DoD | Integration docs: rate-limit and failure behavior | NOT COMPLETE | Stage 05 / tools docs |
| FVC-05-1 | Checklist | Adapter interfaces stable | NOT COMPLETE | Contract tests |
| FVC-05-2 | Checklist | Fallback and retry behavior tested | NOT COMPLETE | Integration + nightly |
| FVC-05-3 | Checklist | Telemetry emitted and stored | NOT COMPLETE | Observability assertions |
| FVC-05-4 | Checklist | Security scans pass | NOT COMPLETE | CI security job |

---

## Stage 06 — Frontend

Spec: [docs/stages/06-frontend/README.md](../stages/06-frontend/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-06-001 | AC | Critical user journey passes E2E | NOT COMPLETE | `pnpm test:e2e` |
| AC-06-002 | AC | No runtime type errors for API payloads | NOT COMPLETE | Generated client + `pnpm typecheck` |
| AC-06-003 | AC | Accessibility checks pass (primary screens) | NOT COMPLETE | axe in CI |
| DoD-06-1 | DoD | UI uses only contract-generated clients | NOT COMPLETE | CI client generation step |
| DoD-06-2 | DoD | Error and retry behavior documented and tested | NOT COMPLETE | E2E + docs |
| FVC-06-1 | Checklist | Typed API client integrated | NOT COMPLETE | `apps/web` imports generated client |
| FVC-06-2 | Checklist | Core E2E scenarios pass | NOT COMPLETE | `pnpm test:e2e` |
| FVC-06-3 | Checklist | Accessibility baseline achieved | NOT COMPLETE | a11y CI job |
| FVC-06-4 | Checklist | Performance budgets green | NOT COMPLETE | Bundle size CI check |

---

## Stage 07 — Observability

Spec: [docs/stages/07-observability/README.md](../stages/07-observability/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-07-001 | AC | Dashboard covers API, queue, agent, Ollama health | NOT COMPLETE | Dashboard URL / export |
| AC-07-002 | AC | Trace spans visible for critical path | NOT COMPLETE | Trace backend smoke test |
| AC-07-003 | AC | P1/P2 alert policies tested end-to-end | NOT COMPLETE | Staging synthetic alert drill |
| DoD-07-1 | DoD | Operational runbook published | NOT COMPLETE | Ops doc in `docs/` |
| DoD-07-2 | DoD | On-call can diagnose top 5 failures via dashboards | NOT COMPLETE | Runbook drill sign-off |
| FVC-07-1 | Checklist | Logs/metrics/traces standardized | NOT COMPLETE | Integration telemetry field checks |
| FVC-07-2 | Checklist | Dashboards published | NOT COMPLETE | Grafana/etc. |
| FVC-07-3 | Checklist | Alerts validated in staging | NOT COMPLETE | Alert test records |
| FVC-07-4 | Checklist | Runbook available | NOT COMPLETE | Linked runbook |

---

## Stage 08 — Security

Spec: [docs/stages/08-security/README.md](../stages/08-security/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-08-001 | AC | No unauthenticated access to protected resources | NOT COMPLETE | Auth integration tests |
| AC-08-002 | AC | All security scans pass threshold policies | NOT COMPLETE | CI security job artifacts |
| AC-08-003 | AC | Tool execution permissions enforced per role | NOT COMPLETE | Allowlist tests |
| DoD-08-1 | DoD | Security baseline and exception process published | NOT COMPLETE | Security baseline doc |
| DoD-08-2 | DoD | IR and credential rotation procedures tested | NOT COMPLETE | Drill records |
| FVC-08-1 | Checklist | AuthN/AuthZ enforced | NOT COMPLETE | E2E + API tests |
| FVC-08-2 | Checklist | CI security gates mandatory and passing | NOT COMPLETE | `ci.yml` security job green |
| FVC-08-3 | Checklist | Tool allowlists active | NOT COMPLETE | `packages/tools` policy |
| FVC-08-4 | Checklist | Security runbooks reviewed | NOT COMPLETE | Sign-off |

---

## Stage 09 — Scalability

Spec: [docs/stages/09-scalability/README.md](../stages/09-scalability/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-09-001 | AC | Load tests meet SLA thresholds | NOT COMPLETE | Nightly/load test report |
| AC-09-002 | AC | Stable during controlled dependency failure | NOT COMPLETE | Chaos / failure injection |
| AC-09-003 | AC | Optimization changes documented and reproducible | NOT COMPLETE | Benchmark docs |
| DoD-09-1 | DoD | Performance budget published per service | NOT COMPLETE | `docs/` performance budget |
| DoD-09-2 | DoD | Capacity planning guide with scaling triggers | NOT COMPLETE | Capacity doc |
| FVC-09-1 | Checklist | Load profiles executed and archived | NOT COMPLETE | Artifact storage |
| FVC-09-2 | Checklist | SLA targets met | NOT COMPLETE | Load test results |
| FVC-09-3 | Checklist | Bottlenecks and mitigations documented | NOT COMPLETE | Post-mortem / perf doc |
| FVC-09-4 | Checklist | Scaling runbook approved | NOT COMPLETE | Sign-off |

---

## Stage 10 — Final Hardening

Spec: [docs/stages/10-final-hardening/README.md](../stages/10-final-hardening/README.md)

| ID | Type | Criterion | Status | Evidence / verification |
| -- | ---- | --------- | ------ | ------------------------ |
| AC-10-001 | AC | All quality gates green on release branch | NOT COMPLETE | `bash scripts/check-project-readiness.sh --full`; CI all jobs |
| AC-10-002 | AC | Rollback rehearsal within RTO target | NOT COMPLETE | Release workflow `rollback_to_sha` drill |
| AC-10-003 | AC | No critical/high vulns; no critical code smells | NOT COMPLETE | Security + Sonar reports |
| DoD-10-1 | DoD | Release notes, runbooks, ops checklist finalized | NOT COMPLETE | Release artifact bundle |
| DoD-10-2 | DoD | Go/no-go approval by engineering owners | NOT COMPLETE | Sign-off table in project-success-criteria |
| FVC-10-1 | Checklist | Regression and smoke tests pass | NOT COMPLETE | `pnpm test:smoke`; regression suite |
| FVC-10-2 | Checklist | Rollback and DR drills successful | NOT COMPLETE | Drill logs |
| FVC-10-3 | Checklist | Security and compliance gates pass | NOT COMPLETE | CI security + compliance artifacts |
| FVC-10-4 | Checklist | Release approval recorded | NOT COMPLETE | Sign-off |

---

## How to mark COMPLETE

1. Run the verification command for the row.
2. Attach evidence (CI URL, log excerpt path, handoff ID).
3. Set `Status` to `COMPLETE` and `Last verified` date in the summary table.
4. When all rows for stages 01–10 are `COMPLETE`, re-evaluate [project-success-criteria.md](../project-success-criteria.md) global gates (CI, security, rollback, docs).
