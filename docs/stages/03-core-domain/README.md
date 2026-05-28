# Stage 03 - Core Domain

## Objective
Implement domain entities, value objects, use-cases, and repository interfaces with deterministic invariants.

## Scope
- In scope: domain model, application services, repository contracts, domain errors.
- Out of scope: transport adapters, UI concerns.

## Functional Requirements
- `FR-03-001`: Define aggregate roots and invariants.
- `FR-03-002`: Implement use-cases with input/output DTO contracts.
- `FR-03-003`: Provide repository interfaces and in-memory test adapters.

## Non-Functional Requirements
- `NFR-03-001`: Domain package framework-independent.
- `NFR-03-002`: 90% line coverage in `packages/domain`.
- `NFR-03-003`: Mutation score >= 75% for critical use-cases.

## Expected Inputs and Outputs
- Inputs: stage 01/02 standards and persistence capabilities.
- Outputs: stable domain API consumed by API/orchestrator layers.

## Dependencies
- Depends on: stages 01, 02.
- Unblocks: stages 04, 05, 06.

## Integration Contracts Between Modules
- Domain service interfaces exported via `packages/domain`.
- Error taxonomy contract (`DomainErrorCode`) consumed by APIs.

## Implementation Strategy
1. Define domain ubiquitous language glossary.
2. Model entities/value objects and invariants.
3. Implement use-cases with pure functions/classes.
4. Add repository interfaces and fake adapters for tests.

## Testing Strategy
- Unit: domain entities and use-cases.
- Integration: repository contract tests against in-memory and db adapters.
- E2E: N/A.
- Contract: DTO schema compatibility tests.
- Regression: golden tests for key business rules.

## Automated Validation Strategy
- Architecture rule prevents infra imports in domain package.
- Coverage and mutation gates enforced in CI.
- Static checks for forbidden dependencies.

## Acceptance Criteria
- `AC-03-001`: all invariants covered by tests.
- `AC-03-002`: repository contract tests pass for both adapters.
- `AC-03-003`: domain package has zero framework coupling.

## Definition of Done
- Domain API version tagged and documented.
- All domain contracts consumed without type assertions (`as any` forbidden).

## Risks and Attention Points
- `RISK-03-001`: anemic domain model. Mitigation: enforce behavior-rich entities.
- `RISK-03-002`: hidden coupling. Mitigation: architecture lint + dependency graph checks.

## Expected Folder Structure
```text
docs/stages/03-core-domain/
└── README.md
```

## Final Validation Checklist
- [ ] Domain invariants validated.
- [ ] Mutation threshold met.
- [ ] Contract exports documented.
- [ ] No cross-layer violations.
