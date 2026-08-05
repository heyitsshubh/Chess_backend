// ============================================================
// Socket.IO JWT Authentication Middleware
//
// Intercepts socket connections, verifies the Bearer token
// attached in `auth.token`, and injects the user data into the 
// socket instance. If invalid, the connection is rejected.
// ============================================================
import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '@chess/logger';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  username: string;
  role: string;
}

// Extend Socket type to include our user data
export interface AuthenticatedSocket extends Socket {
  user: JwtPayload;
}

export function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      logger.warn({ socketId: socket.id }, 'Connection rejected: No token provided');
      return next(new Error('Authentication error: Token required'));
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    
    // Inject user data into socket object
    (socket as AuthenticatedSocket).user = decoded;
    
    logger.info({ socketId: socket.id, userId: decoded.sub }, 'Socket authenticated');
    next();
  } catch (error) {
    logger.warn({ socketId: socket.id, error }, 'Connection rejected: Invalid token');
    next(new Error('Authentication error: Invalid token'));
  }
}
