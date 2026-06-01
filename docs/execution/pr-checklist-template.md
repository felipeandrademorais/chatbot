# Pull Request Checklist Template

Copy the block below into the PR description. Replace placeholders and check every item before requesting review.

---

## Summary

<!-- What changed and why (1–3 sentences) -->

## Stage and task linkage

| Field | Value |
| ----- | ----- |
| Stage | `<!-- e.g. 02-infrastructure -->` |
| Stage README | `docs/stages/<stage>/README.md` |
| Task ID(s) | `<!-- e.g. TASK-02-003 -->` |
| Branch | `feature/<stage-id>/<task-id>-<slug>` |

## Acceptance criteria

List criteria from the stage README. Mark **Met** only with evidence in Test evidence or Scope.

| ID | Criterion (from stage README) | Status | Evidence |
| -- | ----------------------------- | ------ | -------- |
| `AC-__-___` | <!-- paste criterion text --> | ☐ Met / ☐ N/A | <!-- test name, CI job, or doc link --> |
| `AC-__-___` | | ☐ Met / ☐ N/A | |
| `AC-__-___` | | ☐ Met / ☐ N/A | |

> **Merge rule:** All in-scope `AC-*` items must be **Met** or explicitly **N/A** with justification. Out-of-scope criteria stay unchecked and are called out in Risks.

## Contracts

- [ ] Contracts touched: `<!-- list paths under packages/contracts/ or OpenAPI -->`
- [ ] No unversioned breaking contract changes (or version bump + deprecation noted)

## Test evidence

```bash
# Commands run (copy-paste actual invocations)
pnpm lint
pnpm typecheck
pnpm test:unit
# stage-specific:
```

| Check | Result |
| ----- | ------ |
| Lint | ☐ pass |
| Format | ☐ pass |
| Typecheck | ☐ pass |
| Unit tests | ☐ pass |
| Integration / contract / smoke (if applicable) | ☐ pass / ☐ N/A |

## Quality gates (stage delivery)

- [ ] ESLint: 0 errors
- [ ] Prettier: formatted
- [ ] TypeScript strict: 0 errors
- [ ] Stage tests passing
- [ ] Smoke test for changed behavior (if applicable)
- [ ] No critical dependency vulnerabilities introduced

## Risks and rollback

<!-- What could break; how to revert -->

## Handoff

- [ ] Agent handoff updated (if multi-agent stage work): `docs/handoffs/` or task record

---

### Example (Stage 02)

| ID | Criterion | Status | Evidence |
| -- | --------- | ------ | -------- |
| AC-02-001 | all core containers start healthy | Met | `pnpm compose:test` + `tests/integration/compose-health.test.ts` |
| AC-02-002 | migrations execute automatically in CI | Met | `.github/workflows/ci.yml` migrate job |
| AC-02-003 | failed container startup returns non-zero pipeline status | N/A | out of scope for this PR |
