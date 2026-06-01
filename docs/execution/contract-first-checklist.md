# Contract-first checklist

Enforces **start.md §5**: contract first, code second. Cross-module types and API shapes live in `packages/contracts` before implementation in apps, `packages/domain`, or workers.

## Before coding

1. Read `DOCUMENTATION.md` §5 (contract-first parallelization) and the current stage README.
2. Identify affected contract surfaces (REST/OpenAPI, events/JSON Schema, TypeScript DTOs in `packages/contracts`).
3. Add or update types/schemas in `packages/contracts` (and OpenAPI/JSON Schema when the stage requires them).
4. Run contract tests: `pnpm run test:contract`.
5. Only then implement consumers in `apps/*`, `packages/domain`, or `packages/shared`.

## Module boundaries

| Layer | May import from | Must not (apps) |
| ----- | ----------------- | ----------------- |
| `apps/*` | `@chatbot/contracts`, `@chatbot/shared` (and framework deps) | `@chatbot/domain` or `packages/domain/**` |
| `packages/shared` | `@chatbot/contracts` | Domain business rules |
| `packages/domain` | contracts + pure domain deps | App/framework code |
| `packages/contracts` | Standard libs only | `apps/*`, `domain` implementation |

Apps reach domain behavior through orchestration APIs and workers, not by importing `packages/domain` directly.

## Core contracts quality

- **No `any`** in `packages/contracts/src/**` (ESLint `@typescript-eslint/no-explicit-any` + CI lint of that tree).
- Prefer `unknown` + narrowing or explicit generics over `any`.
- Breaking changes: version bump and deprecation note per `AGENTS.md`.

## Automated check

```bash
bash scripts/check-contract-first.sh
```

Fails when any app:

- lists `@chatbot/domain` in `package.json`, or
- imports `@chatbot/domain` or filesystem paths into `packages/domain` from TypeScript sources.

CI runs this in the `contract` job (`.github/workflows/ci.yml`).

## PR checklist

- [ ] Contract types/schemas updated before app/domain code
- [ ] `pnpm run test:contract` passes
- [ ] `bash scripts/check-contract-first.sh` passes
- [ ] No new `@chatbot/domain` imports under `apps/`
- [ ] Handoff lists contracts touched (`docs/templates/agent-handoff-template.md`)

## Related

- Template: `docs/templates/module-contract-template.md`
- Health example: `packages/contracts/src/health.ts` consumed via `@chatbot/shared` server helpers
