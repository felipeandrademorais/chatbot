#!/usr/bin/env bash
# Scaffold an agent handoff markdown file from docs/templates/agent-handoff-template.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HANDOFFS_DIR="${ROOT}/docs/handoffs"
TEMPLATE="${ROOT}/docs/templates/agent-handoff-template.md"

usage() {
  cat <<'EOF'
Usage: scripts/new-handoff.sh <stage> <nnn> <slug> [options]

Creates docs/handoffs/TASK-<stage>-<nnn>-<slug>.md with required sections prefilled.

Options:
  --from NAME           Sending agent (default: implementer)
  --to NAME             Receiving agent (default: empty)
  --commit SHA          Commit SHA (default: git HEAD if available)
  --changed-files LIST  Comma-separated changed file paths
  --contracts LIST      Comma-separated contract paths
  --dry-run             Print target path only; do not write

Examples:
  scripts/new-handoff.sh 02 001 health-contracts --to verifier
  scripts/new-handoff.sh start 08 handoff-system --from executor
EOF
}

die() {
  echo "error: $*" >&2
  exit 1
}

STAGE=""
NNN=""
SLUG=""
FROM_AGENT="implementer"
TO_AGENT=""
COMMIT_SHA=""
CHANGED_FILES=""
CONTRACTS=""
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from)
      FROM_AGENT="${2:-}"
      shift 2
      ;;
    --to)
      TO_AGENT="${2:-}"
      shift 2
      ;;
    --commit)
      COMMIT_SHA="${2:-}"
      shift 2
      ;;
    --changed-files)
      CHANGED_FILES="${2:-}"
      shift 2
      ;;
    --contracts)
      CONTRACTS="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --*)
      die "unknown option: $1"
      ;;
    *)
      if [[ -z "$STAGE" ]]; then
        STAGE="$1"
      elif [[ -z "$NNN" ]]; then
        NNN="$1"
      elif [[ -z "$SLUG" ]]; then
        SLUG="$1"
      else
        die "unexpected argument: $1 (too many positional args)"
      fi
      shift
      ;;
  esac
done

[[ -n "$STAGE" && -n "$NNN" && -n "$SLUG" ]] || {
  usage >&2
  exit 1
}

[[ -f "$TEMPLATE" ]] || die "template not found: $TEMPLATE"

TASK_ID="TASK-${STAGE}-${NNN}"
OUT_FILE="${HANDOFFS_DIR}/${TASK_ID}-${SLUG}.md"

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "$OUT_FILE"
  exit 0
fi

if [[ -z "$COMMIT_SHA" ]] && command -v git >/dev/null 2>&1; then
  COMMIT_SHA="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || true)"
fi
[[ -n "$COMMIT_SHA" ]] || COMMIT_SHA="<commit-sha>"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

format_list() {
  local raw="$1"
  local placeholder="$2"
  if [[ -z "$raw" ]]; then
    echo "- ${placeholder}"
    return
  fi
  local IFS=,
  local item
  for item in $raw; do
    item="${item#"${item%%[![:space:]]*}"}"
    item="${item%"${item##*[![:space:]]}"}"
    [[ -n "$item" ]] && echo "- \`${item}\`"
  done
}

CHANGED_BLOCK="$(format_list "$CHANGED_FILES" "<path> — add all modified files")"
CONTRACTS_BLOCK="$(format_list "$CONTRACTS" "<none> — or list contract paths")"

mkdir -p "$HANDOFFS_DIR"
[[ ! -e "$OUT_FILE" ]] || die "handoff already exists: $OUT_FILE (remove or pick a new slug)"

cat >"$OUT_FILE" <<EOF
# Agent Handoff Record

## Header

- Stage: ${STAGE}
- Task ID: ${TASK_ID}
- From Agent: ${FROM_AGENT}
- To Agent: ${TO_AGENT:-<receiving-agent>}
- Commit SHA: ${COMMIT_SHA}
- Timestamp: ${TIMESTAMP}

## Objective

- <!-- Concrete expected outcome for ${TASK_ID}. -->

## Scope

- Files allowed to modify:
${CHANGED_BLOCK}
- Files forbidden to modify:
  - <!-- Other agents' in-progress paths; shared contracts without handoff. -->

## Contracts

- Contract references:
${CONTRACTS_BLOCK}
- Compatibility constraints:
  - <!-- Breaking changes require version bump + deprecation note. -->

## Work Completed

- <!-- Bullet list of completed steps. -->

## Evidence

- Commands executed:
  - \`pnpm lint\`
  - \`pnpm typecheck\`
  - \`pnpm test:unit\`
  - <!-- stage-specific commands -->
- Test outputs:
  - <!-- pass/fail counts and notable failures -->
- CI checks:
  - <!-- link or status if applicable -->

## Open Issues

- Blocking issues:
  - <!-- none | description -->
- Risks:
  - <!-- none | description -->

## Next Steps

1. <!-- Ordered step for receiving agent -->
2. <!-- ... -->

---

_Scaffolded by \`scripts/new-handoff.sh\`. Fill all sections before handoff; remove HTML comments when done._
EOF

echo "created: $OUT_FILE"
echo "task id: $TASK_ID"
echo "next: edit the file, add a row to docs/handoffs/README.md index, run quality gates, then hand off."
