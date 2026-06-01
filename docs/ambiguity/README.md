# Ambiguity Governance

When a stage requirement, contract, or acceptance criterion is **subjective or missing measurable criteria**, agents must not guess. Follow this workflow before changing scope or inventing behavior.

Source of truth: `start.md` §7, `AGENTS.md` (Ambiguity Handling Protocol), `DOCUMENTATION.md` (Ambiguity handling protocol).

---

## When to open a record

Open an ambiguity record when any of the following apply:

- The requirement text admits multiple valid implementations.
- Success criteria are not measurable (no thresholds, timeouts, status codes, or data shapes).
- Two modules would interpret the same sentence differently.
- You would otherwise “fill in” product or security behavior that the spec does not state.

Do **not** open a record for typos, clear bugs, or choices already fixed in `DOCUMENTATION.md` or the current stage README.

---

## Workflow

| Step | Action |
| ---- | ------ |
| 1 | Copy the template into `docs/ambiguity/records/` (use `scripts/new-ambiguity-record.sh`). |
| 2 | Quote the **exact** ambiguous statement and explain why it is ambiguous. |
| 3 | Propose **exactly 2** options (Option A and Option B), each with explicit trade-offs. |
| 4 | Set status to `open`. **Implementation for that scope is BLOCKED** until the record is resolved or the fallback rule is applied. |
| 5 | Escalate to a human decision owner when possible; reference the record ID in the agent handoff. |
| 6 | On resolution: set status to `resolved` (or `deferred` with a follow-up task), document the selected option, rationale, and impacted contracts/tests. |
| 7 | Register the decision in the **agent handoff** (`docs/templates/agent-handoff-template.md`) under Open Issues / Work Completed as appropriate. |

### Fallback rule (no human response)

If no decision owner responds in time and the stage cannot wait:

1. Choose the **stricter, security-first** interpretation between the two options.
2. Set status to `resolved` and document that the **fallback rule** was used in **Decision → Rationale**.
3. Never treat the fallback as permission to add a third option or expand scope.

**Never silently invent requirements.**

---

## Directory layout

```
docs/ambiguity/
├── README.md                 # This file
├── .gitkeep                  # Keeps tree in git
├── examples/
│   └── EXAMPLE-001-resolved.md
└── records/                  # One file per ambiguity (created by script)
    └── AMBIG-YYYY-MM-DD-<slug>.md
```

Template: `docs/templates/ambiguity-record-template.md`

Example resolved record: `docs/ambiguity/examples/EXAMPLE-001-resolved.md`

---

## Record ID convention

- **Filename:** `AMBIG-<YYYY-MM-DD>-<slug>.md`
- **Ambiguity ID** (in file metadata): same stem, e.g. `AMBIG-2026-06-01-gateway-rate-limit`
- **Slug:** lowercase, hyphen-separated, derived from the topic (no spaces)

---

## Status values

| Status | Meaning |
| ------ | ------- |
| `open` | Unresolved; work on the affected scope is **BLOCKED**. |
| `resolved` | Decision recorded (human or fallback rule). |
| `deferred` | Explicitly postponed; must link a follow-up task ID and owner. |

Stage **Definition of Done** (see `DOCUMENTATION.md`): no unresolved record in `open` state for the current stage.

---

## Quality gates

Before marking a stage or task complete:

- [ ] All ambiguities touching the scope are `resolved` or `deferred` with owner and follow-up.
- [ ] Handoff lists ambiguity IDs and decisions (or documents fallback usage).
- [ ] Contracts and tests updated to match the selected option.

---

## Quick start

```bash
# From repository root
./scripts/new-ambiguity-record.sh
```

The script copies the template into `docs/ambiguity/records/`, pre-fills the date and suggested ID, and prompts for stage, reporter, and slug.

After editing the new file, link it from your handoff and pause implementation until status is no longer `open` (unless applying the security-first fallback per policy above).
