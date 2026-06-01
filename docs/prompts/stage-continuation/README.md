# Stage Continuation Prompts

Paste-ready prompts to resume autonomous multi-agent execution at any milestone **without skipping Definition of Done**. Each file extends the template in [`start.md` §11](../../start.md#11-stage-continuation-prompt).

## Index

| Stage | Milestone | Prompt file | Stage README |
| ----- | --------- | ----------- | ------------ |
| 01 | M1 Foundation | [01-foundation.md](./01-foundation.md) | `docs/stages/01-foundation/README.md` |
| 02 | M2 Infrastructure | [02-infrastructure.md](./02-infrastructure.md) | `docs/stages/02-infrastructure/README.md` |
| 03 | M3 Core Domain | [03-core-domain.md](./03-core-domain.md) | `docs/stages/03-core-domain/README.md` |
| 04 | M4 APIs | [04-apis.md](./04-apis.md) | `docs/stages/04-apis/README.md` |
| 05 | M5 Integrations | [05-integrations.md](./05-integrations.md) | `docs/stages/05-integrations/README.md` |
| 06 | M6 Frontend | [06-frontend.md](./06-frontend.md) | `docs/stages/06-frontend/README.md` |
| 07 | M7 Observability | [07-observability.md](./07-observability.md) | `docs/stages/07-observability/README.md` |
| 08 | M8 Security | [08-security.md](./08-security.md) | `docs/stages/08-security/README.md` |
| 09 | M9 Scalability | [09-scalability.md](./09-scalability.md) | `docs/stages/09-scalability/README.md` |
| 10 | M10 Final Hardening | [10-final-hardening.md](./10-final-hardening.md) | `docs/stages/10-final-hardening/README.md` |

Milestone goals align with [`DOCUMENTATION.md` §3 Milestone Roadmap](../../../DOCUMENTATION.md#3-milestone-roadmap-incremental-and-parallel).

## How to use

1. Confirm the **previous** stage DoD is complete (see that stage’s README **Definition of Done** and **Final Validation Checklist**).
2. Open the prompt file for the stage you are starting or resuming.
3. Copy the **Paste-ready prompt** block into Cursor (or your coordinator agent).
4. On completion, write the stage handoff to the path listed in that file (format: `docs/templates/agent-handoff-template.md`).

## Global reading order (every stage)

1. `start.md`
2. `DOCUMENTATION.md`
3. `AGENTS.md`
4. Current stage `docs/stages/<stage>/README.md`
5. `docs/templates/module-contract-template.md`
6. `docs/templates/agent-handoff-template.md`
7. Relevant `packages/contracts/**` (see per-stage prompt)

## Global quality gates (every delivery)

From `start.md` §6 and `DOCUMENTATION.md` §6 — block delivery if any fail:

- ESLint: 0 errors
- Prettier: formatted (CI diff clean)
- TypeScript: strict, 0 errors
- Stage tests: all passing
- Contracts: compatible (no unversioned breaking changes)
- Security: 0 critical vulnerabilities
- Smoke test for changed functionality

## Macro sequence

`01-foundation` → `02-infrastructure` → `03-core-domain` → `04-apis` → `05-integrations` → `06-frontend` → `07-observability` → `08-security` → `09-scalability` → `10-final-hardening`

Do not start stage *N+1* until stage *N* DoD is 100% satisfied.

## Handoff directory

Stage completions should produce records under `docs/handoffs/` (create the directory on first use). This index does not store handoffs; it only references expected output paths per stage prompt.
