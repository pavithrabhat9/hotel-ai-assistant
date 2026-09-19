import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request logging middleware.
 * Logs request method, path, duration, and request ID.
 * Does NOT log full prompts or guest PII by default.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4().slice(0, 8);
  const start = Date.now();

  // Attach requestId for downstream use
  (req as any).requestId = requestId;

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      // Log classified intent if set by the controller
      intent: (req as any).classifiedIntent || undefined,
      // Log whether a tool was called
      toolCalled: (req as any).toolCalled || undefined,
    };

    if (res.statusCode >= 400) {
      console.warn('[Request]', JSON.stringify(logEntry));
    } else {
      console.log('[Request]', JSON.stringify(logEntry));
    }
  });

  next();
}
