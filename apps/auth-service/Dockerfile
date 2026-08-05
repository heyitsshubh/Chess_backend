# Auth Service
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

# Copy auth service
COPY apps/auth-service ./apps/auth-service

# Install only production deps
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma client
RUN pnpm --filter @chess/auth-service exec prisma generate

# Build shared packages first
RUN pnpm --filter @chess/errors run build
RUN pnpm --filter @chess/logger run build

# Build auth service
RUN pnpm --filter @chess/auth-service run build

# ---- Production Image ----
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/auth-service/dist ./apps/auth-service/dist
COPY --from=base /app/apps/auth-service/prisma ./apps/auth-service/prisma
COPY --from=base /app/apps/auth-service/node_modules ./apps/auth-service/node_modules

EXPOSE 3001

CMD ["node", "apps/auth-service/dist/index.js"]
