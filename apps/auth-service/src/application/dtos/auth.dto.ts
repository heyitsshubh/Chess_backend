// ============================================================
// DTOs - Data Transfer Objects with Zod validation
//
// Why Zod for validation?
// Zod provides runtime type safety AND TypeScript type inference
// from the same schema. This means no duplication — one schema
// serves both runtime validation and TypeScript types.
// All user input MUST be validated at the boundary (controller)
// before it enters the application layer.
// ============================================================
import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const LoginDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const VerifyEmailDto = z.object({
  userId: z.string().cuid(),
  token: z.string().min(1),
});

export const ForgotPasswordDto = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordDto = z.object({
  userId: z.string().cuid(),
  token: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1),
});

// Inferred TypeScript types from Zod schemas
export type RegisterDtoType = z.infer<typeof RegisterDto>;
export type LoginDtoType = z.infer<typeof LoginDto>;
export type VerifyEmailDtoType = z.infer<typeof VerifyEmailDto>;
export type ForgotPasswordDtoType = z.infer<typeof ForgotPasswordDto>;
export type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>;
export type RefreshTokenDtoType = z.infer<typeof RefreshTokenDto>;
