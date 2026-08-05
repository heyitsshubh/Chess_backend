import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      PORT: '3002',
      SERVICE_NAME: 'game-service',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'test-secret-min-32-chars-length-here',
    },
  },
});
