// ============================================================
// Domain Entity: User
//
// Why a domain entity separate from the Prisma model?
// The Prisma model is an infrastructure concern — it maps to
// database columns. The domain entity is the pure business
// object. By keeping them separate:
// 1. Business logic never leaks into infrastructure
// 2. We can change ORM without touching domain logic
// 3. The entity can have business methods (isVerified, etc.)
// ============================================================

export enum UserRole {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
}

export interface UserProps {
  id: string;
  email: string;
  username: string;
  passwordHash: string | null;
  role: UserRole;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  public readonly id: string;
  public readonly email: string;
  public readonly username: string;
  public readonly passwordHash: string | null;
  public readonly role: UserRole;
  public readonly isVerified: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.username = props.username;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.isVerified = props.isVerified;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  // Business rule: only users with a password hash can login via email
  public canLoginWithPassword(): boolean {
    return this.passwordHash !== null;
  }

  // Returns a safe public representation (no password hash)
  public toPublic(): Omit<UserProps, "passwordHash"> {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      role: this.role,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
