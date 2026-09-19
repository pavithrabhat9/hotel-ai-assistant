import { Request, Response, NextFunction } from 'express';
import { orchestratorService } from '../services/orchestrator.service';
import { knowledgeBaseService } from '../services/knowledgeBase.service';
import { ChatRequest } from '../types/chat.types';

/**
 * Chat controller — HTTP concerns only.
 * Parses request, calls the orchestrator, maps result to status code.
 */
export class ChatController {
  /**
   * POST /api/chat
   * Accepts a guest question and returns an AI response.
   */
  async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, message } = req.body as ChatRequest;

      // Attach intent info for structured logging
      (req as any).classifiedIntent = 'chat';

      const response = await orchestratorService.handleMessage(sessionId, message);

      // Log if a tool was called
      if (response.reply.toolCall) {
        (req as any).toolCalled = response.reply.toolCall.name;
        (req as any).classifiedIntent = 'availability';
      } else {
        (req as any).classifiedIntent = response.type;
      }

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/topics
   * Returns quick-start topics and hotel name for the frontend.
   */
  async getTopics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topics = knowledgeBaseService.getQuickStartTopics();
      const hotelName = knowledgeBaseService.getHotelName();

      res.status(200).json({
        hotelName,
        topics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
