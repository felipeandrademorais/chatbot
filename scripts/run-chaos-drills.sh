#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GATEWAY_URL="${GATEWAY_URL:-http://localhost:3000}"
ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-http://localhost:3001}"
CHAOS_TIMEOUT_SECONDS="${CHAOS_TIMEOUT_SECONDS:-45}"
KEEP_STACK="${CHAOS_KEEP_STACK:-0}"
STARTED_STACK=0

ensure_env_file() {
  if [[ ! -f ".env" ]]; then
    cp .env.example .env
  fi

  sed -i '' 's/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=chaos-test-password/' .env 2>/dev/null || \
    sed -i 's/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=chaos-test-password/' .env

  if ! grep -q "^JWT_SECRET=" .env; then
    echo "JWT_SECRET=chaos-test-jwt-secret" >> .env
  fi
}

wait_for_unhealthy() {
  local url="$1"
  local label="$2"
  local deadline=$((SECONDS + CHAOS_TIMEOUT_SECONDS))

  while [[ $SECONDS -lt $deadline ]]; do
    status_code="$(curl -s -o /tmp/chatbot-chaos-ready.json -w '%{http_code}' "${url}/health/ready" || true)"
    if [[ "${status_code}" == "503" ]]; then
      echo "PASS: ${label} drove readiness to 503."
      return 0
    fi
    sleep 2
  done

  echo "FAIL: ${label} did not trigger readiness degradation within ${CHAOS_TIMEOUT_SECONDS}s."
  return 1
}

cleanup() {
  if [[ "${KEEP_STACK}" == "1" ]]; then
    return
  fi
  if [[ "${STARTED_STACK}" == "1" ]]; then
    docker compose --profile test down -v >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT

echo "Stage 10 chaos drills start: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ensure_env_file
docker compose --profile test up -d --build --wait
STARTED_STACK=1

curl -fsS "${GATEWAY_URL}/health/ready" >/dev/null
curl -fsS "${ORCHESTRATOR_URL}/health/ready" >/dev/null

echo "Drill 1: Redis failure impact"
docker compose --profile test stop redis
wait_for_unhealthy "${GATEWAY_URL}" "Redis stop"
docker compose --profile test start redis
docker compose --profile test up -d --wait redis
curl -fsS "${GATEWAY_URL}/health/ready" >/dev/null

echo "Drill 2: Postgres failure impact"
docker compose --profile test stop postgres
wait_for_unhealthy "${ORCHESTRATOR_URL}" "Postgres stop"
docker compose --profile test start postgres
docker compose --profile test up -d --wait postgres
curl -fsS "${ORCHESTRATOR_URL}/health/ready" >/dev/null

echo "PASS: Chaos drills completed."
