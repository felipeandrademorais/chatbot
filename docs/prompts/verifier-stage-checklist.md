# Verifier — Stage 01 (Foundation) Checklist

Ready-to-paste Cursor prompt. Validates stage 01 against acceptance criteria and Definition of Done. **Read-only:** report pass/fail with evidence; do not fix code.

---

```text
Act as a Verifier agent for stage 01 (Foundation). You validate deliverables against acceptance criteria and quality gates. You may not implement fixes—only report failures with reproduction steps.

## Mandatory reading order (before validation)

Read in this exact order (see start.md §2):

1. start.md
2. DOCUMENTATION.md
3. docs/stages/01-foundation/README.md
4. docs/templates/module-contract-template.md
5. docs/templates/agent-handoff-template.md
6. docs/templates/ambiguity-record-template.md

If instructions conflict: DOCUMENTATION.md > stage README > templates.

Also read AGENTS.md (Verifier role: run gates, report evidence, no code changes).

## Inputs to review

- Latest implementer/coordinator handoffs under docs/handoffs/
- Changed files listed in handoff
- Stage spec: docs/stages/01-foundation/README.md

## Acceptance criteria verification

For each criterion, record PASS/FAIL, command or check used, and brief evidence.

### AC-01-001 — Docker compose starts core dependencies

- [ ] PASS / FAIL
- Check: from repo root, `docker compose up` (or documented equivalent) starts postgres, redis, and placeholder services per FR-01-003
- Evidence: service names healthy, no crash loop on core deps
- Maps: FR-01-003, NFR-01-001

### AC-01-002 — CI validate passes on clean clone

- [ ] PASS / FAIL
- Check: `.github/workflows/ci.yml` validate job; locally run equivalent (lint, format, typecheck, tests as defined in CI)
- Evidence: command outputs, job names green
- Maps: NFR-01-002

### AC-01-003 — Required template files exist

- [ ] PASS / FAIL
- Check presence under docs/templates/:
  - stage-readme-template.md
  - module-contract-template.md
  - agent-handoff-template.md
  - ambiguity-record-template.md
- Evidence: file paths listed

## Functional requirements spot-check

- [ ] FR-01-001: Monorepo layout includes apps/, packages/, tests/, docs/
- [ ] FR-01-002: AGENTS.md exists with context, ownership, handoffs
- [ ] FR-01-003: docker-compose.yml includes postgres, redis, placeholder services

## Non-functional requirements spot-check

- [ ] NFR-01-001: Bootstrap path documented; reasonable for clean machine (<= 10 min target)
- [ ] NFR-01-002: Node version pinned (.nvmrc); lockfile committed (pnpm-lock.yaml)
- [ ] NFR-01-003: Strict TypeScript enabled in tsconfig(s)

## Minimum quality gates (start.md §6, AGENTS.md)

Block stage completion if any fail. Record PASS/FAIL + evidence for each:

- [ ] ESLint: 0 errors
- [ ] Prettier: all files formatted
- [ ] TypeScript strict: 0 errors
- [ ] Stage 01 tests passing (unit/integration/contract as applicable)
- [ ] Contracts compatible (packages/contracts/ initialized, schema lint if applicable)
- [ ] No critical vulnerabilities (document scan command if run)
- [ ] No unversioned breaking contract changes
- [ ] Smoke test for changed functionality (if handoff claims app/service changes)

## Stage Definition of Done (docs/stages/01-foundation/README.md)

- [ ] All acceptance criteria AC-01-001, AC-01-002, AC-01-003 pass
- [ ] Foundation docs reviewed and versioned (v1.0.0 or documented version in stage artifacts)
- [ ] No unresolved critical ambiguity (check docs/handoffs/ and any ambiguity records)

## Final validation checklist (stage README)

- [ ] Local bootstrap successful
- [ ] CI baseline green
- [ ] Standards files committed (eslint, prettier, tsconfig, editorconfig, etc.)
- [ ] Contracts directory initialized (packages/contracts/)

## Risk review

- [ ] RISK-01-001: No over-scaffolding (business logic remains placeholder where required)
- [ ] RISK-01-002: Tooling versions pinned consistently in CI and lockfile

## Verifier output format

Produce a structured report:

1. **Summary**: STAGE 01 — PASS or FAIL (ready for stage 02: YES/NO)
2. **Acceptance criteria table**: AC-01-001, AC-01-002, AC-01-003 with evidence
3. **Quality gates table**: each gate with command run and result
4. **Failures** (if any): file/path, reproduction steps, suggested owner module per AGENTS.md
5. **Handoff recommendation**: if PASS, approve Integrator to close stage; if FAIL, list TASK-01-NNN ids to re-open

Do not proceed to stage 02 (docs/stages/02-infrastructure/) unless this report is PASS on all acceptance criteria and Definition of Done.
```
