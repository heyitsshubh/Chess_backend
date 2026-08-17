// ============================================================
// Port: ITokenStore
//
// Defines all Redis token operations as an interface so that
// tests can inject a simple in-memory mock rather than needing
// a real Redis server running.
// ============================================================

export interface ITokenStore {
  // Refresh tokens
  storeRefreshToken(
    userId: string,
    tokenId: string,
    rawToken: string,
  ): Promise<void>;
  validateRefreshToken(userId: string, tokenId: string): Promise<boolean>;
  revokeRefreshToken(userId: string, tokenId: string): Promise<void>;
  revokeAllRefreshTokens(userId: string): Promise<void>;

  // Email verification
  storeEmailVerificationToken(userId: string, otp: string): Promise<void>;
  validateEmailVerificationToken(userId: string, otp: string): Promise<boolean>;
  revokeEmailVerificationToken(userId: string): Promise<void>;

  // Password reset
  storePasswordResetToken(userId: string, token: string): Promise<void>;
  validatePasswordResetToken(userId: string, token: string): Promise<boolean>;
  revokePasswordResetToken(userId: string): Promise<void>;
}
