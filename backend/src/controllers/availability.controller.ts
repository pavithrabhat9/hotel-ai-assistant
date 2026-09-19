import { Request, Response, NextFunction } from 'express';
import { availabilityService } from '../services/availability.service';
import { AvailabilityRequest } from '../types/availability.types';
import { conversationService } from '../services/conversation.service';

/**
 * Availability controller — direct availability check endpoint.
 * Used by the frontend's StayDetailsPanel for structured form submissions.
 */
export class AvailabilityController {
  /**
   * POST /api/availability
   * Checks room availability for given dates and guest count.
   */
  async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = req.body as AvailabilityRequest;

      (req as any).classifiedIntent = 'availability_direct';
      (req as any).toolCalled = 'checkAvailability';

      const { response, errors } = availabilityService.check(request);

      if (errors && errors.length > 0) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid availability request.',
            fields: Object.fromEntries(errors.map(e => [e.field, e.message])),
          },
        });
        return;
      }

      if (response) {
        // Store the availability check in conversation history
        conversationService.ensureSession(request.sessionId);
        conversationService.addMessage(
          request.sessionId,
          'guest',
          `Check availability: ${request.checkIn} to ${request.checkOut}, ${request.adults} adults${request.children ? `, ${request.children} children` : ''}`
        );
        conversationService.addMessage(
          request.sessionId,
          'assistant',
          availabilityService.formatResultSummary(response)
        );

        res.status(200).json(response);
        return;
      }

      res.status(500).json({
        error: {
          code: 'AVAILABILITY_CHECK_FAILED',
          message: 'Unable to check availability at this time.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
