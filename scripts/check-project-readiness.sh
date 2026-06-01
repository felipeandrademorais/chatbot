#!/usr/bin/env bash
# Lightweight project readiness: required artifacts exist.
# Optional --full runs pnpm quality:gate when defined in package.json.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FULL=0
for arg in "$@"; do
  case "$arg" in
    --) continue ;;
    --full) FULL=1 ;;
    -h | --help)
      echo "Usage: $0 [--full]"
      echo "  Default: verify required documentation and CI artifact paths exist."
      echo "  --full:  also run 'pnpm quality:gate' if defined in package.json."
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

missing=0
check_file() {
  local path="$1"
  if [[ -f "$path" ]]; then
    echo "  ok  $path"
  else
    echo "  MISSING  $path" >&2
    missing=$((missing + 1))
  fi
}

check_dir() {
  local path="$1"
  if [[ -d "$path" ]]; then
    echo "  ok  $path/"
  else
    echo "  MISSING  $path/" >&2
    missing=$((missing + 1))
  fi
}

echo "== Project readiness (structural) =="

echo "-- Governance & success criteria --"
check_file "start.md"
check_file "DOCUMENTATION.md"
check_file "AGENTS.md"
check_file "docs/project-success-criteria.md"
check_file "docs/execution/stage-dod-aggregator.md"

echo "-- Stage specifications (01-10) --"
for n in 01 02 03 04 05 06 07 08 09 10; do
  case "$n" in
    01) slug="01-foundation" ;;
    02) slug="02-infrastructure" ;;
    03) slug="03-core-domain" ;;
    04) slug="04-apis" ;;
    05) slug="05-integrations" ;;
    06) slug="06-frontend" ;;
    07) slug="07-observability" ;;
    08) slug="08-security" ;;
    09) slug="09-scalability" ;;
    10) slug="10-final-hardening" ;;
  esac
  check_file "docs/stages/${slug}/README.md"
done
check_file "docs/stages/02-infrastructure/runbook.md"

echo "-- Templates --"
check_file "docs/templates/agent-handoff-template.md"
check_file "docs/templates/stage-readme-template.md"
check_file "docs/templates/module-contract-template.md"
check_file "docs/templates/ambiguity-record-template.md"

echo "-- CI/CD workflows --"
check_file ".github/workflows/ci.yml"
check_file ".github/workflows/release.yml"
check_file ".github/workflows/nightly-quality.yml"

echo "-- Stage 10 hardening assets --"
check_file "docs/stages/10-final-hardening/contract-freeze.json"
check_file "docs/stages/10-final-hardening/operations-checklist.md"
check_file "docs/stages/10-final-hardening/rollback-playbook.md"
check_file "docs/stages/10-final-hardening/release-notes.md"
check_file "docs/stages/10-final-hardening/go-no-go.md"
check_file "scripts/enforce-contract-freeze.sh"
check_file "scripts/run-regression-matrix.sh"
check_file "scripts/run-chaos-drills.sh"
check_file "scripts/run-rollback-rehearsal.sh"
check_file "scripts/deploy-staging.sh"
check_file "scripts/smoke-staging.sh"
check_file "scripts/e2e-critical.sh"
check_file "scripts/deploy-production.sh"
check_file "scripts/smoke-production.sh"
check_file "scripts/rollback-production.sh"

echo "-- Runtime & contracts baseline --"
check_file "docker-compose.yml"
check_file ".env.example"
check_file "package.json"
check_file "pnpm-workspace.yaml"
check_dir "packages/contracts"
check_dir "migrations"
check_file "migrations/001_init.sql"

echo "-- Test layout --"
check_dir "tests/integration"
check_dir "tests/contract"
check_dir "tests/smoke"

if [[ "$missing" -gt 0 ]]; then
  echo ""
  echo "FAIL: $missing required artifact(s) missing. Project status: NOT COMPLETE."
  exit 1
fi

echo ""
echo "Structural checks passed ($(($(ls -1 docs/stages/*/README.md 2>/dev/null | wc -l | tr -d ' '))) stage READMEs present)."
echo "Note: Stage DoD and global gates are still NOT COMPLETE until verified manually."
echo "See: docs/execution/stage-dod-aggregator.md"

if [[ "$FULL" -eq 1 ]]; then
  echo ""
  echo "== Full quality gate (--full) =="
  if node -e "
    const p = require('./package.json');
    process.exit(p.scripts && p.scripts['quality:gate'] ? 0 : 1);
  " 2>/dev/null; then
    pnpm quality:gate
  else
    echo "SKIP: package.json has no 'quality:gate' script yet." >&2
    echo "Define quality:gate (lint, typecheck, tests, coverage) before using --full for release sign-off." >&2
    exit 1
  fi
fi

exit 0
