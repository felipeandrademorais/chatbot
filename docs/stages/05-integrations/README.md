# Stage 05 - Integrations

## Objective
Implement provider adapters (LLM, search/tools, storage integrations) behind stable anti-corruption layers.

## Scope
- In scope: provider clients, retry/circuit breaker, normalization, fallback routing.
- Out of scope: frontend UX orchestration.

## Functional Requirements
- `FR-05-001`: implement pluggable LLM provider interface.
- `FR-05-002`: add tool adapter layer with allowlisted capabilities.
- `FR-05-003`: persist provider usage telemetry (tokens/cost/errors).

## Non-Functional Requirements
- `NFR-05-001`: provider timeout enforced (max 30s default).
- `NFR-05-002`: retries max 2 with exponential backoff.
- `NFR-05-003`: circuit breaker for repeated provider failures.

## Expected Inputs and Outputs
- Inputs: API/domain contracts, infrastructure services.
- Outputs: resilient integration layer consumed by orchestrator/worker.

## Dependencies
- Depends on: stages 02, 03, 04.
- Unblocks: stages 06, 07, 09.

## Integration Contracts Between Modules
- `ProviderRequest` and `ProviderResponse` schemas in `packages/contracts`.
- Tool invocation contract requires validated structured input.

## Implementation Strategy
1. Define integration interfaces and schema contracts.
2. Build provider-specific adapters with normalization.
3. Add fallback policy and deterministic error mapping.
4. Record usage/cost metrics for observability.

## Testing Strategy
- Unit: adapter mapping and retry logic.
- Integration: real/sandbox provider contract tests.
- E2E: end-to-end workflow with fallback simulation.
- Contract: schema validation of normalized payloads.
- Regression: provider response fixture tests.

## Automated Validation Strategy
- Secret scanning and credential policy checks.
- Integration smoke in CI with mock providers.
- Failure-injection tests in nightly pipeline.

## Acceptance Criteria
- `AC-05-001`: adapter contract tests pass for each provider.
- `AC-05-002`: fallback path proven via failure simulation.
- `AC-05-003`: token/cost telemetry persisted for each request.

## Definition of Done
- Provider adapters replaceable without API/domain code change.
- Integration docs include rate-limit and failure behavior.

## Risks and Attention Points
- `RISK-05-001`: provider lock-in. Mitigation: strict adapter interfaces.
- `RISK-05-002`: unstable external APIs. Mitigation: resilient normalization + contract tests.

## Expected Folder Structure
```text
docs/stages/05-integrations/
└── README.md
```

## Final Validation Checklist
- [ ] Adapter interfaces stable.
- [ ] Fallback and retry behavior tested.
- [ ] Telemetry emitted and stored.
- [ ] Security scans pass.
