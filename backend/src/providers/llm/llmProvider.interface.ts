/**
 * LLM Provider Interface — all concrete providers implement this.
 * Swappable behind this contract: OpenAI, Gemini, Anthropic, etc.
 */

export interface LLMMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface LLMToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface LLMResponse {
  text: string;
  toolCall?: LLMToolCall;
  finishReason: string;
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMProvider {
  /**
   * Send a conversation to the LLM and get a response.
   * May include tool definitions for function calling.
   */
  chat(
    systemPrompt: string,
    messages: LLMMessage[],
    tools?: LLMToolDefinition[],
  ): Promise<LLMResponse>;
}
