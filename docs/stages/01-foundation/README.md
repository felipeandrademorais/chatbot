# Stage 01 - Foundation

**Version:** `v1.0.0`

## Objective

Establish the spec-driven baseline, repository standards, contracts skeleton, and Docker-first local runtime so all later stages execute deterministically.

## Scope

- In scope: repository structure, lint/type/test standards, baseline contracts, compose skeleton, contribution workflow.
- Out of scope: feature-complete business logic, external provider integrations.

## Functional Requirements

- `FR-01-001`: Create monorepo layout (`apps`, `packages`, `tests`, `docs`).
- `FR-01-002`: Define global `AGENTS.md` with rules for context, ownership, and handoffs.
- `FR-01-003`: Provide base `docker-compose.yml` with `postgres`, `redis`, and placeholder services.

## Non-Functional Requirements

- `NFR-01-001`: Full local bootstrap in <= 10 minutes on clean machine.
- `NFR-01-002`: Deterministic builds using pinned Node version and lockfile.
- `NFR-01-003`: Strict typing enabled globally.

## Expected Inputs and Outputs

- Inputs: architecture blueprint, quality policy, module map.
- Outputs: initialized repository + standards + baseline CI.

## Dependencies

- Depends on: none.
- Unblocks: all stages.

## Integration Contracts Between Modules

- Contract docs created in `packages/contracts`.
- Each future module must reference a versioned contract before implementation.

## Implementation Strategy

1. Initialize workspace tooling and package manager.
2. Add lint/prettier/tsconfig standards.
3. Create compose file and service placeholders.
4. Add CI skeleton with validate + unit pipeline.

## Testing Strategy

- Unit: validate utility scaffolding.
- Integration: compose startup smoke.
- E2E: N/A.
- Contract: schema lint pass.
- Regression: baseline snapshot of tool versions.

## Automated Validation Strategy

- Lint + format + type checks on every PR.
- Architecture gate: folder layout validation script.
- CI gate: fail if required templates/contracts missing.

## Acceptance Criteria

- `AC-01-001`: `docker compose up` starts core dependencies.
- `AC-01-002`: CI validate stage passes on clean clone.
- `AC-01-003`: All required template files exist.

## Definition of Done

- All acceptance criteria pass.
- Foundation docs reviewed and versioned (`v1.0.0`).
- No unresolved critical ambiguity.

## Risks and Attention Points

- `RISK-01-001`: Over-scaffolding. Mitigation: keep business modules as placeholders only.
- `RISK-01-002`: Tooling mismatch. Mitigation: pin versions in lockfile and CI.

## Expected Folder Structure

```text
docs/stages/01-foundation/
└── README.md
```

## Final Validation Checklist

- [ ] Local bootstrap successful.
- [ ] CI baseline green.
- [ ] Standards files committed.
- [ ] Contracts directory initialized.
