# Implementer — Task Assignment Template (Stage 01+)

Parameterized Cursor prompt for a single `TASK-<stage>-NNN` assignment. Copy the block below and replace `{{PLACEHOLDER}}` values.

---

```text
Act as an Implementer agent. Execute only the assigned task scope; do not modify files outside scope.

## Mandatory reading order (before any code)

Read in this exact order (see start.md §2):

1. start.md
2. DOCUMENTATION.md
3. docs/stages/{{STAGE_DIR}}/README.md
4. docs/templates/module-contract-template.md
5. docs/templates/agent-handoff-template.md
6. docs/templates/ambiguity-record-template.md

If instructions conflict: DOCUMENTATION.md > stage README > templates.

Also read AGENTS.md (module ownership, quality gates, handoff protocol).

## Assignment

- Stage: {{STAGE_ID}} (e.g. 01-foundation)
- Task ID: {{TASK_ID}} (e.g. TASK-01-003)
- Branch: feature/{{STAGE_SLUG}}/{{TASK_ID}}-{{TASK_SLUG}}
- Primary owner module: {{OWNER_MODULE}} (see AGENTS.md module map)

## Objective

{{TASK_OBJECTIVE}}

## Scope

Files allowed to modify:
{{ALLOWED_PATHS}}

Files forbidden to modify:
{{FORBIDDEN_PATHS}}

## Requirements traceability

Maps to stage requirements (from docs/stages/{{STAGE_DIR}}/README.md):

- Functional: {{FR_IDS}} (e.g. FR-01-001)
- Non-functional: {{NFR_IDS}} (e.g. NFR-01-002)
- Acceptance criteria this task supports: {{AC_IDS}} (e.g. AC-01-001)

## Contracts

- Read relevant schemas under packages/contracts/ before implementation.
- Do not introduce breaking contract changes without version bump and deprecation note.
- Cross-module changes require contract alignment first.

## Implementation rules

- Strict TypeScript; no `any` in core contracts.
- Docker/docker-compose for runtime validation where applicable.
- Match existing patterns in the allowed paths only.
- Max complexity per AGENTS.md (complexity 10, cognitive 15 per function).

## Verification (provide evidence in handoff)

Run and report results for tasks touching code:

- pnpm lint (zero errors)
- pnpm format check
- pnpm typecheck
- Relevant unit/integration tests for changed packages
- Smoke test for changed functionality if applicable

For compose-related work: confirm `docker compose up` behavior supporting {{AC_IDS}}.

## Ambiguity

If a requirement is subjective or unmeasurable:

1. Create a record via docs/templates/ambiguity-record-template.md
2. Propose exactly 2 options with trade-offs
3. Apply security-first fallback if blocked; log decision in handoff

## Deliverable

Produce a handoff using docs/templates/agent-handoff-template.md:

- Stage: {{STAGE_ID}}
- Task ID: {{TASK_ID}}
- Changed files (complete list)
- Contract references touched
- Commands run + test output summary
- Open risks / blockers
- Recommended next step for Integrator or Verifier

Do not start the next stage or unrelated tasks. Stop when this task scope is complete and verified.
```

---

## Placeholder reference

| Placeholder | Example | Description |
| ----------- | ------- | ----------- |
| `{{STAGE_DIR}}` | `01-foundation` | Folder under `docs/stages/` |
| `{{STAGE_ID}}` | `01` | Numeric stage id |
| `{{STAGE_SLUG}}` | `01-foundation` | Branch segment |
| `{{TASK_ID}}` | `TASK-01-003` | Atomic task id |
| `{{TASK_SLUG}}` | `compose-skeleton` | Short branch suffix |
| `{{OWNER_MODULE}}` | `packages/contracts` | AGENTS.md owner |
| `{{TASK_OBJECTIVE}}` | (free text) | One concrete outcome |
| `{{ALLOWED_PATHS}}` | `packages/contracts/**` | Bulleted paths |
| `{{FORBIDDEN_PATHS}}` | `apps/**` | Bulleted paths |
| `{{FR_IDS}}` | `FR-01-001` | Comma-separated |
| `{{NFR_IDS}}` | `NFR-01-002` | Comma-separated |
| `{{AC_IDS}}` | `AC-01-003` | Comma-separated |
