// ============================================================
// Application Bootstrap (index.ts)
// ============================================================
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { env } from './config/env';
import { logger } from '@chess/logger';
import { MatchmakingService } from './services/MatchmakingService';
import { GameRoomService } from './services/GameRoomService';
import { socketAuthMiddleware } from './socket/middleware';
import { registerSocketHandlers } from './socket/handlers';

async function bootstrap() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  logger.info('Connected to PostgreSQL (Game Service)');

  const redis = new Redis(env.REDIS_URL);
  redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
  redis.on('connect', () => logger.info('Connected to Redis'));

  const matchmakingService = new MatchmakingService(redis);
  const gameRoomService = new GameRoomService(redis, prisma);

  const app = express();
  const server = http.createServer(app);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: env.SERVICE_NAME });
  });

  const io = new Server(server, {
    cors: {
      origin: '*', // Configure strictly in production
      methods: ['GET', 'POST'],
    },
  });

  // Apply JWT Auth middleware to all incoming socket connections
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    registerSocketHandlers(io, socket, matchmakingService, gameRoomService);
  });

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, service: env.SERVICE_NAME }, 'Game service started');
  });

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    io.close();
    server.close(async () => {
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
  console.error('Failed to start game service:', err);
  process.exit(1);
});
