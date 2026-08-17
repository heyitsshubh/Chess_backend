// ============================================================
// Use Case: LoginUser
// ============================================================
import bcrypt from "bcryptjs";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ITokenStore } from "../../infrastructure/cache/ITokenStore";
import { TokenService, TokenPair } from "./TokenService";
import { LoginDtoType } from "../dtos/auth.dto";
import { UnauthorizedError } from "@chess/errors";
import { logger } from "@chess/logger";

export class LoginUser {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenStore: ITokenStore,
  ) {}

  async execute(
    dto: LoginDtoType,
  ): Promise<{ tokens: TokenPair; userId: string }> {
    // 1. Find user by email
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user) {
      // Use same error message to prevent email enumeration attacks
      throw new UnauthorizedError("Invalid email or password");
    }

    // 2. Check user can login with password (not OAuth-only)
    if (!user.canLoginWithPassword()) {
      throw new UnauthorizedError("Please login using your social account");
    }

    // 3. Verify password using constant-time comparison (bcrypt)
    const isValidPassword = await bcrypt.compare(
      dto.password,
      user.passwordHash!,
    );
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // 4. Generate access + refresh token pair
    const tokens = TokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    });

    // 5. Store hashed refresh token in Redis (7d TTL)
    await this.tokenStore.storeRefreshToken(
      user.id,
      tokens.refreshTokenId,
      tokens.refreshToken,
    );

    logger.info({ userId: user.id }, "User logged in");

    return { tokens, userId: user.id };
  }
}
