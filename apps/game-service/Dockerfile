# Game Service
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config
COPY pnpm-workspace.yaml .
COPY package.json .
COPY pnpm-lock.yaml .

# Copy shared packages
COPY packages/shared-config ./packages/shared-config
COPY packages/shared-errors ./packages/shared-errors
COPY packages/shared-logger ./packages/shared-logger
COPY packages/chess-engine ./packages/chess-engine

# Copy game service
COPY apps/game-service ./apps/game-service

# Install only production deps
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma client
RUN pnpm --filter @chess/game-service exec prisma generate

# Build shared packages and engine
RUN pnpm --filter @chess/errors run build
RUN pnpm --filter @chess/logger run build
RUN pnpm --filter @chess/engine run build

# Build game service
RUN pnpm --filter @chess/game-service run build

# ---- Production Image ----
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/game-service/dist ./apps/game-service/dist
COPY --from=base /app/apps/game-service/prisma ./apps/game-service/prisma
COPY --from=base /app/apps/game-service/node_modules ./apps/game-service/node_modules

EXPOSE 3002

CMD ["node", "apps/game-service/dist/index.js"]
