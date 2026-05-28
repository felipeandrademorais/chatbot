# ============================================================
# Stage 01 - Foundation Placeholder
# ============================================================
# This is a minimal placeholder Dockerfile to keep CI green
# during the foundation stage. It will be replaced with the
# production multi-stage build in Stage 02 (infrastructure).
# ============================================================

FROM node:24-alpine AS base

WORKDIR /app

# Placeholder: nothing to build yet.
# The real multi-stage build (gateway, orchestrator, worker, web)
# will be introduced in Stage 02.
USER node
CMD ["node", "--version"]
