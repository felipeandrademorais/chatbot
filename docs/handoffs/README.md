# Agent handoffs

Formal context transfers between agents (Coordinator, Implementer, Verifier, Integrator). Required by `start.md` §8 and `AGENTS.md` Handoff Protocol.

**Template:** [`docs/templates/agent-handoff-template.md`](../templates/agent-handoff-template.md)

## Naming convention

```
docs/handoffs/TASK-<stage>-<nnn>-<slug>.md
```

| Part | Description | Examples |
|------|-------------|----------|
| `stage` | Stage or bootstrap id | `01`, `02-infrastructure`, `start` |
| `nnn` | Task number (zero-padded when numeric) | `001`, `08` |
| `slug` | Short kebab-case summary | `health-endpoints`, `handoff-system` |

**Task ID** (in the document header, not the filename): `TASK-<stage>-<nnn>` — e.g. `TASK-02-001`, `TASK-start-08`.

## Scaffold a new handoff

From the repository root:

```bash
chmod +x scripts/new-handoff.sh   # once
./scripts/new-handoff.sh <stage> <nnn> <slug> [options]
```

### Arguments

| Positional | Required | Meaning |
|------------|----------|---------|
| `stage` | yes | Stage id (`02`, `01-foundation`, `start`, …) |
| `nnn` | yes | Task number (`001`, `08`, …) |
| `slug` | yes | Kebab-case slug for the filename |

### Options

| Flag | Default | Meaning |
|------|---------|---------|
| `--from NAME` | `implementer` | Sending agent role |
| `--to NAME` | _(empty)_ | Receiving agent role |
| `--commit SHA` | `git rev-parse HEAD` | Baseline commit |
| `--changed-files LIST` | _(empty)_ | Comma-separated paths (or fill in the file later) |
| `--contracts LIST` | _(empty)_ | Comma-separated contract paths |
| `--dry-run` | off | Print target path only; do not write |

### Examples

```bash
# Stage 02, task 001
./scripts/new-handoff.sh 02 001 health-contracts \
  --from implementer --to verifier \
  --changed-files "packages/contracts/src/health.ts,apps/gateway/src/server.ts" \
  --contracts "packages/contracts/src/health.ts"

# Bootstrap / start.md work
./scripts/new-handoff.sh start 08 handoff-system --from executor --to coordinator
```

## Required content (checklist)

Every handoff must include:

- [ ] **Stage** and **Task ID**
- [ ] **Commit SHA** (input baseline for the receiving agent)
- [ ] **Changed files** (complete list)
- [ ] **Contract references** (or explicit “none”)
- [ ] **Test evidence** (commands + pass/fail summary)
- [ ] **Open risks**
- [ ] **Next steps** (ordered)

## Index

| Task ID | File | Summary |
|---------|------|---------|
| `TASK-start-08` | [TASK-start-08-handoff-system.md](./TASK-start-08-handoff-system.md) | Handoff index, scaffold script, and conventions |

Add a row here when you add a new handoff file.

## When to create a handoff

- End of an Implementer task before Verifier or Integrator picks up work
- Stage boundary (Coordinator → next stage)
- Blocked work (include ambiguity record link if applicable)
- Failure escalation (minimal reproduction + suspected cause)

Do not start the next stage until the current stage Definition of Done is satisfied and the stage handoff is recorded.
