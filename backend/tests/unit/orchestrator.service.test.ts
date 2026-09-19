import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env before anything
vi.mock('../../src/config/env', () => ({
  env: {
    PORT: 3001,
    NODE_ENV: 'test',
    GEMINI_API_KEY: 'test-key',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

// Use vi.hoisted to define the mock function BEFORE vi.mock runs
const mockChat = vi.hoisted(() => vi.fn());

vi.mock('../../src/providers/llm/providerFactory', () => ({
  createLLMProvider: () => ({
    chat: mockChat,
  }),
}));

// Import after mocks
import { orchestratorService } from '../../src/services/orchestrator.service';

describe('Orchestrator Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Test #1: Normal guest question — deterministic KB answer with source ───
  it('should return KB-grounded answer for "What time is check-in?"', async () => {
    mockChat.mockResolvedValueOnce({
      text: 'Check-in time at The Grand Horizon Hotel & Spa is 2:00 PM. Early check-in is available from 11:00 AM subject to availability at an additional charge of ₹1,500.',
      finishReason: 'stop',
    });

    const response = await orchestratorService.handleMessage('test-session-1', 'What time is check-in?');

    expect(response.sessionId).toBe('test-session-1');
    expect(response.type).toBe('answer');
    expect(response.reply.text).toContain('2:00 PM');
    expect(response.reply.sources.length).toBeGreaterThan(0);
    expect(response.reply.sources.some(s => s.topic.includes('Check-in'))).toBe(true);
  });

  // ─── Test #2: Missing info — guest asks about availability without dates ───
  it('should ask for clarification when availability is requested without details', async () => {
    mockChat.mockResolvedValueOnce({
      text: 'I\'d be happy to check room availability for you! Could you please provide your check-in date, check-out date, and the number of guests?',
      finishReason: 'stop',
    });

    const response = await orchestratorService.handleMessage('test-session-2', 'Do you have rooms available?');

    expect(response.type).toBe('availability_prompt');
    expect(response.reply.text).toContain('check-in date');
  });

  // ─── Test #3: Ambiguous question — "room for a big family" ───
  it('should ask for exact guest count for ambiguous family query', async () => {
    mockChat.mockResolvedValueOnce({
      text: 'I\'d love to help you find the perfect room for your family! Could you please specify how many guests will be staying? Our Family Room accommodates up to 4 guests.',
      finishReason: 'stop',
    });

    const response = await orchestratorService.handleMessage('test-session-3', 'room for a big family');

    expect(response.reply.text.toLowerCase()).toContain('family');
  });

  // ─── Test #4: Availability happy path — LLM triggers tool call ───
  it('should execute checkAvailability tool when LLM requests it', async () => {
    mockChat.mockResolvedValueOnce({
      text: '',
      toolCall: {
        name: 'checkAvailability',
        args: {
          checkIn: '2026-10-12',
          checkOut: '2026-10-14',
          adults: 2,
        },
      },
      finishReason: 'tool_call',
    });

    const response = await orchestratorService.handleMessage('test-session-4', 'Do you have rooms for October 12 to 14 for 2 adults?');

    expect(response.type).toBe('availability_result');
    expect(response.reply.toolCall).toBeDefined();
    expect(response.reply.toolCall!.name).toBe('checkAvailability');
    
    const result = response.reply.toolCall!.result as any;
    expect(result.available).toBe(true);
    expect(result.rooms.length).toBeGreaterThan(0);
  });

  // ─── Test #5: Availability — blackout dates ───
  it('should return unavailable message for blackout dates', async () => {
    mockChat.mockResolvedValueOnce({
      text: '',
      toolCall: {
        name: 'checkAvailability',
        args: {
          checkIn: '2026-12-24',
          checkOut: '2026-12-26',
          adults: 2,
        },
      },
      finishReason: 'tool_call',
    });

    const response = await orchestratorService.handleMessage('test-session-5', 'Any rooms for Christmas?');

    expect(response.type).toBe('availability_result');
    const result = response.reply.toolCall!.result as any;
    expect(result.available).toBe(false);
    expect(result.message).toContain('fully booked');
  });

  // ─── Test #6: Out of scope question ───
  it('should return answer with KB source for "do you have a casino?"', async () => {
    mockChat.mockResolvedValueOnce({
      text: "No, The Grand Horizon Hotel & Spa does not have a casino.",
      finishReason: 'stop',
    });

    const response = await orchestratorService.handleMessage('test-session-6', 'Do you have a casino?');

    expect(response.reply.text).toContain('does not have a casino');
  });

  // ─── Test #8: Backend/LLM failure — graceful fallback ───
  it('should return graceful fallback when LLM fails', async () => {
    mockChat.mockRejectedValueOnce(new Error('LLM API timeout'));

    const response = await orchestratorService.handleMessage('test-session-8', 'What is check-in time?');

    expect(response.type).toBe('fallback');
    expect(response.reply.text).toContain('trouble processing');
    expect(response.reply.text).toContain('+91-22-6789-0000');
    expect(response.reply.sources).toHaveLength(0);
  });

  // ─── Test: Multiple failures in sequence ───
  it('should handle consecutive LLM failures gracefully', async () => {
    mockChat.mockRejectedValue(new Error('Service unavailable'));

    const response1 = await orchestratorService.handleMessage('test-session-9', 'Hello');
    const response2 = await orchestratorService.handleMessage('test-session-9', 'Are you there?');

    expect(response1.type).toBe('fallback');
    expect(response2.type).toBe('fallback');
  });
});
