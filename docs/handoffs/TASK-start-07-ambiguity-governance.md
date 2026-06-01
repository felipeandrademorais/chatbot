# Agent Handoff Record

## Header

- Stage: `start` (bootstrap)
- Task ID: `TASK-start-07`
- From Agent: `executor`
- To Agent: `coordinator` / `verifier`
- Commit SHA: _(uncommitted — user requested no commit)_
- Timestamp: `2026-06-01`

## Objective

Implement **start.md §7 — Ambiguity Governance**: documented workflow, example record, and script to create new records from the template.

## Scope

- Files allowed to modify: `docs/ambiguity/**`, `scripts/new-ambiguity-record.sh`, this handoff file
- Files forbidden to modify: application code, contracts, CI, templates (template is referenced, not edited)

## Contracts

- Contract references: none (documentation and tooling only)
- Compatibility constraints: aligns with `docs/templates/ambiguity-record-template.md`, `AGENTS.md`, `DOCUMENTATION.md`

## Work Completed

- Added `docs/ambiguity/README.md` — process, BLOCKED-while-open, exactly 2 options, security-first fallback, handoff linkage
- Added `docs/ambiguity/.gitkeep` and `docs/ambiguity/records/.gitkeep`
- Added `docs/ambiguity/examples/EXAMPLE-001-resolved.md` (fictional gateway rate-limit resolution)
- Added `scripts/new-ambiguity-record.sh` — interactive copy to `docs/ambiguity/records/AMBIG-<date>-<slug>.md`

## Evidence

- Commands executed:
  - `chmod +x scripts/new-ambiguity-record.sh`
- Test outputs: N/A (docs + shell script only)
- CI checks: not run (docs-only deliverable)

## Open Issues

- Blocking issues: none
- Risks: template status enum uses `open`; handoffs should state scope is **BLOCKED** while `open` — documented in README

## Next Steps

1. Run `./scripts/new-ambiguity-record.sh` once to validate prompts and file creation in your environment.
2. Commit `docs/ambiguity/**` and `scripts/new-ambiguity-record.sh` when ready (user deferred commit).
3. Optional: link `docs/ambiguity/README.md` from `DOCUMENTATION.md` repo map if discoverability is needed.

---

## How to use the workflow

1. Hit ambiguous requirements during stage work → run `./scripts/new-ambiguity-record.sh` from repo root.
2. Edit the new file under `docs/ambiguity/records/` — quote the requirement, explain gaps, list **exactly two** options with trade-offs.
3. Leave status `open` and **do not implement** the affected scope until resolved.
4. Human picks an option **or** apply security-first fallback, set `resolved`, document rationale and impacts.
5. Reference the ambiguity ID in the task handoff; ensure stage DoD has no `open` records.

## Files created

| Path | Purpose |
| ---- | ------- |
| `docs/ambiguity/README.md` | Governance process and quick start |
| `docs/ambiguity/.gitkeep` | Preserve directory in git |
| `docs/ambiguity/records/.gitkeep` | Target directory for live records |
| `docs/ambiguity/examples/EXAMPLE-001-resolved.md` | Resolved example for agents |
| `scripts/new-ambiguity-record.sh` | Scaffold new records from template |
| `docs/handoffs/TASK-start-07-ambiguity-governance.md` | This handoff |
