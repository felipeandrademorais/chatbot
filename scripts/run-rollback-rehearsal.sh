#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

RTO_SECONDS="${ROLLBACK_RTO_SECONDS:-3600}"
ROLLBACK_TARGET_SHA="${ROLLBACK_TARGET_SHA:-sha-placeholder}"
DRY_RUN="${DRY_RUN:-1}"

start_time="$(date +%s)"

echo "Stage 10 rollback rehearsal start: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Target image: sha-${ROLLBACK_TARGET_SHA#sha-}"
echo "RTO target (seconds): ${RTO_SECONDS}"

DRY_RUN="${DRY_RUN}" ./scripts/rollback-production.sh "sha-${ROLLBACK_TARGET_SHA#sha-}"
DRY_RUN="${DRY_RUN}" ./scripts/smoke-production.sh

end_time="$(date +%s)"
elapsed=$((end_time - start_time))

echo "Rollback rehearsal duration: ${elapsed}s"
if ((elapsed > RTO_SECONDS)); then
  echo "FAIL: Rollback rehearsal exceeded RTO target (${elapsed}s > ${RTO_SECONDS}s)."
  exit 1
fi

echo "PASS: Rollback rehearsal completed within RTO target."
