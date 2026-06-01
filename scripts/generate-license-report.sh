#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p reports

if pnpm licenses list --json > reports/license-report.json 2>/dev/null; then
  echo "PASS: license report generated at reports/license-report.json"
  exit 0
fi

echo "WARN: JSON license report unavailable, falling back to text output."
pnpm licenses list > reports/license-report.txt
echo "PASS: license report generated at reports/license-report.txt"
