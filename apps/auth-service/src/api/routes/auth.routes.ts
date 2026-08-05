import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/authenticate';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITokenStore } from '../../infrastructure/cache/ITokenStore';
import { IEmailService } from '../../infrastructure/email/IEmailService';

// Strict rate limiter for sensitive auth endpoints
// 10 requests per minute per IP
const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests, please slow down' } },
});

export function createAuthRouter(
  userRepo: IUserRepository,
  tokenStore: ITokenStore,
  emailService: IEmailService,
): Router {
  const router = Router();
  const controller = new AuthController(userRepo, tokenStore, emailService);

  // Public routes (rate limited)
  router.post('/register', authRateLimiter, controller.register);
  router.post('/login', authRateLimiter, controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/verify-email', authRateLimiter, controller.verifyEmailHandler);
  router.post('/forgot-password', authRateLimiter, controller.forgotPasswordHandler);
  router.post('/reset-password', authRateLimiter, controller.resetPasswordHandler);

  // Protected routes
  router.post('/logout', authenticate, controller.logout);
  router.get('/me', authenticate, controller.me);

  return router;
}
