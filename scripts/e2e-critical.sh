#!/usr/bin/env bash
set -euo pipefail

DRY_RUN="${DRY_RUN:-1}"

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "DRY_RUN=1: critical e2e rehearsal"
  exit 0
fi

pnpm run test:e2e
