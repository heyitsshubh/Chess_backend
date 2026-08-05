// ============================================================
// Use Case: VerifyEmail
// ============================================================
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITokenStore } from '../../infrastructure/cache/ITokenStore';
import { ValidationError, NotFoundError } from '@chess/errors';
import { logger } from '@chess/logger';

export class VerifyEmail {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(userId: string, token: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (user.isVerified) {
      throw new ValidationError('Email is already verified');
    }

    const isValid = await this.tokenStore.validateEmailVerificationToken(userId, token);
    if (!isValid) {
      throw new ValidationError('Invalid or expired verification code');
    }

    await this.userRepo.update(userId, { isVerified: true });
    await this.tokenStore.revokeEmailVerificationToken(userId);

    logger.info({ userId }, 'Email verified');
  }
}

// ============================================================
// Use Case: ForgotPassword
// ============================================================
import { IEmailService } from '../../infrastructure/email/IEmailService';

export class ForgotPassword {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenStore: ITokenStore,
    private readonly emailService: IEmailService,
  ) {}

  async execute(email: string): Promise<void> {
    // Always return 200 to prevent email enumeration attacks
    const user = await this.userRepo.findByEmail(email);
    if (!user) return;

    const { TokenService } = await import('./TokenService');
    const resetToken = TokenService.generateSecureToken();

    await this.tokenStore.storePasswordResetToken(user.id, resetToken);

    this.emailService.sendPasswordReset(user.email, user.username, user.id, resetToken).catch((err) => {
      logger.error({ err, userId: user.id }, 'Failed to send password reset email');
    });

    logger.info({ userId: user.id }, 'Password reset requested');
  }
}

// ============================================================
// Use Case: ResetPassword
// ============================================================
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export class ResetPassword {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(userId: string, token: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new ValidationError('Invalid reset link');

    const isValid = await this.tokenStore.validatePasswordResetToken(userId, token);
    if (!isValid) throw new ValidationError('Invalid or expired reset link');

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.userRepo.update(userId, { passwordHash });

    // Revoke reset token and ALL refresh tokens (force re-login on all devices)
    await this.tokenStore.revokePasswordResetToken(userId);
    await this.tokenStore.revokeAllRefreshTokens(userId);

    logger.info({ userId }, 'Password reset successfully');
  }
}
