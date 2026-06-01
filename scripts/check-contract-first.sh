#!/usr/bin/env bash
# Enforces contract-first boundaries: apps must not import domain internals.
# See docs/execution/contract-first-checklist.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0

err() {
  echo "contract-first: $*" >&2
  fail=1
}

# package.json dependencies (workspace or npm)
if deps=$(rg -l '"@chatbot/domain"' apps/*/package.json 2>/dev/null || true); then
  if [[ -n "$deps" ]]; then
    echo "$deps" >&2
    err "remove @chatbot/domain from app package.json; expose APIs via @chatbot/contracts"
  fi
fi

# TypeScript / TSX imports
if imports=$(rg -n \
  "from ['\"]@chatbot/domain|import\\(['\"]@chatbot/domain|from ['\"][^'\"]*packages/domain" \
  apps \
  --glob '*.ts' \
  --glob '*.tsx' \
  2>/dev/null || true); then
  if [[ -n "$imports" ]]; then
    echo "$imports" >&2
    err "apps must not import @chatbot/domain or packages/domain; use @chatbot/contracts"
  fi
fi

# Lightweight any scan in core contracts (ESLint is authoritative in CI)
if any_hits=$(rg -n ':\s*any\b|as any\b|<any>' packages/contracts/src --glob '*.ts' 2>/dev/null || true); then
  if [[ -n "$any_hits" ]]; then
    echo "$any_hits" >&2
    err "packages/contracts must not use explicit any"
  fi
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "contract-first: OK"
