#!/usr/bin/env bash
set -euo pipefail

DRY_RUN="${DRY_RUN:-1}"
URL="${STAGING_SMOKE_URL:-}"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "DRY_RUN=1: staging smoke rehearsal"
  exit 0
fi

if [[ -z "${URL}" ]]; then
  echo "FAIL: STAGING_SMOKE_URL is required when DRY_RUN=0."
  exit 1
fi

curl -fsS "${URL}/health/ready" >/dev/null
echo "PASS: staging smoke check"
