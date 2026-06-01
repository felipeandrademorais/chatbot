# syntax=docker/dockerfile:1
# CI default image — gateway service (Stage 02)
ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/gateway/package.json apps/gateway/
COPY apps/orchestrator/package.json apps/orchestrator/
COPY apps/worker/package.json apps/worker/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/shared/package.json packages/shared/
COPY packages/domain/package.json packages/domain/
COPY packages/tools/package.json packages/tools/
COPY packages/test-kits/package.json packages/test-kits/
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY . .
RUN pnpm --filter @chatbot/gateway... run build

FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache wget \
  && addgroup -S chatbot \
  && adduser -S chatbot -G chatbot
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/gateway ./apps/gateway
COPY --from=build /app/migrations ./migrations
USER chatbot
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/health/live || exit 1
CMD ["node", "apps/gateway/dist/main.js"]
