// ============================================================
// Unit Tests: RegisterUser Use Case
//
// We mock ALL external dependencies (repo, tokenStore, email)
// so these tests run in milliseconds with no I/O.
// ============================================================
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUser } from '../src/application/use-cases/RegisterUser';
import { ValidationError } from '@chess/errors';
import { User, UserRole } from '../src/domain/entities/User';
import { IUserRepository } from '../src/domain/repositories/IUserRepository';
import { ITokenStore } from '../src/infrastructure/cache/ITokenStore';
import { IEmailService } from '../src/infrastructure/email/IEmailService';

// Helper to create a mock user
function makeMockUser(overrides: Partial<User> = {}): User {
  return new User({
    id: 'test-id',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2a$12$hashedpassword',
    role: UserRole.USER,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('RegisterUser Use Case', () => {
  let mockUserRepo: IUserRepository;
  let mockTokenStore: ITokenStore;
  let mockEmailService: IEmailService;
  let registerUser: RegisterUser;

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      create: vi.fn().mockResolvedValue(makeMockUser()),
      update: vi.fn(),
      existsByEmail: vi.fn().mockResolvedValue(false),
      existsByUsername: vi.fn().mockResolvedValue(false),
    };

    mockTokenStore = {
      storeRefreshToken: vi.fn(),
      validateRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
      revokeAllRefreshTokens: vi.fn(),
      storeEmailVerificationToken: vi.fn().mockResolvedValue(undefined),
      validateEmailVerificationToken: vi.fn(),
      revokeEmailVerificationToken: vi.fn(),
      storePasswordResetToken: vi.fn(),
      validatePasswordResetToken: vi.fn(),
      revokePasswordResetToken: vi.fn(),
    };

    mockEmailService = {
      sendEmailVerification: vi.fn().mockResolvedValue(undefined),
      sendPasswordReset: vi.fn().mockResolvedValue(undefined),
    };

    registerUser = new RegisterUser(mockUserRepo, mockTokenStore, mockEmailService);
  });

  it('should successfully register a new user', async () => {
    const result = await registerUser.execute({
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password1',
    });

    expect(result).toBeDefined();
    expect(result.email).toBe('test@example.com');
    expect(mockUserRepo.create).toHaveBeenCalledOnce();
    expect(mockTokenStore.storeEmailVerificationToken).toHaveBeenCalledOnce();
  });

  it('should throw ValidationError if email already exists', async () => {
    (mockUserRepo.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await expect(
      registerUser.execute({
        email: 'existing@example.com',
        username: 'newuser',
        password: 'Password1',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError if username already exists', async () => {
    (mockUserRepo.existsByUsername as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await expect(
      registerUser.execute({
        email: 'new@example.com',
        username: 'existinguser',
        password: 'Password1',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
