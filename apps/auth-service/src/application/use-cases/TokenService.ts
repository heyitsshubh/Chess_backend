// ============================================================
// Token Service
//
// Why a dedicated token service?
// Token logic (signing, verifying, hashing) is shared across
// multiple use cases (login, refresh, verify). Centralizing it
// avoids duplication and makes it easy to rotate secrets or
// change algorithm in one place.
// ============================================================
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { env } from '../../config/env';
import { UserRole } from '../../domain/entities/User';

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  username: string;
  role: UserRole;
  tokenId: string;   // unique per token for revocation
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
}

export class TokenService {
  static generateTokenPair(payload: Omit<JwtPayload, 'tokenId'>): TokenPair {
    const tokenId = uuidv4();

    const accessToken = jwt.sign(
      { ...payload, tokenId },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { ...payload, tokenId },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );

    return { accessToken, refreshToken, refreshTokenId: tokenId };
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  }

  // Hash tokens before storing in Redis — if Redis is breached,
  // raw tokens cannot be used directly.
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // Generate a short numeric OTP for email verification
  static generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate a secure random token for password reset
  static generateSecureToken(): string {
    return uuidv4().replace(/-/g, '');
  }
}
