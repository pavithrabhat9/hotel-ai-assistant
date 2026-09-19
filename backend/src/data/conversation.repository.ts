import { ChatMessage } from '../types/chat.types';

interface ConversationSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: number;
  lastActivityAt: number;
}

class ConversationRepository {
  private sessions: Map<string, ConversationSession> = new Map();

  // Auto-cleanup sessions older than 2 hours
  private readonly SESSION_TTL_MS = 2 * 60 * 60 * 1000;

  constructor() {
    // Periodic cleanup every 30 minutes
    setInterval(() => this.cleanup(), 30 * 60 * 1000);
  }

  getSession(sessionId: string): ConversationSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityAt = Date.now();
    }
    return session;
  }

  createSession(sessionId: string): ConversationSession {
    const session: ConversationSession = {
      sessionId,
      messages: [],
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  addMessage(sessionId: string, message: ChatMessage): void {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
    }
    session.messages.push(message);
    session.lastActivityAt = Date.now();

    // Keep last 20 messages to bound context size
    if (session.messages.length > 20) {
      session.messages = session.messages.slice(-20);
    }
  }

  getMessages(sessionId: string): ChatMessage[] {
    const session = this.sessions.get(sessionId);
    return session ? [...session.messages] : [];
  }

  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivityAt > this.SESSION_TTL_MS) {
        this.sessions.delete(id);
      }
    }
  }
}

// Singleton
export const conversationRepository = new ConversationRepository();
