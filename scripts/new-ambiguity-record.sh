#!/usr/bin/env bash
# Create a new ambiguity record from the project template.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="${ROOT_DIR}/docs/templates/ambiguity-record-template.md"
RECORDS_DIR="${ROOT_DIR}/docs/ambiguity/records"

if [[ ! -f "${TEMPLATE}" ]]; then
  echo "error: template not found at ${TEMPLATE}" >&2
  exit 1
fi

mkdir -p "${RECORDS_DIR}"

DATE="$(date +%Y-%m-%d)"

echo "New ambiguity record"
echo "----------------------"
read -r -p "Slug (lowercase, hyphens, e.g. gateway-rate-limit): " SLUG
SLUG="$(echo "${SLUG}" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9-' '-' | sed -e 's/^-*//' -e 's/-*$//' -e 's/--*/-/g')"

if [[ -z "${SLUG}" ]]; then
  echo "error: slug is required" >&2
  exit 1
fi

read -r -p "Stage (e.g. 04-apis) [optional]: " STAGE
read -r -p "Reported by (agent or human id) [optional]: " REPORTED_BY

AMBIG_ID="AMBIG-${DATE}-${SLUG}"
OUT_FILE="${RECORDS_DIR}/${AMBIG_ID}.md"

if [[ -e "${OUT_FILE}" ]]; then
  echo "error: record already exists: ${OUT_FILE}" >&2
  exit 1
fi

cp "${TEMPLATE}" "${OUT_FILE}"

# Portable in-place sed (GNU and BSD)
sed_inplace() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

sed_inplace "s/^- Ambiguity ID:$/- Ambiguity ID: \`${AMBIG_ID}\`/" "${OUT_FILE}"
sed_inplace "s/^- Stage:$/- Stage: ${STAGE:-}/" "${OUT_FILE}"
sed_inplace "s/^- Reported by:$/- Reported by: ${REPORTED_BY:-}/" "${OUT_FILE}"
sed_inplace "s/^- Date:$/- Date: \`${DATE}\`/" "${OUT_FILE}"
sed_inplace 's/^- Status: `open` | `resolved` | `deferred`$/- Status: `open`/' "${OUT_FILE}"

echo ""
echo "Created: ${OUT_FILE}"
echo "Ambiguity ID: ${AMBIG_ID}"
echo ""
echo "Next steps:"
echo "  1. Fill in Ambiguous Statement, Why Ambiguous, and exactly 2 options."
echo "  2. Keep status \`open\` — scope is BLOCKED until resolved or fallback."
echo "  3. Link this ID in your agent handoff."
echo "  See docs/ambiguity/README.md for the full workflow."
