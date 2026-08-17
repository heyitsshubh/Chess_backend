# =============================================================
# Game Service — Optimised Multi-stage Dockerfile
#
# Stage 1 (deps):    install ALL deps for building
# Stage 2 (builder): compile TypeScript → dist/
# Stage 3 (runner):  minimal runtime — no dev deps, no src
# =============================================================

# ---- Stage 1: Install all dependencies ----
FROM node:20-alpine AS deps
RUN npm install -g pnpm@9
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-errors/package.json   ./packages/shared-errors/
COPY packages/shared-logger/package.json   ./packages/shared-logger/
COPY packages/shared-grpc/package.json     ./packages/shared-grpc/
COPY packages/chess-engine/package.json    ./packages/chess-engine/
COPY apps/game-service/package.json        ./apps/game-service/

RUN pnpm install --frozen-lockfile

# ---- Stage 2: Build ----
FROM deps AS builder
COPY packages/shared-errors/  ./packages/shared-errors/
COPY packages/shared-logger/  ./packages/shared-logger/
COPY packages/shared-grpc/    ./packages/shared-grpc/
COPY packages/chess-engine/   ./packages/chess-engine/
COPY apps/game-service/       ./apps/game-service/

RUN pnpm --filter @chess/errors  build
RUN pnpm --filter @chess/logger  build
RUN pnpm --filter @chess/grpc    build
RUN pnpm --filter @chess/engine  build
RUN pnpm --filter @chess/game-service exec prisma generate
RUN pnpm --filter @chess/game-service build

# ---- Stage 3: Runtime ----
FROM node:20-alpine AS runner
RUN npm install -g pnpm@9

ENV NODE_ENV=production
WORKDIR /app

# Workspace scaffolding
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-errors/package.json   ./packages/shared-errors/
COPY packages/shared-logger/package.json   ./packages/shared-logger/
COPY packages/shared-grpc/package.json     ./packages/shared-grpc/
COPY packages/chess-engine/package.json    ./packages/chess-engine/
COPY apps/game-service/package.json        ./apps/game-service/

RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared-errors/dist  ./packages/shared-errors/dist
COPY --from=builder /app/packages/shared-logger/dist  ./packages/shared-logger/dist
COPY --from=builder /app/packages/shared-grpc/dist    ./packages/shared-grpc/dist
COPY --from=builder /app/packages/chess-engine/dist   ./packages/chess-engine/dist
COPY --from=builder /app/apps/game-service/dist       ./apps/game-service/dist
COPY --from=builder /app/apps/game-service/prisma     ./apps/game-service/prisma
COPY --from=builder /app/apps/game-service/src/generated  ./apps/game-service/src/generated

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3002/game/health || exit 1

USER node

CMD ["node", "apps/game-service/dist/index.js"]
