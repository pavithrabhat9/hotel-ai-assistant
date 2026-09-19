import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Creates a middleware that validates request body against a Zod schema.
 * Returns field-level 400 errors, not generic "bad request".
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        fields[path] = issue.message;
      }

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body.',
          fields,
        },
      });
      return;
    }

    // Replace body with parsed/validated data
    req.body = result.data;
    next();
  };
}

// ─── Schemas ───

export const chatRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required.').max(100),
  message: z.string().min(1, 'Message cannot be empty.').max(2000, 'Message is too long (max 2000 chars).'),
});

export const availabilityRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required.').max(100),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in date must be in YYYY-MM-DD format.'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out date must be in YYYY-MM-DD format.'),
  adults: z.number().int().min(1, 'At least 1 adult is required.').max(10, 'For groups larger than 10, please contact us.'),
  children: z.number().int().min(0).default(0),
});
