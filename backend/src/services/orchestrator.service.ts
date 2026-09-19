import { ChatResponse, SourceReference, ResponseType } from '../types/chat.types';
import { LLMProvider, LLMMessage, LLMToolDefinition } from '../providers/llm/llmProvider.interface';
import { createLLMProvider } from '../providers/llm/providerFactory';
import { knowledgeBaseService } from './knowledgeBase.service';
import { availabilityService } from './availability.service';
import { conversationService } from './conversation.service';
import { env } from '../config/env';

// ─── System Prompt ───
const SYSTEM_PROMPT = `You are the AI guest assistant for Simplotel Grand Hotel & Spa, a 5-star luxury hotel in Mumbai, India.

STRICT RULES:
1. You MUST answer ONLY from the provided hotel context below. NEVER use your general knowledge about hotels, policies, or Mumbai.
2. If the answer is NOT in the provided context, respond with: "I don't have specific information about that. Please contact our front desk at +91-22-6789-0000 or email reservations@grandhorizon.in for assistance."
3. NEVER invent, guess, or fabricate any information — prices, policies, timings, or amenities.
4. When quoting prices or timings, use EXACTLY the values from the context. Do not round, estimate, or adjust.
5. If a guest asks about room availability or wants to book/check dates, call the checkAvailability function with the required parameters.
6. If the guest mentions wanting to check availability but doesn't provide all required details (check-in date, check-out date, number of adults), ask for the missing information. Do NOT guess dates or guest counts.
7. Be warm, professional, and concise. Use natural hotel-concierge language.
8. When referencing a specific policy or fact, mention which topic area it comes from (e.g., "Per our cancellation policy...").
9. For follow-up questions, use the conversation context to understand what the guest is referring to.
10. DO NOT use any markdown formatting (like **bolding** or *italics*) in your responses. Use plain text only.

IMPORTANT: You are NOT a general-purpose assistant. You ONLY know about Simplotel Grand Hotel & Spa. If asked about other hotels, external services, or topics outside the hotel, politely decline.`;

// ─── Tool Definition for Function Calling ───
const AVAILABILITY_TOOL: LLMToolDefinition = {
  name: 'checkAvailability',
  description: 'Check room availability at Simplotel Grand Hotel. Call this when a guest wants to know if rooms are available for specific dates. Requires check-in date, check-out date, and number of adult guests.',
  parameters: {
    properties: {
      checkIn: {
        type: 'string',
        description: 'Check-in date in YYYY-MM-DD format',
      },
      checkOut: {
        type: 'string',
        description: 'Check-out date in YYYY-MM-DD format',
      },
      adults: {
        type: 'number',
        description: 'Number of adult guests',
      },
      children: {
        type: 'number',
        description: 'Number of children (optional, defaults to 0)',
      },
    },
    required: ['checkIn', 'checkOut', 'adults'],
  },
};

class OrchestratorService {
  private llmProvider: LLMProvider;

  constructor() {
    this.llmProvider = createLLMProvider(env.GEMINI_API_KEY);
  }

  /**
   * Main orchestration flow:
   * 1. Retrieve relevant KB entries
   * 2. Send to LLM with function calling enabled
   * 3. If LLM calls checkAvailability → execute deterministically, template the result
   * 4. If LLM responds with text → return with source references
   * 5. If KB has no match → skip LLM, return fallback directly
   */
  async handleMessage(sessionId: string, message: string): Promise<ChatResponse> {
    // Ensure session exists and store the guest message
    conversationService.ensureSession(sessionId);
    conversationService.addMessage(sessionId, 'guest', message);

    try {
      // Step 1: Retrieve relevant KB entries
      const kbEntries = knowledgeBaseService.search(message);
      const kbContext = knowledgeBaseService.formatAsContext(kbEntries);

      // Step 2: Build the conversation for the LLM
      const history = conversationService.getHistory(sessionId);
      const llmMessages: LLMMessage[] = [];

      // Add conversation history (last 10 messages for context)
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        llmMessages.push({
          role: msg.role === 'guest' ? 'user' : 'model',
          content: msg.content,
        });
      }

      // Build the system prompt with KB context
      const contextualPrompt = kbContext
        ? `${SYSTEM_PROMPT}\n\n--- HOTEL KNOWLEDGE BASE CONTEXT ---\n${kbContext}\n--- END CONTEXT ---`
        : `${SYSTEM_PROMPT}\n\n--- HOTEL KNOWLEDGE BASE CONTEXT ---\nNo relevant information found in the knowledge base for this query.\n--- END CONTEXT ---`;

      // Step 3: Call the LLM with function calling
      const llmResponse = await this.llmProvider.chat(
        contextualPrompt,
        llmMessages,
        [AVAILABILITY_TOOL],
      );

      // Step 4: Handle tool call
      if (llmResponse.toolCall && llmResponse.toolCall.name === 'checkAvailability') {
        return this.handleAvailabilityToolCall(sessionId, llmResponse.toolCall.args);
      }

      // Step 5: Handle text response
      if (llmResponse.text) {
        const sources: SourceReference[] = kbEntries.map(entry => ({
          topic: entry.topic,
          snippet: entry.content.substring(0, 150) + (entry.content.length > 150 ? '…' : ''),
        }));

        // Determine response type
        const responseType = this.classifyResponseType(llmResponse.text, kbEntries);

        // Store assistant response
        conversationService.addMessage(sessionId, 'assistant', llmResponse.text);

        return {
          sessionId,
          type: responseType,
          reply: {
            text: llmResponse.text,
            sources: responseType === 'fallback' ? [] : sources,
          },
        };
      }

      // No response from LLM — return fallback
      return this.createFallback(sessionId);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Orchestrator] Error processing message for session ${sessionId}:`, errMsg);
      return this.createFallback(sessionId, errMsg);
    }
  }

  /**
   * Handle checkAvailability tool call.
   * The LLM identified the intent; we execute deterministically.
   */
  private handleAvailabilityToolCall(
    sessionId: string,
    args: Record<string, unknown>,
  ): ChatResponse {
    const request = {
      sessionId,
      checkIn: String(args.checkIn || ''),
      checkOut: String(args.checkOut || ''),
      adults: Number(args.adults || 1),
      children: Number(args.children || 0),
    };

    const { response, errors } = availabilityService.check(request);

    if (errors && errors.length > 0) {
      // Validation failed — ask for corrections
      const errorMsg = errors.map(e => `• ${e.field}: ${e.message}`).join('\n');
      const text = `I'd like to check availability for you, but I need a few corrections:\n\n${errorMsg}\n\nCould you please provide the correct details?`;
      
      conversationService.addMessage(sessionId, 'assistant', text);

      return {
        sessionId,
        type: 'clarification',
        reply: {
          text,
          sources: [],
        },
      };
    }

    if (response) {
      // Format the result using our template — not the LLM
      const formattedResult = availabilityService.formatResultSummary(response);
      conversationService.addMessage(sessionId, 'assistant', formattedResult);

      return {
        sessionId,
        type: 'availability_result',
        reply: {
          text: formattedResult,
          sources: [],
          toolCall: {
            name: 'checkAvailability',
            args: request as unknown as Record<string, unknown>,
            result: response as unknown as Record<string, unknown>,
          },
        },
      };
    }

    return this.createFallback(sessionId);
  }

  /**
   * Classify the response type based on content and KB matches.
   */
  private classifyResponseType(text: string, kbEntries: { topic: string; content: string }[]): ResponseType {
    const lowerText = text.toLowerCase();

    // Check if it's a fallback (no info found)
    if (
      lowerText.includes("don't have specific information") ||
      lowerText.includes("contact our front desk") ||
      lowerText.includes("i'm not sure about that") ||
      kbEntries.length === 0
    ) {
      return 'fallback';
    }

    // Check if asking for availability details
    if (
      lowerText.includes('check-in date') ||
      lowerText.includes('check-out date') ||
      lowerText.includes('how many guests') ||
      lowerText.includes('number of guests') ||
      lowerText.includes('what dates')
    ) {
      return 'availability_prompt';
    }

    // Check if asking for clarification
    if (
      lowerText.includes('could you clarify') ||
      lowerText.includes('could you provide') ||
      lowerText.includes('can you specify') ||
      lowerText.includes('what do you mean')
    ) {
      return 'clarification';
    }

    return 'answer';
  }

  /**
   * Create a graceful fallback response.
   */
  private createFallback(sessionId: string, errorDetail?: string): ChatResponse {
    const text = "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or contact our front desk directly at +91-22-6789-0000 for immediate assistance.";
    
    if (errorDetail) {
      console.error(`[Orchestrator] Fallback triggered for session ${sessionId}: ${errorDetail}`);
    }

    conversationService.addMessage(sessionId, 'assistant', text);

    return {
      sessionId,
      type: 'fallback',
      reply: {
        text,
        sources: [],
      },
    };
  }
}

export const orchestratorService = new OrchestratorService();
