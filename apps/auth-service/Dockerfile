# =============================================================
# Auth Service — Optimised Multi-stage Dockerfile
#
# Stage 1 (deps):    install ALL deps (dev + prod) for building
# Stage 2 (builder): compile TypeScript → dist/
# Stage 3 (runner):  minimal runtime image — no dev deps, no src
# =============================================================

# ---- Stage 1: Install all dependencies ----
FROM node:20-alpine AS deps
RUN npm install -g pnpm@9
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared-errors/package.json   ./packages/shared-errors/
COPY packages/shared-logger/package.json   ./packages/shared-logger/
COPY packages/shared-grpc/package.json     ./packages/shared-grpc/
COPY apps/auth-service/package.json        ./apps/auth-service/

RUN pnpm install --frozen-lockfile

# ---- Stage 2: Build ----
FROM deps AS builder
COPY packages/shared-errors/  ./packages/shared-errors/
COPY packages/shared-logger/  ./packages/shared-logger/
COPY packages/shared-grpc/    ./packages/shared-grpc/
COPY apps/auth-service/       ./apps/auth-service/

RUN pnpm --filter @chess/errors build
RUN pnpm --filter @chess/logger build
RUN pnpm --filter @chess/grpc   build
RUN pnpm --filter @chess/auth-service exec prisma generate
RUN pnpm --filter @chess/auth-service build

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
COPY apps/auth-service/package.json        ./apps/auth-service/

# Install production-only deps
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/packages/shared-errors/dist  ./packages/shared-errors/dist
COPY --from=builder /app/packages/shared-logger/dist  ./packages/shared-logger/dist
COPY --from=builder /app/packages/shared-grpc/dist    ./packages/shared-grpc/dist
COPY --from=builder /app/apps/auth-service/dist       ./apps/auth-service/dist
COPY --from=builder /app/apps/auth-service/prisma     ./apps/auth-service/prisma
COPY --from=builder /app/apps/auth-service/src/generated  ./apps/auth-service/src/generated

EXPOSE 3001
EXPOSE 50051

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/auth/health || exit 1

USER node

CMD ["node", "apps/auth-service/dist/index.js"]
