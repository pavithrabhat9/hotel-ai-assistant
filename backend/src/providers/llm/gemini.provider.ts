import { GoogleGenerativeAI, Content, Part, Tool, SchemaType } from '@google/generative-ai';
import { LLMProvider, LLMMessage, LLMResponse, LLMToolDefinition } from './llmProvider.interface';

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName: string = 'gemini-3.6-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async chat(
    systemPrompt: string,
    messages: LLMMessage[],
    tools?: LLMToolDefinition[],
  ): Promise<LLMResponse> {
    // Build Gemini tools from our tool definitions
    const geminiTools: Tool[] | undefined = tools && tools.length > 0
      ? [{
          functionDeclarations: tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: this.convertToGeminiSchema(t.parameters),
          })),
        }]
      : undefined;

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      systemInstruction: systemPrompt,
      tools: geminiTools,
    });

    // Convert messages to Gemini Content format
    const contents: Content[] = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }] as Part[],
      }));

    try {
      const result = await model.generateContent({
        contents,
      });

      const response = result.response;
      const candidate = response.candidates?.[0];

      if (!candidate) {
        return {
          text: '',
          finishReason: 'no_candidate',
        };
      }

      // Check for function calls
      const functionCall = candidate.content?.parts?.find(
        (part: Part) => 'functionCall' in part && part.functionCall
      );

      if (functionCall && 'functionCall' in functionCall && functionCall.functionCall) {
        return {
          text: '',
          toolCall: {
            name: functionCall.functionCall.name,
            args: (functionCall.functionCall.args as Record<string, unknown>) || {},
          },
          finishReason: 'tool_call',
        };
      }

      // Extract text response
      const text = candidate.content?.parts
        ?.filter((part: Part) => 'text' in part && part.text)
        .map((part: Part) => ('text' in part ? part.text : ''))
        .join('') || '';

      return {
        text,
        finishReason: candidate.finishReason || 'stop',
      };
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[GeminiProvider] Error:', errMsg);
      throw new Error(`LLM request failed: ${errMsg}`);
    }
  }

  /**
   * Convert our generic parameter schema to Gemini's schema format
   */
  private convertToGeminiSchema(params: Record<string, unknown>): Record<string, unknown> {
    // Gemini expects FunctionDeclarationSchema format
    return {
      type: SchemaType.OBJECT,
      properties: (params as Record<string, unknown>).properties || params,
      required: (params as Record<string, unknown>).required || [],
    };
  }
}
