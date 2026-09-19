import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Mock env
vi.mock('../../src/config/env', () => ({
  env: {
    PORT: 3001,
    NODE_ENV: 'test',
    GEMINI_API_KEY: 'test-key',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

// Mock LLM (not used by availability, but imported via orchestrator chain)
vi.mock('../../src/providers/llm/providerFactory', () => ({
  createLLMProvider: () => ({
    chat: vi.fn(),
  }),
}));

import app from '../../src/app';

describe('Availability Routes — Integration', () => {
  // ─── Validation ───
  it('POST /api/availability with missing fields should return 400 with field errors', async () => {
    const res = await request(app)
      .post('/api/availability')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
  });

  it('POST /api/availability with invalid date format should return 400', async () => {
    const res = await request(app)
      .post('/api/availability')
      .send({
        sessionId: 'avail-test',
        checkIn: '12-10-2026',
        checkOut: '14-10-2026',
        adults: 2,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.checkIn).toBeDefined();
  });

  // ─── Test #4: Happy path ───
  it('POST /api/availability with valid request should return available rooms', async () => {
    const res = await request(app)
      .post('/api/availability')
      .send({
        sessionId: 'avail-happy',
        checkIn: '2026-10-12',
        checkOut: '2026-10-14',
        adults: 2,
        children: 0,
      });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.rooms.length).toBeGreaterThan(0);
    expect(res.body.nights).toBe(2);

    // Verify room structure
    const room = res.body.rooms[0];
    expect(room).toHaveProperty('roomType');
    expect(room).toHaveProperty('capacity');
    expect(room).toHaveProperty('pricePerNight');
    expect(room).toHaveProperty('currency');
    expect(room).toHaveProperty('amenities');
  });

  // ─── Test #5: Blackout dates ───
  it('POST /api/availability for Christmas should return no availability', async () => {
    const res = await request(app)
      .post('/api/availability')
      .send({
        sessionId: 'avail-blackout',
        checkIn: '2026-12-24',
        checkOut: '2026-12-26',
        adults: 2,
        children: 0,
      });

    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
    expect(res.body.rooms).toHaveLength(0);
    expect(res.body.message).toContain('fully booked');
  });

  // ─── Business logic: checkOut <= checkIn ───
  it('POST /api/availability where checkOut <= checkIn should return 400', async () => {
    const res = await request(app)
      .post('/api/availability')
      .send({
        sessionId: 'avail-invalid',
        checkIn: '2026-10-14',
        checkOut: '2026-10-12',
        adults: 2,
        children: 0,
      });

    expect(res.status).toBe(400);
  });
});
