// ============================================================
// Resend Email Service Adapter
//
// Uses Resend SDK for transactional emails.
// HTML templates are inline — for a production system,
// move them to a template engine (Handlebars, MJML, etc.)
// ============================================================
import { Resend } from "resend";
import { IEmailService } from "./IEmailService";
import { env } from "../../config/env";
import { logger } from "@chess/logger";

export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendEmailVerification(
    to: string,
    username: string,
    otp: string,
  ): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: "Verify your Chess Platform account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Welcome to Chess Platform, ${username}!</h1>
          <p>Your email verification code is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${otp}</span>
          </div>
          <p style="color: #666;">This code expires in 24 hours.</p>
          <p style="color: #666; font-size: 12px;">If you didn't create an account, you can ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      logger.error({ error, to }, "Resend email verification failed");
      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  async sendPasswordReset(
    to: string,
    username: string,
    userId: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${env.APP_URL}/auth/reset-password?userId=${userId}&token=${token}`;

    const { error } = await this.resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: "Reset your Chess Platform password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Password Reset Request</h1>
          <p>Hi ${username}, we received a request to reset your password.</p>
          <a href="${resetUrl}" style="
            display: inline-block;
            background: #4a90d9;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          ">Reset Password</a>
          <p style="color: #666;">This link expires in 15 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email. Your password won't change.</p>
        </div>
      `,
    });

    if (error) {
      logger.error({ error, to }, "Resend password reset email failed");
      throw new Error(`Email send failed: ${error.message}`);
    }
  }
}
