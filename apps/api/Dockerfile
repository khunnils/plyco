# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI="true"

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/client/package.json apps/client/package.json
COPY apps/cli/package.json apps/cli/package.json
COPY apps/mcp/package.json apps/mcp/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @plyco/shared build \
  && pnpm --filter @plyco/db build \
  && pnpm --filter @plyco/api build \
  && pnpm --filter @plyco/api --prod deploy --legacy /prod \
  && find /prod -type f -name '.env*' -delete \
  && test -f /prod/node_modules/@plyco/db/dist/generated/prisma/client.js

FROM base AS runtime

ENV NODE_ENV="production"
ENV HOST="0.0.0.0"

WORKDIR /app

COPY --from=build /prod ./

CMD ["node", "dist/server.js"]
