# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI="true"

WORKDIR /app

RUN corepack enable

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/mcp/package.json apps/mcp/package.json
COPY packages/api-client/package.json packages/api-client/package.json

RUN pnpm install --frozen-lockfile

COPY apps/mcp apps/mcp
COPY packages/api-client packages/api-client

RUN pnpm --filter @plyco/api-client build \
  && pnpm --filter @plyco/mcp build \
  && pnpm --filter @plyco/mcp --prod deploy --legacy /prod \
  && find /prod -type f -name '.env*' -delete

FROM base AS runtime

ENV NODE_ENV="production"
ENV MCP_HOST="0.0.0.0"

WORKDIR /app

COPY --from=build /prod ./

CMD ["node", "dist/hosted.js"]
