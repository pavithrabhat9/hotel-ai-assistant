import { LLMProvider } from './llmProvider.interface';
import { GeminiProvider } from './gemini.provider';

/**
 * Factory — env-driven provider selection.
 * Throws a clear error if unconfigured.
 */
export function createLLMProvider(apiKey: string): LLMProvider {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'LLM provider is not configured. Set GEMINI_API_KEY in your .env file.'
    );
  }

  return new GeminiProvider(apiKey);
}
