import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      NODE_ENV: 'test',
      PORT: '3001',
      SERVICE_NAME: 'auth-service',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'test-secret-min-32-chars-length-here',
      JWT_REFRESH_SECRET: 'test-secret-min-32-chars-length-here',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      RESEND_API_KEY: 're_test123',
      RESEND_FROM_EMAIL: 'test@example.com',
      APP_URL: 'http://localhost:3000',
    },
  },
});
