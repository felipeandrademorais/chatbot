# AGENTS.md — Multi-Agent Execution Context

This file defines the rules and protocols for AI agent execution within this codebase.
Every agent session must read this file before any implementation work.

---

## Agent Roles

### Coordinator

- Reads stage README and decomposes into atomic tasks.
- Assigns ownership and defines dependencies.
- Produces task backlog with IDs (`TASK-<stage>-NNN`).
- Classifies tasks as parallel vs sequential.

### Implementer

- Executes only the assigned task scope.
- Must not modify files outside assigned scope.
- Must reference contracts before writing code.
- Must produce test evidence for all changes.

### Verifier

- Validates output against acceptance criteria.
- Runs quality gates (lint, type, test, coverage).
- Reports pass/fail with evidence.
- May not fix code — only report failures.

### Integrator

- Merges compliant outputs from implementers.
- Resolves contract incompatibilities.
- Ensures cross-module consistency.
- Produces final stage handoff.

---

## Context Consumption Protocol

Before implementing any code, read in this order:

1. `AGENTS.md` (this file)
2. `DOCUMENTATION.md` (architecture and quality policy)
3. `docs/stages/<stage>/README.md` (current stage spec)
4. `packages/contracts/` (relevant module contracts)
5. Only the code subtree relevant to the task

**Do NOT load the entire repository into context.**

### Priority on conflicts:

1. `DOCUMENTATION.md`
2. Current stage README
3. Templates
4. This file

---

## Module Ownership Map

| Module               | Owner             | Responsibility                              |
| -------------------- | ----------------- | ------------------------------------------- |
| `apps/gateway`       | Gateway team      | Transport, request validation, job creation |
| `apps/orchestrator`  | Orchestrator team | Workflow graph, routing decisions           |
| `apps/worker`        | Worker team       | Specialized execution, tool invocation      |
| `apps/web`           | Frontend team     | User-facing web interface                   |
| `packages/contracts` | Architecture team | API schemas, event schemas, DTO versions    |
| `packages/domain`    | Domain team       | Pure business logic (framework-independent) |
| `packages/tools`     | Tools team        | Tool adapters, allowlists, sandbox wrappers |
| `packages/shared`    | Shared team       | Cross-cutting utilities                     |
| `packages/test-kits` | QA team           | Test utilities and fixtures                 |

### Conflict avoidance:

- One module = one primary owner per sprint.
- Cross-module changes require a **contract PR first**.
- Breaking changes require version bump (`vN`) and deprecation note.
- No agent may change another agent's module without explicit handoff.

---

## Handoff Protocol

Every context handoff must include (use `docs/templates/agent-handoff-template.md`):

- **Stage**: current stage ID
- **Task ID**: `TASK-<stage>-NNN`
- **Commit SHA**: input commit reference
- **Changed files**: list of all modified files
- **Contract references**: which contracts were touched
- **Test evidence**: commands run + output summary
- **Open risks**: unresolved issues or concerns
- **Next steps**: ordered recommendations for receiving agent

---

## Ambiguity Handling Protocol

When a requirement lacks measurable criteria:

1. Create a record using `docs/templates/ambiguity-record-template.md`.
2. Propose **exactly 2 options** with trade-offs.
3. Mark status `BLOCKED` until resolved.
4. **Fallback rule**: choose the stricter, security-first interpretation and log the decision.

**Never silently invent requirements.**

---

## Failure Handling Protocol

- Retry transient failures (max 2 retries) with exponential backoff.
- On persistent failure:
  1. Create a failure report with reproduction steps and suspected root cause.
  2. Trigger handoff to verifier agent with minimal reproducible context.

---

## Quality Gate Requirements

Every delivery must pass (block if any fail):

- [ ] ESLint: 0 errors
- [ ] Prettier: all files formatted
- [ ] TypeScript: strict mode, 0 errors
- [ ] Stage tests: all passing
- [ ] Contracts: compatible
- [ ] Security: no critical vulnerabilities
- [ ] No unversioned breaking changes
- [ ] Smoke test for changed functionality

---

## Coding Conventions

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 22 LTS
- **Package manager**: pnpm 9
- **Framework**: Fastify (gateway)
- **Queue**: BullMQ + Redis
- **Database**: PostgreSQL 16
- **Logging**: Pino (structured JSON)
- **Test runner**: Vitest
- **Commits**: Conventional Commits (`type(scope): message`)
- **No `any`** in core contracts
- **Max complexity**: 10 per function
- **Max cognitive complexity**: 15 per function
