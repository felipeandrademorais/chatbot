#!/usr/bin/env bash
set -euo pipefail

DRY_RUN="${DRY_RUN:-1}"
URL="${PRODUCTION_SMOKE_URL:-}"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "DRY_RUN=1: production smoke rehearsal"
  exit 0
fi

if [[ -z "${URL}" ]]; then
  echo "FAIL: PRODUCTION_SMOKE_URL is required when DRY_RUN=0."
  exit 1
fi

curl -fsS "${URL}/health/ready" >/dev/null
echo "PASS: production smoke check"
