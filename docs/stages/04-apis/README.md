# Stage 04 - APIs

## Objective
Deliver stable, versioned APIs with strict request/response validation and contract tests.

## Scope
- In scope: REST endpoints, OpenAPI generation, validation middleware, error mapping.
- Out of scope: external provider-specific adaptation logic.

## Functional Requirements
- `FR-04-001`: Publish OpenAPI spec under `packages/contracts/openapi`.
- `FR-04-002`: Implement endpoint handlers mapped to domain use-cases.
- `FR-04-003`: Standardize error response envelope.

## Non-Functional Requirements
- `NFR-04-001`: P95 non-LLM endpoint latency < 400ms.
- `NFR-04-002`: Backward compatibility for minor versions.
- `NFR-04-003`: 100% contract test coverage for public endpoints.

## Expected Inputs and Outputs
- Inputs: domain APIs and repository adapters.
- Outputs: versioned external API surface.

## Dependencies
- Depends on: stage 03.
- Unblocks: stages 05, 06, 07, 08.

## Integration Contracts Between Modules
- OpenAPI contract is source of truth for gateway and frontend clients.
- Domain error codes mapped deterministically to HTTP codes.

## Implementation Strategy
1. Define endpoint catalog and OpenAPI schemas.
2. Implement request validation and response serialization.
3. Add compatibility test for schema changes.
4. Wire docs endpoint and API versioning strategy.

## Testing Strategy
- Unit: controller and mapper logic.
- Integration: HTTP + DB + queue path tests.
- E2E: critical user journey.
- Contract: OpenAPI conformance tests.
- Regression: backward compatibility snapshots.

## Automated Validation Strategy
- OpenAPI linting in CI.
- Contract diff checker blocks breaking changes without major bump.
- Sonar + lint + type gates mandatory.

## Acceptance Criteria
- `AC-04-001`: OpenAPI docs generated and published in CI artifacts.
- `AC-04-002`: all endpoint contract tests pass.
- `AC-04-003`: breaking schema change fails pipeline unless version bumped.

## Definition of Done
- Public and internal API contracts versioned.
- Deprecation policy documented for changed endpoints.

## Risks and Attention Points
- `RISK-04-001`: undocumented behavior drift. Mitigation: strict schema-first.
- `RISK-04-002`: silent breaking change. Mitigation: contract diff gate.

## Expected Folder Structure
```text
docs/stages/04-apis/
└── README.md
```

## Final Validation Checklist
- [ ] OpenAPI valid and complete.
- [ ] Endpoint contracts tested.
- [ ] Error envelope standardized.
- [ ] Compatibility gate configured.
