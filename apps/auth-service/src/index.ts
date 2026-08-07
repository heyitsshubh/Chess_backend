// ============================================================
// Application Bootstrap (index.ts)
//
// This is where we wire everything together using Dependency 
// Injection manually (no IoC container needed at this scale).
// We construct all dependencies here and inject them downward.
// ============================================================
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { env } from './config/env';
import { logger } from '@chess/logger';
import { PrismaUserRepository } from './infrastructure/database/PrismaUserRepository';
import { RedisTokenStore } from './infrastructure/cache/RedisTokenStore';
import { ResendEmailService } from './infrastructure/email/ResendEmailService';
import { createAuthRouter } from './api/routes/auth.routes';
import { globalErrorHandler } from './api/middleware/errorHandler';
import * as grpc from '@grpc/grpc-js';
import { userProto } from '@chess/grpc';
import { UserService } from './grpc/UserService';

async function bootstrap() {
  // 1. Connect to PostgreSQL via Prisma
  const prisma = new PrismaClient();
  await prisma.$connect();
  logger.info('Connected to PostgreSQL');

  // 2. Connect to Redis
  const redis = new Redis(env.REDIS_URL);
  redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
  redis.on('connect', () => logger.info('Connected to Redis'));

  // 3. Instantiate infrastructure adapters
  const userRepo = new PrismaUserRepository(prisma);
  const tokenStore = new RedisTokenStore(redis);
  const emailService = new ResendEmailService();

  // 4. Create Express app
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: env.APP_URL,
    credentials: true, // Allow cookies
  }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check (used by Kubernetes liveness probe)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: env.SERVICE_NAME });
  });

  // Mount auth routes
  app.use('/auth', createAuthRouter(userRepo, tokenStore, emailService));

  // Global error handler — must be last
  app.use(globalErrorHandler);

  // 5. Start Express server
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, service: env.SERVICE_NAME }, 'Auth service started');
  });

  // 6. Start gRPC Server
  const grpcServer = new grpc.Server();
  const userService = new UserService(prisma);
  grpcServer.addService(userProto.UserService.service, {
    GetUserInfo: userService.GetUserInfo
  });

  const GRPC_PORT = 50051;
  grpcServer.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      logger.error({ err }, 'Failed to bind gRPC server');
      return;
    }
    logger.info({ port, service: env.SERVICE_NAME }, 'gRPC service started');
  });

  // 6. Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    server.close(async () => {
      grpcServer.forceShutdown();
      await prisma.$disconnect();
      redis.disconnect();
      logger.info('Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start auth service:', err);
  process.exit(1);
});
