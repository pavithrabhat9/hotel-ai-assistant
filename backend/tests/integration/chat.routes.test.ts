import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock env before importing app
vi.mock('../../src/config/env', () => ({
  env: {
    PORT: 3001,
    NODE_ENV: 'test',
    GEMINI_API_KEY: 'test-key',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

// Use vi.hoisted for the mock function
const mockChat = vi.hoisted(() => vi.fn());

vi.mock('../../src/providers/llm/providerFactory', () => ({
  createLLMProvider: () => ({
    chat: mockChat,
  }),
}));

import app from '../../src/app';

describe('Chat Routes — Integration', () => {
  // ─── Health check ───
  it('GET /api/health should return 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  // ─── Validation ───
  it('POST /api/chat with empty body should return 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
    expect(res.body.error.fields.sessionId).toBeDefined();
    expect(res.body.error.fields.message).toBeDefined();
  });

  it('POST /api/chat with message too long should return 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        sessionId: 'test',
        message: 'a'.repeat(2001),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.message).toBeDefined();
  });

  // ─── Test #1: Normal question E2E ───
  it('POST /api/chat should return a valid response for a normal question', async () => {
    mockChat.mockResolvedValueOnce({
      text: 'Check-in time is 2:00 PM.',
      finishReason: 'stop',
    });

    const res = await request(app)
      .post('/api/chat')
      .send({
        sessionId: 'integration-1',
        message: 'What time is check-in?',
      });

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe('integration-1');
    expect(res.body.type).toBeDefined();
    expect(res.body.reply).toBeDefined();
    expect(res.body.reply.text).toContain('2:00 PM');
    expect(res.body.reply.sources).toBeDefined();
  });

  // ─── Test #8: LLM failure returns 200 with fallback (not 500) ───
  it('POST /api/chat should return fallback when LLM fails', async () => {
    mockChat.mockRejectedValueOnce(new Error('LLM timeout'));

    const res = await request(app)
      .post('/api/chat')
      .send({
        sessionId: 'integration-fail',
        message: 'Hello',
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('fallback');
    expect(res.body.reply.text).toContain('trouble processing');
  });

  // ─── GET /api/chat/topics ───
  it('GET /api/chat/topics should return quick-start topics', async () => {
    const res = await request(app).get('/api/chat/topics');

    expect(res.status).toBe(200);
    expect(res.body.topics).toBeDefined();
    expect(res.body.topics.length).toBeGreaterThan(0);
    expect(res.body.hotelName).toBeDefined();
  });

  // ─── 404 ───
  it('GET /api/nonexistent should return 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
