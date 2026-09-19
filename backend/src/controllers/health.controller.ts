import { Request, Response } from 'express';

/**
 * Health check controller.
 */
export class HealthController {
  check(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'ok',
      service: 'hotel-guest-assistant-backend',
      timestamp: new Date().toISOString(),
    });
  }
}

export const healthController = new HealthController();
