// ─── Frontend Types — mirrors backend contract ───

export type ResponseType = 'answer' | 'clarification' | 'availability_prompt' | 'availability_result' | 'fallback';

export interface SourceReference {
  topic: string;
  snippet: string;
}

export interface ToolCallResult {
  name: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
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
  status?: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface RoomResult {
  roomType: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  available: boolean;
}

export interface AvailabilityRequest {
  sessionId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

export interface AvailabilityResponse {
  available: boolean;
  rooms: RoomResult[];
  message: string;
  nights: number;
  checkIn: string;
  checkOut: string;
}

export interface TopicsResponse {
  hotelName: string;
  topics: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

// Local UI types
export interface Message {
  id: string;
  role: 'guest' | 'assistant';
  content: string;
  type?: ResponseType;
  sources?: SourceReference[];
  toolCall?: ToolCallResult;
  timestamp: number;
  isError?: boolean;
}
