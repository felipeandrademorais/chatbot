#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-}"
DRY_RUN="${DRY_RUN:-1}"
ROLLBACK_CMD="${PRODUCTION_ROLLBACK_COMMAND:-}"

if [[ -z "${IMAGE_TAG}" ]]; then
  echo "Usage: $0 <image-tag>"
  exit 2
fi

if [[ ! "${IMAGE_TAG}" =~ ^sha-[a-f0-9]+$ && "${IMAGE_TAG}" != "sha-placeholder" ]]; then
  echo "FAIL: rollback image tag must use sha-<hex> format."
  exit 1
fi

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "DRY_RUN=1: rollback rehearsal to ${IMAGE_TAG}"
  exit 0
fi

if [[ -z "${ROLLBACK_CMD}" ]]; then
  echo "FAIL: PRODUCTION_ROLLBACK_COMMAND is required when DRY_RUN=0."
  exit 1
fi

bash -lc "${ROLLBACK_CMD} ${IMAGE_TAG}"
