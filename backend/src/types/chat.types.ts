// ─── Chat Types ───

export type MessageRole = 'guest' | 'assistant' | 'system';

export type ResponseType = 'answer' | 'clarification' | 'availability_prompt' | 'availability_result' | 'fallback';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface SourceReference {
  topic: string;
  snippet: string;
}

export interface ToolCallResult {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface ChatReply {
  text: string;
  sources: SourceReference[];
  toolCall?: ToolCallResult;
}

export interface ChatResponse {
  sessionId: string;
  type: ResponseType;
  reply: ChatReply;
  status?: string; // e.g. "Checking availability for Oct 12–14…"
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}
