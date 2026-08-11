// ============================================================
// Use Case: RefreshToken
//
// Why token rotation?
// On every refresh, the old token is immediately invalidated
// and a new pair is issued. This limits the damage window if
// a refresh token is stolen — the attacker has at most one use
// before it's revoked. This is called "rotating refresh tokens".
// ============================================================
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ITokenStore } from "../../infrastructure/cache/ITokenStore";
import { TokenService, TokenPair } from "./TokenService";
import { UnauthorizedError } from "@chess/errors";
import { logger } from "@chess/logger";

export class RefreshToken {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(rawRefreshToken: string): Promise<TokenPair> {
    // 1. Verify JWT signature (checks expiry too)
    let payload;
    try {
      payload = TokenService.verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // 2. Check token exists in Redis (wasn't already used or revoked)
    const isValid = await this.tokenStore.validateRefreshToken(
      payload.sub,
      payload.tokenId,
    );
    if (!isValid) {
      // Possible token reuse attack — revoke ALL tokens for this user
      logger.warn(
        { userId: payload.sub },
        "Possible refresh token reuse detected — revoking all tokens",
      );
      await this.tokenStore.revokeAllRefreshTokens(payload.sub);
      throw new UnauthorizedError(
        "Refresh token reuse detected. Please login again.",
      );
    }

    // 3. Revoke the old token immediately (rotation)
    await this.tokenStore.revokeRefreshToken(payload.sub, payload.tokenId);

    // 4. Fetch fresh user data (in case role changed since last login)
    const user = await this.userRepo.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError("User no longer exists");
    }

    // 5. Issue new token pair
    const newTokens = TokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    await this.tokenStore.storeRefreshToken(
      user.id,
      newTokens.refreshTokenId,
      newTokens.refreshToken,
    );

    logger.info({ userId: user.id }, "Refresh token rotated");

    return newTokens;
  }
}
