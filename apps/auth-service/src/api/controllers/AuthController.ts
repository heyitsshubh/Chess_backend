// ============================================================
// Auth Controller
//
// Thin layer: parse request → call use case → format response.
// NO business logic here. Controllers only orchestrate.
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { RegisterUser } from '../../application/use-cases/RegisterUser';
import { LoginUser } from '../../application/use-cases/LoginUser';
import { RefreshToken } from '../../application/use-cases/RefreshToken';
import { VerifyEmail, ForgotPassword, ResetPassword } from '../../application/use-cases/EmailAuth';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../../application/dtos/auth.dto';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITokenStore } from '../../infrastructure/cache/ITokenStore';
import { IEmailService } from '../../infrastructure/email/IEmailService';

export class AuthController {
  private readonly registerUser: RegisterUser;
  private readonly loginUser: LoginUser;
  private readonly refreshToken: RefreshToken;
  private readonly verifyEmail: VerifyEmail;
  private readonly forgotPassword: ForgotPassword;
  private readonly resetPassword: ResetPassword;

  constructor(
    userRepo: IUserRepository,
    tokenStore: ITokenStore,
    emailService: IEmailService,
  ) {
    this.registerUser = new RegisterUser(userRepo, tokenStore, emailService);
    this.loginUser = new LoginUser(userRepo, tokenStore);
    this.refreshToken = new RefreshToken(userRepo, tokenStore);
    this.verifyEmail = new VerifyEmail(userRepo, tokenStore);
    this.forgotPassword = new ForgotPassword(userRepo, tokenStore, emailService);
    this.resetPassword = new ResetPassword(userRepo, tokenStore);
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RegisterDto.parse(req.body);
      const user = await this.registerUser.execute(dto);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LoginDto.parse(req.body);
      const { tokens, userId } = await this.loginUser.execute(dto);

      // Store refresh token in HTTP-only cookie for XSS protection
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          userId,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawToken = req.cookies?.refreshToken as string | undefined;
      if (!rawToken) {
        res.status(401).json({ success: false, error: { message: 'Refresh token not found' } });
        return;
      }

      const tokens = await this.refreshToken.execute(rawToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({ success: true, data: { accessToken: tokens.accessToken } });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // The token will have been validated by authenticate middleware
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  };

  verifyEmailHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = VerifyEmailDto.parse(req.body);
      await this.verifyEmail.execute(dto.userId, dto.token);
      res.json({ success: true, message: 'Email verified successfully' });
    } catch (err) {
      next(err);
    }
  };

  forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ForgotPasswordDto.parse(req.body);
      await this.forgotPassword.execute(dto.email);
      // Always return the same message to prevent email enumeration
      res.json({ success: true, message: 'If this email exists, a reset link has been sent' });
    } catch (err) {
      next(err);
    }
  };

  resetPasswordHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ResetPasswordDto.parse(req.body);
      await this.resetPassword.execute(dto.userId, dto.token, dto.newPassword);
      res.clearCookie('refreshToken');
      res.json({ success: true, message: 'Password reset successfully. Please log in.' });
    } catch (err) {
      next(err);
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    // req.user is set by authenticate middleware
    res.json({ success: true, data: req.user });
  };
}
