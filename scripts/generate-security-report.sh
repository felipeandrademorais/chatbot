#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mkdir -p reports

if pnpm audit --audit-level high --json > reports/security-audit.json; then
  echo "PASS: security audit report generated at reports/security-audit.json"
  exit 0
fi

echo "FAIL: High/Critical vulnerabilities detected. See reports/security-audit.json"
exit 1
