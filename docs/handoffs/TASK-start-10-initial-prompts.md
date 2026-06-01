# Agent Handoff Record — TASK-start-10-initial-prompts

## Header

- Stage: start.md §10 (cross-cutting docs)
- Task ID: TASK-start-10-initial-prompts
- From Agent: Executor
- To Agent: Coordinator / human operator
- Commit SHA: (uncommitted — docs only)
- Timestamp: 2026-06-01

## Objective

Create ready-to-paste Cursor prompts under `docs/prompts/` for stage 01 multi-agent execution, referencing mandatory reading order from `start.md` §2.

## Scope

- Files created:
  - `docs/prompts/coordinator-stage-01.md`
  - `docs/prompts/implementer-task-template.md`
  - `docs/prompts/verifier-stage-checklist.md`
- No application code changed.

## Work Completed

- Expanded `start.md` §10 coordinator prompt with repo paths, FR/NFR/AC/RISK IDs from `docs/stages/01-foundation/README.md`, and quality-gate references.
- Added parameterized implementer template for `TASK-01-NNN` (and later stages via placeholders).
- Added verifier prompt aligned with stage 01 DoD and final validation checklist.
- All prompts include mandatory reading order from `start.md` §2.

## Evidence

- Files present under `docs/prompts/`
- Source alignment: `start.md` §10–11, `DOCUMENTATION.md` §2–4, `docs/stages/01-foundation/README.md`

## Prompt files — when to use

| File | Role | When to use |
| ---- | ---- | ----------- |
| `docs/prompts/coordinator-stage-01.md` | Coordinator | Starting or re-planning stage 01: backlog creation, parallel/sequential classification, orchestrating full foundation delivery, formal stage handoff. |
| `docs/prompts/implementer-task-template.md` | Implementer | Each atomic `TASK-01-NNN` (or later stage via placeholders): scoped implementation with allowed/forbidden paths and requirement traceability. |
| `docs/prompts/verifier-stage-checklist.md` | Verifier | Before closing stage 01 or advancing to stage 02: validate AC-01-001–003, quality gates, and DoD with evidence-only report. |

## Related prompts (not created here)

- Stage continuation: `start.md` §11 — use when moving to stage `NN` after prior stage DoD is complete.

## Open Issues

- None. Stage 01 implementation status not evaluated (docs-only task).

## Next Steps

1. Paste `coordinator-stage-01.md` into Cursor to bootstrap or audit stage 01 planning.
2. For each backlog item, fill `implementer-task-template.md` placeholders and assign to an implementer session.
3. Run `verifier-stage-checklist.md` before marking stage 01 complete or using `start.md` §11 for stage 02.
