// ============================================================
// Port: IUserRepository
//
// Why an interface (port)?
// This is the core of Hexagonal Architecture. The domain layer
// defines WHAT it needs (the interface/port), and the
// infrastructure layer provides HOW it's done (adapter).
// This means we can swap Prisma for TypeORM, MongoDB, or even
// an in-memory store for tests — without changing any
// application logic.
// ============================================================
import { User } from "../entities/User";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(data: {
    email: string;
    username: string;
    passwordHash: string | null;
  }): Promise<User>;
  update(
    id: string,
    data: Partial<Pick<User, "isVerified" | "passwordHash">>,
  ): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
}
