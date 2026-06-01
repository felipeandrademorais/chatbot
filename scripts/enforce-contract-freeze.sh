#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FREEZE_FILE="docs/stages/10-final-hardening/contract-freeze.json"
CONTRACT_PACKAGE_JSON="packages/contracts/package.json"
EXCEPTION_APPROVED="${CONTRACT_CHANGE_EXCEPTION_APPROVED:-0}"
EXCEPTION_ID="${CONTRACT_CHANGE_EXCEPTION_ID:-}"

if [[ ! -f "${FREEZE_FILE}" ]]; then
  echo "FAIL: Missing freeze manifest ${FREEZE_FILE}."
  exit 1
fi

frozen_version="$(node -e "const fs=require('fs');const doc=JSON.parse(fs.readFileSync('${FREEZE_FILE}','utf8'));process.stdout.write(doc.frozenVersion)")"
current_version="$(node -e "console.log(require('./${CONTRACT_PACKAGE_JSON}').version)")"

if [[ "${current_version}" != "${frozen_version}" ]]; then
  if [[ "${EXCEPTION_APPROVED}" != "1" ]]; then
    echo "FAIL: Contract version drift detected during freeze (${current_version} != ${frozen_version})."
    echo "Set CONTRACT_CHANGE_EXCEPTION_APPROVED=1 and CONTRACT_CHANGE_EXCEPTION_ID=<approval> for approved exceptions."
    exit 1
  fi

  if [[ -z "${EXCEPTION_ID}" ]]; then
    echo "FAIL: CONTRACT_CHANGE_EXCEPTION_ID is required when override is approved."
    exit 1
  fi
fi

changed_worktree="$(git diff --name-only -- packages/contracts)"
changed_staged="$(git diff --cached --name-only -- packages/contracts)"

changed_recent=""
if git rev-parse --verify HEAD^ >/dev/null 2>&1; then
  changed_recent="$(git diff --name-only HEAD^..HEAD -- packages/contracts)"
fi

if [[ -n "${changed_worktree}${changed_staged}${changed_recent}" && "${EXCEPTION_APPROVED}" != "1" ]]; then
  echo "FAIL: Contract freeze violation. Changes detected under packages/contracts."
  {
    echo "${changed_worktree}"
    echo "${changed_staged}"
    echo "${changed_recent}"
  } | sed '/^$/d' | sort -u | sed 's/^/  - /'
  echo "Require explicit exception approval per ${FREEZE_FILE}."
  exit 1
fi

if [[ "${EXCEPTION_APPROVED}" == "1" ]]; then
  if [[ -z "${EXCEPTION_ID}" ]]; then
    echo "FAIL: CONTRACT_CHANGE_EXCEPTION_APPROVED=1 requires CONTRACT_CHANGE_EXCEPTION_ID."
    exit 1
  fi
  echo "PASS: Contract change exception accepted (${EXCEPTION_ID})."
  exit 0
fi

echo "PASS: Contract freeze enforced (${frozen_version})."
