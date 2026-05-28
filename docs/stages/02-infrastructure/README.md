# Stage 02 - Infrastructure

## Objective
Implement production-like containerized runtime, environment configuration, migrations, and service bootstrap.

## Scope
- In scope: Dockerfiles, compose profiles, DB migrations, runtime config module, health endpoints.
- Out of scope: domain-specific workflows.

## Functional Requirements
- `FR-02-001`: Build runnable containers for `gateway`, `orchestrator`, `worker`, `web`.
- `FR-02-002`: Add migration pipeline for PostgreSQL.
- `FR-02-003`: Add startup/readiness probes.

## Non-Functional Requirements
- `NFR-02-001`: Cold start stack < 120s on standard developer machine.
- `NFR-02-002`: No hardcoded environment secrets.
- `NFR-02-003`: Support `dev` and `test` compose profiles.

## Expected Inputs and Outputs
- Inputs: foundation skeleton, infra contract definitions.
- Outputs: reproducible local/staging stack.

## Dependencies
- Depends on: Stage 01.
- Unblocks: Stages 03, 04, 05.

## Integration Contracts Between Modules
- Health contract: `/health/live`, `/health/ready`.
- Config contract: validated env schema exported from shared package.

## Implementation Strategy
1. Create per-app Dockerfiles and root compose.
2. Implement env schema validation at startup.
3. Add migrations and rollback-safe migration policy.
4. Add readiness checks and startup dependencies.

## Testing Strategy
- Unit: config parser validation.
- Integration: compose startup + migration execution.
- E2E: smoke path `gateway -> orchestrator` stub.
- Contract: env schema tests.
- Regression: infra startup benchmark baseline.

## Automated Validation Strategy
- CI job runs compose in test profile.
- Static checks ensure no secrets in tracked files.
- Architecture gate verifies services expose health endpoints.

## Acceptance Criteria
- `AC-02-001`: all core containers start healthy.
- `AC-02-002`: migrations execute automatically in CI.
- `AC-02-003`: failed container startup returns non-zero pipeline status.

## Definition of Done
- Infrastructure reproducible across local/CI.
- Docs include runbook for bootstrap and troubleshooting.

## Risks and Attention Points
- `RISK-02-001`: flaky startup ordering. Mitigation: robust wait-for-health strategy.
- `RISK-02-002`: migration drift. Mitigation: migration checksum validation.

## Expected Folder Structure
```text
docs/stages/02-infrastructure/
└── README.md
```

## Final Validation Checklist
- [ ] Compose profiles validated.
- [ ] Migration forward path verified.
- [ ] Readiness probes working.
- [ ] Infra CI jobs green.
