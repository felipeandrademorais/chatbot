#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-}"
DRY_RUN="${DRY_RUN:-1}"
DEPLOY_CMD="${STAGING_DEPLOY_COMMAND:-}"

if [[ -z "${IMAGE_TAG}" ]]; then
  echo "Usage: $0 <image-tag>"
  exit 2
fi

if [[ "${DRY_RUN}" == "1" ]]; then
  echo "DRY_RUN=1: staging deploy rehearsal for image ${IMAGE_TAG}"
  exit 0
fi

if [[ -z "${DEPLOY_CMD}" ]]; then
  echo "FAIL: STAGING_DEPLOY_COMMAND is required when DRY_RUN=0."
  exit 1
fi

bash -lc "${DEPLOY_CMD} ${IMAGE_TAG}"
