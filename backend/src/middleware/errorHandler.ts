import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns structured JSON.
 * Never leaks stack traces to the client.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = (err as any).statusCode || 500;
  const code = (err as any).code || 'INTERNAL_ERROR';

  console.error(`[ErrorHandler] ${req.method} ${req.path}:`, {
    code,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    error: {
      code,
      message: statusCode === 500
        ? 'An internal error occurred. Please try again later.'
        : err.message,
    },
  });
}
