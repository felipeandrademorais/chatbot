#!/usr/bin/env bash
# Minimum quality gates (start.md §6). Run from repo root: bash scripts/quality-gate.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Per-gate exit codes (reported on first failure; documented in docs/execution/quality-gates.md)
readonly EC_LINT=10
readonly EC_FORMAT=11
readonly EC_TYPECHECK=12
readonly EC_STAGE_TESTS=13
readonly EC_CONTRACT=14
readonly EC_SECURITY=15
readonly EC_BREAKING=16
readonly EC_SMOKE=17
readonly EC_CONTRACT_FREEZE=18

SKIP_STAGE_TESTS="${QUALITY_GATE_SKIP_STAGE_TESTS:-0}"
SKIP_CONTRACT="${QUALITY_GATE_SKIP_CONTRACT:-0}"
SKIP_SECURITY="${QUALITY_GATE_SKIP_SECURITY:-0}"
SKIP_BREAKING="${QUALITY_GATE_SKIP_BREAKING:-0}"
SKIP_SMOKE="${QUALITY_GATE_SKIP_SMOKE:-0}"
SKIP_CONTRACT_FREEZE="${QUALITY_GATE_SKIP_CONTRACT_FREEZE:-0}"

FAILED=0
FAIL_CODE=0

run_step() {
  local label="$1"
  local code="$2"
  shift 2
  echo ""
  echo "==> ${label}"
  "$@"
  local status=$?
  if [[ "${status}" -eq 0 ]]; then
    echo "PASS: ${label}"
    return 0
  fi
  echo "FAIL: ${label} (step exit ${status})"
  if [[ "${FAILED}" -eq 0 ]]; then
    FAILED=1
    FAIL_CODE="${code}"
  fi
  return "${status}"
}

echo "Quality gate — $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Repo: ${ROOT}"

run_step "Lint (ESLint, zero errors)" "${EC_LINT}" pnpm run lint
run_step "Formatting (Prettier check)" "${EC_FORMAT}" pnpm run format:check
run_step "Typecheck (strict TypeScript)" "${EC_TYPECHECK}" pnpm run typecheck

if [[ "${SKIP_STAGE_TESTS}" != "1" ]]; then
  run_step "Stage tests (unit)" "${EC_STAGE_TESTS}" pnpm run test:unit
else
  echo ""
  echo "SKIP: Stage tests (QUALITY_GATE_SKIP_STAGE_TESTS=1)"
fi

if [[ "${SKIP_CONTRACT}" != "1" ]]; then
  run_step "Contract tests" "${EC_CONTRACT}" pnpm run test:contract
else
  echo ""
  echo "SKIP: Contract tests (QUALITY_GATE_SKIP_CONTRACT=1)"
fi

if [[ "${SKIP_SECURITY}" != "1" ]]; then
  echo ""
  echo "==> Security audit (dependency; blocks high/critical per DOCUMENTATION.md §6)"
  echo "    Moderate and below: advisory only (non-blocking)."
  if pnpm audit --audit-level high; then
    echo "PASS: Security audit (no high/critical vulnerabilities)"
  else
    audit_status=$?
    echo "FAIL: Security audit (pnpm audit --audit-level high, exit ${audit_status})"
    if [[ "${FAILED}" -eq 0 ]]; then
      FAILED=1
      FAIL_CODE="${EC_SECURITY}"
    fi
  fi
else
  echo ""
  echo "SKIP: Security audit (QUALITY_GATE_SKIP_SECURITY=1)"
fi

if [[ "${SKIP_BREAKING}" != "1" ]]; then
  echo ""
  echo "==> Contract compatibility (breaking changes)"
  if pnpm run --if-present contract:compat; then
    echo "PASS: Contract compatibility (or no contract:compat script yet)"
  else
    compat_status=$?
    echo "FAIL: Contract compatibility (exit ${compat_status})"
    if [[ "${FAILED}" -eq 0 ]]; then
      FAILED=1
      FAIL_CODE="${EC_BREAKING}"
    fi
  fi
else
  echo ""
  echo "SKIP: Contract compatibility (QUALITY_GATE_SKIP_BREAKING=1)"
fi

if [[ "${SKIP_CONTRACT_FREEZE}" != "1" ]]; then
  echo ""
  echo "==> Contract freeze enforcement"
  if pnpm run --if-present contract:freeze; then
    echo "PASS: Contract freeze enforcement"
  else
    freeze_status=$?
    echo "FAIL: Contract freeze enforcement (exit ${freeze_status})"
    if [[ "${FAILED}" -eq 0 ]]; then
      FAILED=1
      FAIL_CODE="${EC_CONTRACT_FREEZE}"
    fi
  fi
else
  echo ""
  echo "SKIP: Contract freeze enforcement (QUALITY_GATE_SKIP_CONTRACT_FREEZE=1)"
fi

if [[ "${SKIP_SMOKE}" != "1" ]]; then
  echo ""
  echo "==> Smoke tests (skipped automatically when stack is unavailable)"
  run_step "Smoke tests" "${EC_SMOKE}" pnpm run test:smoke
else
  echo ""
  echo "SKIP: Smoke tests (QUALITY_GATE_SKIP_SMOKE=1)"
fi

echo ""
if [[ "${FAILED}" -eq 0 ]]; then
  echo "All quality gates passed."
  exit 0
fi

echo "Quality gate failed (exit ${FAIL_CODE}). See docs/execution/quality-gates.md for gate matrix."
exit "${FAIL_CODE}"
