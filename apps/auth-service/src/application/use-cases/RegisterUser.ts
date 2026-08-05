// ============================================================
// Use Case: RegisterUser
//
// Why use cases?
// Use cases implement the application's business rules. Each 
// use case has a single responsibility and is orchestrated by 
// the controller. This makes them independently testable 
// without spinning up Express or a real database.
// ============================================================
import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITokenStore } from '../../infrastructure/cache/ITokenStore';
import { IEmailService } from '../../infrastructure/email/IEmailService';
import { TokenService } from './TokenService';
import { RegisterDtoType } from '../dtos/auth.dto';
import { ValidationError } from '@chess/errors';
import { logger } from '@chess/logger';

const BCRYPT_ROUNDS = 12;

export class RegisterUser {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenStore: ITokenStore,
    private readonly emailService: IEmailService,
  ) {}

  async execute(dto: RegisterDtoType) {
    // 1. Check for duplicate email
    if (await this.userRepo.existsByEmail(dto.email)) {
      throw new ValidationError('An account with this email already exists');
    }

    // 2. Check for duplicate username
    if (await this.userRepo.existsByUsername(dto.username)) {
      throw new ValidationError('This username is already taken');
    }

    // 3. Hash password (cost factor 12 = ~400ms, secure against brute force)
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // 4. Create user in database
    const user = await this.userRepo.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
    });

    logger.info({ userId: user.id, email: user.email }, 'New user registered');

    // 5. Generate email verification OTP and store in Redis (24h TTL)
    const otp = TokenService.generateOtp();
    await this.tokenStore.storeEmailVerificationToken(user.id, otp);

    // 6. Send verification email (fire and forget — don't block response)
    this.emailService.sendEmailVerification(user.email, user.username, otp).catch((err) => {
      logger.error({ err, userId: user.id }, 'Failed to send verification email');
    });

    return user.toPublic();
  }
}
