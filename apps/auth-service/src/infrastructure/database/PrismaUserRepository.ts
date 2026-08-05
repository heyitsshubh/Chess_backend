// ============================================================
// Prisma User Repository (Adapter)
//
// Implements IUserRepository using Prisma ORM.
// Maps Prisma models to domain entities so the domain layer
// never imports from @prisma/client directly.
// ============================================================
import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, UserRole } from '../../domain/entities/User';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toDomain(raw: {
    id: string;
    email: string;
    username: string;
    passwordHash: string | null;
    role: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User({
      ...raw,
      role: raw.role as UserRole,
    });
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email } });
    return raw ? this.toDomain(raw) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { username } });
    return raw ? this.toDomain(raw) : null;
  }

  async create(data: { email: string; username: string; passwordHash: string | null }): Promise<User> {
    const raw = await this.prisma.user.create({ data });
    return this.toDomain(raw);
  }

  async update(id: string, data: Partial<Pick<User, 'isVerified' | 'passwordHash'>>): Promise<User> {
    const raw = await this.prisma.user.update({ where: { id }, data });
    return this.toDomain(raw);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { username } });
    return count > 0;
  }
}
