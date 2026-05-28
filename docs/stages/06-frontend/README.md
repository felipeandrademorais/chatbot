# Stage 06 - Frontend

## Objective

Build a deterministic, contract-driven frontend that consumes APIs and workflow states with robust error handling.

## Scope

- In scope: web app shell, task/workflow views, API client integration, UX states.
- Out of scope: deep branding/polish beyond functional baseline.

## Functional Requirements

- `FR-06-001`: implement typed API client from OpenAPI.
- `FR-06-002`: render workflow status timeline and results.
- `FR-06-003`: support recoverable error states and retry actions.

## Non-Functional Requirements

- `NFR-06-001`: Core Web Vitals target: LCP < 2.5s for primary screen.
- `NFR-06-002`: Accessibility baseline WCAG 2.2 AA for key flows.
- `NFR-06-003`: Type-safe data access, no untyped API payload usage.

## Expected Inputs and Outputs

- Inputs: stage 04 API contracts and stage 05 integration behavior.
- Outputs: usable UI for end-to-end workflow management.

## Dependencies

- Depends on: stages 04 and 05.
- Unblocks: stages 07, 08, 10.

## Integration Contracts Between Modules

- Frontend consumes generated typed client from OpenAPI.
- UI state machine aligns with orchestrator workflow status contract.

## Implementation Strategy

1. Generate API client and define boundary adapters.
2. Implement primary user journeys first (submit, monitor, inspect result).
3. Add explicit loading/empty/error/success states.
4. Add telemetry hooks for UX observability.

## Testing Strategy

- Unit: UI components and hooks.
- Integration: page-level API interaction with mock server.
- E2E: critical journey and error-retry flow.
- Contract: generated client compile + runtime contract tests.
- Regression: visual snapshots for core screens.

## Automated Validation Strategy

- ESLint + TypeScript strict checks.
- Accessibility automated checks (axe) in CI.
- Bundle size and performance budget checks.

## Acceptance Criteria

- `AC-06-001`: critical user journey passes E2E.
- `AC-06-002`: no runtime type errors for API payload handling.
- `AC-06-003`: accessibility checks pass for primary screens.

## Definition of Done

- UI uses only contract-generated clients.
- Error and retry behavior documented and tested.

## Risks and Attention Points

- `RISK-06-001`: UI-contract drift. Mitigation: client generation in CI.
- `RISK-06-002`: hidden accessibility regressions. Mitigation: automated a11y checks + manual spot review.

## Expected Folder Structure

```text
docs/stages/06-frontend/
└── README.md
```

## Final Validation Checklist

- [ ] Typed API client integrated.
- [ ] Core E2E scenarios pass.
- [ ] Accessibility baseline achieved.
- [ ] Performance budgets green.
