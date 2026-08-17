// ============================================================
// Authentication Middleware
//
// Extracts and verifies the Bearer JWT from Authorization header.
// Attaches the decoded payload to req.user for downstream use.
// ============================================================
import { Request, Response, NextFunction } from "express";
import {
  TokenService,
  JwtPayload,
} from "../../application/use-cases/TokenService";
import { UnauthorizedError, ForbiddenError } from "@chess/errors";
import { UserRole } from "../../domain/entities/User";

// Extend Express Request type to include our user payload
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new UnauthorizedError("Missing or malformed Authorization header"),
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = TokenService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
}

// RBAC middleware — use after authenticate
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new UnauthorizedError("Not authenticated"));

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }

    next();
  };
}
