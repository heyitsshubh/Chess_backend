// ============================================================
// Port: IEmailService
// ============================================================
export interface IEmailService {
  sendEmailVerification(to: string, username: string, otp: string): Promise<void>;
  sendPasswordReset(to: string, username: string, userId: string, token: string): Promise<void>;
}
