# Branch and Commit Strategy

Operational rules from `start.md` §9 and `DOCUMENTATION.md` §6 (Commit and PR validation) / §9 (Git and Collaboration).

## Branch naming

| Branch type | Pattern | Example |
| ----------- | ------- | ------- |
| Feature (task) | `feature/<stage-id>/<task-id>-<slug>` | `feature/02-infrastructure/TASK-02-003-health-probes` |
| Stage integration | `stage/<id>-<short-name>` | `stage/02-infrastructure` |
| Hotfix | `hotfix/<issue-id>` | `hotfix/INC-142-redis-timeout` |

### Segments

- **stage-id**: stage folder id (`01-foundation`, `02-infrastructure`, … `10-final-hardening`).
- **task-id**: backlog id (`TASK-<stage>-NNN`), e.g. `TASK-02-003`.
- **slug**: short kebab-case summary (`health-probes`, `migrate-cli`).

Long-lived branches (`main`, `develop`) follow `DOCUMENTATION.md` §9.

## Conventional Commits

Format:

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types (required)

Use [Conventional Commits](https://www.conventionalcommits.org/) types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

### Scope (recommended)

Scope should identify **stage** or **module**:

- Stage: `stage-02`, `stage-04`
- Module: `contracts`, `gateway`, `orchestrator`, `worker`, `web`, `shared`

Examples:

```text
feat(stage-02): add readiness probes to gateway
fix(contracts): align health response schema with OpenAPI
test(shared): cover migration checksum validation
```

### Linking acceptance criteria

When a commit implements or closes work tied to stage acceptance criteria, reference IDs in the **body** or **footer**:

```text
feat(stage-02): run migrations in CI test profile

Refs: AC-02-002
```

Use IDs from the active stage README (`AC-<stage>-NNN`). Multiple IDs: `Refs: AC-02-001, AC-02-002`.

## Pull requests and acceptance criteria

Every PR must:

1. State the **stage** and **task id(s)** in the title or description.
2. Copy the PR checklist from [`pr-checklist-template.md`](./pr-checklist-template.md) and mark each listed **AC-** item satisfied or N/A with evidence.
3. Include test evidence (commands + outcome) per `docs/templates/agent-handoff-template.md`.

PRs that do not map changes to acceptance criteria IDs are blocked from merge until the checklist is complete.

## Commit message validation

### Automated (local)

Root `package.json` provides:

```bash
# Validate a message string (CI or pre-commit manual check)
echo "feat(stage-03): test" | pnpm commitlint

# Validate the last commit message
pnpm commitlint -- --from HEAD~1 --to HEAD
```

Dependencies: `@commitlint/cli`, `@commitlint/config-conventional`, config in `commitlint.config.js`.

### Husky

**Not installed** in this repository. There is no `.husky/commit-msg` hook. Contributors validate before push using the commands above.

To add a hook later (optional):

```bash
pnpm add -D husky
pnpm exec husky init
echo 'pnpm commitlint --edit "$1"' > .husky/commit-msg
chmod +x .husky/commit-msg
```

## CONTRIBUTING snippet (commit checks)

Add to `CONTRIBUTING.md` when that file exists:

```markdown
### Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Validate before pushing:

```bash
echo "feat(stage-03): your subject" | pnpm commitlint
```

Reference acceptance criteria in the commit body when applicable: `Refs: AC-03-001`.
```

## Related documents

- `start.md` §9
- `DOCUMENTATION.md` — Commit and PR validation, Git and Collaboration
- [`pr-checklist-template.md`](./pr-checklist-template.md)
- `docs/templates/agent-handoff-template.md`
