# START - Multi-Agent Execution Bootstrap for Cursor

This file is the entry point for Cursor to execute the project almost autonomously using **Spec-Driven Development**, **multi-agent orchestration**, and **mandatory quality gates**.

> Functional and architectural source of truth: `DOCUMENTATION.md` + `docs/stages/**/README.md`

---

## 1. Operational Goal

Generate the entire system code incrementally, stage by stage, with specialized agents working in parallel while preserving:

- stable contracts between modules;
- automated validation for every delivery;
- low coupling between tasks;
- zero unresolved ambiguities.

---

## 2. Mandatory Reading Order (for every agent)

Before implementing any code, **always** read in this order:

1. `start.md` (this file)
2. `DOCUMENTATION.md`
3. `docs/stages/<stage>/README.md` for the current stage
4. `docs/templates/module-contract-template.md`
5. `docs/templates/agent-handoff-template.md`
6. `docs/templates/ambiguity-record-template.md`

If instructions conflict:

- priority 1: `DOCUMENTATION.md`
- priority 2: current stage README
- priority 3: templates

---

## 3. Multi-Agent Execution Model

Use 4 agent roles:

- **Coordinator**: breaks down the stage into atomic tasks, defines context ownership and dependencies.
- **Implementer**: implements only the assigned task scope.
- **Verifier**: validates against acceptance criteria and quality gates.
- **Integrator**: integrates tasks/PRs and resolves contract incompatibilities.

### Parallelism rule

Run tasks in parallel only when they:

- do not modify the same files, and
- do not break shared contracts.

If two tasks touch the same module/contract, execute them sequentially.

---

## 4. Stage Protocol (01 -> 10)

Execute in this exact macro sequence:

1. `01-foundation`
2. `02-infrastructure`
3. `03-core-domain`
4. `04-apis`
5. `05-integrations`
6. `06-frontend`
7. `07-observability`
8. `08-security`
9. `09-scalability`
10. `10-final-hardening`

Inside each stage:

1. Read the stage README.
2. Create an atomic backlog with IDs (`TASK-<stage>-NNN`).
3. Map parallelizable vs sequential tasks.
4. Implement.
5. Validate locally.
6. Run stage quality gates.
7. Register handoff/state.

Do not start the next stage until the current stage **Definition of Done** is fully satisfied.

---

## 5. Implementation Rules (non-negotiable)

- Docker and docker-compose are mandatory for execution.
- Strict TypeScript is mandatory.
- Contract first, code second.
- No `any` in core contracts.
- No bypass of tests/lint/quality gates.
- Do not change scope without recording ambiguity.

---

## 6. Minimum Quality Gates (every delivery)

Block delivery if any item fails:

- lint with zero errors;
- valid formatting;
- valid typecheck;
- stage tests passing;
- compatible contracts;
- no critical vulnerabilities;
- no unversioned breaking changes;
- smoke test for changed functionality.

---

## 7. Ambiguity Governance

When a requirement is subjective/ambiguous:

1. Create a record using `docs/templates/ambiguity-record-template.md`.
2. Propose **exactly 2 options** with trade-offs.
3. Choose the safest/most restrictive fallback if no human response is available.
4. Record the decision in the handoff.

Never silently invent requirements.

---

## 8. Agent Handoff (mandatory)

Every context handoff must include:

- stage;
- task id;
- changed files;
- impacted contracts;
- test evidence;
- open risks;
- recommended next step.

Format: `docs/templates/agent-handoff-template.md`.

---

## 9. Branch and Commit Strategy

- Branch per stage/task: `feature/<stage-id>/<task-id>-<slug>`
- Conventional commits: `type(scope): description`
- Recommended scope: `stage-04`, `contracts`, `orchestrator`, etc.
- PR must reference satisfied acceptance criteria IDs.

---

## 10. Recommended Initial Prompt (paste into Cursor)

Use this prompt to start autonomous execution:

```text
Act as a multi-agent development Coordinator.
Read start.md, DOCUMENTATION.md, and docs/stages/01-foundation/README.md.
Create an atomic backlog for stage 01 with IDs TASK-01-001+.
Classify tasks as parallel vs sequential.
Execute full implementation of stage 01 with automated verification.
At the end, produce a formal handoff and stage DoD checklist.
Do not move to stage 02 until stage 01 DoD is 100% complete.
```

---

## 11. Stage Continuation Prompt

```text
Continue execution from stage <NN>.
Read docs/stages/<NN-name>/README.md.
Re-validate dependencies and contracts.
Implement only the current stage scope.
Run mandatory quality gates.
Deliver handoff + final stage checklist.
```

---

## 12. Final Success Criteria

Consider the project complete only when:

- stages 01-10 have full DoD completion;
- CI/CD is green;
- quality gate is approved;
- security has no critical findings;
- rollback has been tested;
- documentation is updated.

If any item fails, project status remains **NOT COMPLETE**.
