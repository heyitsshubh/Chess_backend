// ============================================================
// Global Error Handler Middleware
//
// This is Express's 4-argument error handler. It must be
// registered LAST in the middleware chain. It catches all
// errors thrown or passed to next() and returns consistent
// JSON error responses. Never expose stack traces in production.
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@chess/errors';
import { logger } from '@chess/logger';
import { ZodError } from 'zod';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, path: req.path }, 'Non-operational AppError');
    }
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.name,
        message: err.message,
      },
    });
    return;
  }

  // Unknown/unexpected errors — log in full, hide from client
  logger.error({ err, path: req.path, method: req.method }, 'Unexpected error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
