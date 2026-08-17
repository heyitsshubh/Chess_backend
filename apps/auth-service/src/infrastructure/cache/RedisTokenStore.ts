// ============================================================
// Redis Token Store (Adapter)
//
// Implements ITokenStore using Redis. Key design decisions:
// - Refresh tokens: stored hashed, keyed by userId:tokenId
//   This allows: validate specific token, revoke specific token,
//   OR revoke all tokens for a user (pattern delete)
// - Email OTP: simple key-value with TTL
// - Password reset: simple key-value with short TTL (15 min)
// ============================================================
import { Redis } from "ioredis";
import { createHash } from "crypto";
import { ITokenStore } from "./ITokenStore";

const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const EMAIL_VERIFY_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const PWD_RESET_TTL_SECONDS = 60 * 15; // 15 minutes

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export class RedisTokenStore implements ITokenStore {
  constructor(private readonly redis: Redis) {}

  // Refresh tokens
  async storeRefreshToken(
    userId: string,
    tokenId: string,
    rawToken: string,
  ): Promise<void> {
    const key = `refresh:${userId}:${tokenId}`;
    const hashed = hashValue(rawToken);
    await this.redis.set(key, hashed, "EX", REFRESH_TTL_SECONDS);
  }

  async validateRefreshToken(
    userId: string,
    tokenId: string,
  ): Promise<boolean> {
    const key = `refresh:${userId}:${tokenId}`;
    const stored = await this.redis.get(key);
    return stored !== null;
  }

  async revokeRefreshToken(userId: string, tokenId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}:${tokenId}`);
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    // Scan for all keys matching this user's refresh tokens
    const keys = await this.redis.keys(`refresh:${userId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Email verification
  async storeEmailVerificationToken(
    userId: string,
    otp: string,
  ): Promise<void> {
    await this.redis.set(
      `email-verify:${userId}`,
      otp,
      "EX",
      EMAIL_VERIFY_TTL_SECONDS,
    );
  }

  async validateEmailVerificationToken(
    userId: string,
    otp: string,
  ): Promise<boolean> {
    const stored = await this.redis.get(`email-verify:${userId}`);
    return stored === otp;
  }

  async revokeEmailVerificationToken(userId: string): Promise<void> {
    await this.redis.del(`email-verify:${userId}`);
  }

  // Password reset
  async storePasswordResetToken(userId: string, token: string): Promise<void> {
    const hashed = hashValue(token);
    await this.redis.set(
      `pwd-reset:${userId}`,
      hashed,
      "EX",
      PWD_RESET_TTL_SECONDS,
    );
  }

  async validatePasswordResetToken(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const stored = await this.redis.get(`pwd-reset:${userId}`);
    if (!stored) return false;
    return stored === hashValue(token);
  }

  async revokePasswordResetToken(userId: string): Promise<void> {
    await this.redis.del(`pwd-reset:${userId}`);
  }
}
