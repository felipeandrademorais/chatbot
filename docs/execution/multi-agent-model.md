# Multi-Agent Execution Model

Operational guide for the four agent roles used in Cursor-driven delivery. This document **operationalizes** `start.md` §3 and aligns with `AGENTS.md`, `DOCUMENTATION.md` §4–§5, and stage READMEs.

**Authority on conflicts:** `DOCUMENTATION.md` → current stage README → templates → `AGENTS.md`.

---

## Roles

### Coordinator

**When to invoke:** Start of a stage, after a failed integration, or when the backlog is stale.

| Responsibility | Output |
| -------------- | ------ |
| Read `docs/stages/<stage>/README.md` and decompose into atomic tasks | Backlog with IDs `TASK-<stage>-NNN` |
| Assign module ownership per task (see [parallelism-matrix.md](./parallelism-matrix.md)) | Task → owner agent / module |
| Define dependencies and file-scope boundaries | Allowed/forbidden paths per task |
| Classify parallel vs sequential work | Parallelism plan before implementation |

**Must not:** Implement production code or merge PRs.

---

### Implementer

**When to invoke:** After Coordinator assigns a scoped task with explicit file boundaries.

| Responsibility | Constraint |
| -------------- | ---------- |
| Implement only the assigned task scope | No edits outside **Scope → Files allowed** in handoff |
| Read contracts before code (`packages/contracts`, stage README) | Contract-first |
| Produce test evidence for all changes | Commands + summary in handoff |

**Must not:** Change another owner’s module without explicit handoff; skip quality gates.

---

### Verifier

**When to invoke:** After Implementer claims task complete, before Integrator merges.

| Responsibility | Constraint |
| -------------- | ---------- |
| Validate against stage acceptance criteria | Map to `AC-<stage>-NNN` IDs |
| Run quality gates (lint, format, typecheck, tests, contracts, smoke) | Report pass/fail with evidence |
| Report failures with reproduction steps | **May not fix code** — only report |

On persistent failure: hand off to Coordinator with failure report; retry transient failures max 2× with backoff (`AGENTS.md` Failure Handling).

---

### Integrator

**When to invoke:** When multiple Implementer tasks are verifier-clean, or contract drift appears across modules.

| Responsibility | Output |
| -------------- | ------ |
| Merge compliant task outputs / PRs | Single coherent branch or stage slice |
| Resolve contract incompatibilities | Version bumps (`vN`) + deprecation notes when breaking |
| Ensure cross-module consistency | Contract tests green across consumers |
| Produce stage handoff | `docs/templates/agent-handoff-template.md` format |

**Must not:** Expand scope beyond current stage Definition of Done.

---

## Typical flow (per stage)

```text
Coordinator → backlog + parallelism plan
     ↓
Implementer(s) → scoped changes + local validation
     ↓
Verifier → quality gates + AC checklist
     ↓
Integrator → merge + contract reconciliation + stage handoff
```

Stages do not advance until current stage **Definition of Done** is satisfied (`start.md` §4).

---

## Parallelism rules

Run tasks **in parallel** only when **all** of the following hold:

1. **No same-file conflicts** — tasks do not modify the same file paths (including generated artifacts if both tasks regenerate them).
2. **No shared-contract breakage** — tasks do not change the same published contract surface without a single Integrator-owned sequencing step.
3. **One primary owner per module per sprint** — at most one active Implementer owns a module (`AGENTS.md` Module Ownership Map).
4. **Dependencies satisfied** — upstream tasks (contracts, domain types, OpenAPI) are merged or frozen before downstream consumers implement.

Run tasks **sequentially** when **any** of the following apply:

| Trigger | Example |
| ------- | ------- |
| Same module or contract | Two tasks both edit `packages/contracts` health schema |
| Cross-module without contract PR | Worker needs new event shape before Architecture publishes schema |
| Integrator merge in progress | Second task must not touch files Integrator is reconciling |
| Breaking change | Requires version bump + consumer updates in order: contract → producers → consumers |
| Ambiguity unresolved | Status `BLOCKED` on ambiguity record until resolved or security-first fallback logged |

**Contract-first rule:** Cross-module changes require a **contract PR first** (`DOCUMENTATION.md` §5). Treat contract work as a sequential gate before parallel Implementer work on consumers.

---

## Sequential vs parallel — decision checklist

Use this before scheduling multiple agents:

| Question | Parallel OK if… |
| -------- | ----------------- |
| Do tasks touch disjoint file sets? | Yes |
| Do tasks touch the same `packages/contracts` export? | No — sequence (Architecture / Integrator first) |
| Does any task depend on another’s merged output? | No — sequence by dependency order |
| Will both tasks run migrations or compose definitions? | No — single owner per infra change set |
| Is only one app/service in each task’s scope? | Often yes — see [parallelism-matrix.md](./parallelism-matrix.md) |

**Milestone parallel tracks** (from `DOCUMENTATION.md` §3) are planning hints only; still enforce file and contract rules above.

---

## Context consumption (all roles)

Before implementation work:

1. `start.md` (this model’s parent spec)
2. `DOCUMENTATION.md`
3. `docs/stages/<stage>/README.md`
4. Relevant `packages/contracts` (not the entire repo)
5. `docs/templates/agent-handoff-template.md` when handing off

Implementers additionally read `AGENTS.md` before coding.

---

## Handoffs and ambiguity

- Every role transition uses `docs/handoffs/` records from `docs/templates/agent-handoff-template.md`.
- Subjective requirements → `docs/templates/ambiguity-record-template.md` with exactly two options; fallback: stricter / security-first (`start.md` §7, `DOCUMENTATION.md` §4).

---

## Quality gates (Verifier checklist)

Block delivery if any fail (`AGENTS.md`, `start.md` §6):

- ESLint: 0 errors
- Prettier: formatted
- TypeScript: strict, 0 errors
- Stage tests passing
- Contracts compatible
- No critical vulnerabilities
- No unversioned breaking changes
- Smoke test for changed functionality

CI is the final authority (`DOCUMENTATION.md` §1).

---

## Related documents

| Document | Purpose |
| -------- | ------- |
| [parallelism-matrix.md](./parallelism-matrix.md) | Stage × module × owner; default parallel groupings |
| `AGENTS.md` | Role definitions, ownership table, protocols |
| `DOCUMENTATION.md` §4–§5 | Architecture-level multi-agent and contract strategy |
| `start.md` §3–§4 | Bootstrap parallelism rule and stage protocol |
