import { conversationRepository } from '../data/conversation.repository';
import { ChatMessage } from '../types/chat.types';

class ConversationService {
  /**
   * Get conversation history for a session.
   */
  getHistory(sessionId: string): ChatMessage[] {
    return conversationRepository.getMessages(sessionId);
  }

  /**
   * Add a message to the session history.
   */
  addMessage(sessionId: string, role: ChatMessage['role'], content: string): void {
    conversationRepository.addMessage(sessionId, {
      role,
      content,
      timestamp: Date.now(),
    });
  }

  /**
   * Ensure session exists, creating if needed.
   */
  ensureSession(sessionId: string): void {
    if (!conversationRepository.getSession(sessionId)) {
      conversationRepository.createSession(sessionId);
    }
  }
}

export const conversationService = new ConversationService();
