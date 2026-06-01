#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SKIP_INTEGRATION="${REGRESSION_SKIP_INTEGRATION:-0}"
SKIP_E2E="${REGRESSION_SKIP_E2E:-0}"
SKIP_SMOKE="${REGRESSION_SKIP_SMOKE:-0}"

echo "Stage 10 regression matrix start: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Mutation tooling can leave temporary sandboxes that are intentionally non-lintable.
# Remove them to avoid false negatives in release hardening lint gates.
rm -rf packages/*/.stryker-tmp

pnpm run lint
pnpm run format:check
pnpm run typecheck
pnpm run test:unit
pnpm run test:contract

if [[ "${SKIP_INTEGRATION}" != "1" ]]; then
  pnpm run test:integration
else
  echo "SKIP: integration matrix (REGRESSION_SKIP_INTEGRATION=1)"
fi

if [[ "${SKIP_E2E}" != "1" ]]; then
  pnpm run test:e2e
else
  echo "SKIP: e2e matrix (REGRESSION_SKIP_E2E=1)"
fi

if [[ "${SKIP_SMOKE}" != "1" ]]; then
  pnpm run test:smoke
else
  echo "SKIP: smoke matrix (REGRESSION_SKIP_SMOKE=1)"
fi

echo "Stage 10 regression matrix complete."
