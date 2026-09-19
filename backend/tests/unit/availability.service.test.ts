import { describe, it, expect } from 'vitest';
import { checkAvailability, validateAvailabilityRequest } from '../../src/providers/tools/checkAvailability.tool';

describe('Availability Service', () => {
  // ─── Test #4: Availability happy path ───
  describe('checkAvailability — happy path', () => {
    it('should return available rooms for valid dates and 2 adults', () => {
      const result = checkAvailability({
        sessionId: 'test-1',
        checkIn: '2026-10-12',
        checkOut: '2026-10-14',
        adults: 2,
        children: 0,
      });

      expect(result.available).toBe(true);
      expect(result.rooms.length).toBeGreaterThan(0);
      expect(result.nights).toBe(2);
      expect(result.checkIn).toBe('2026-10-12');
      expect(result.checkOut).toBe('2026-10-14');
      
      // All returned rooms should fit at least 2 guests
      for (const room of result.rooms) {
        expect(room.capacity).toBeGreaterThanOrEqual(2);
        expect(room.pricePerNight).toBeGreaterThan(0);
        expect(room.currency).toBe('INR');
      }
    });

    it('should return rooms fitting 4 guests (Family Room and Presidential Suite)', () => {
      const result = checkAvailability({
        sessionId: 'test-2',
        checkIn: '2026-10-12',
        checkOut: '2026-10-15',
        adults: 3,
        children: 1,
      });

      expect(result.available).toBe(true);
      // Only rooms with capacity >= 4
      for (const room of result.rooms) {
        expect(room.capacity).toBeGreaterThanOrEqual(4);
      }
      expect(result.nights).toBe(3);
    });
  });

  // ─── Test #5: Availability — none free (blackout) ───
  describe('checkAvailability — blackout dates', () => {
    it('should return unavailable for Christmas dates (Dec 24-26)', () => {
      const result = checkAvailability({
        sessionId: 'test-3',
        checkIn: '2026-12-24',
        checkOut: '2026-12-26',
        adults: 2,
      });

      expect(result.available).toBe(false);
      expect(result.rooms).toHaveLength(0);
      expect(result.message).toContain('fully booked');
    });

    it('should return unavailable for New Year dates (Dec 31-Jan 2)', () => {
      const result = checkAvailability({
        sessionId: 'test-4',
        checkIn: '2026-12-31',
        checkOut: '2027-01-02',
        adults: 2,
      });

      expect(result.available).toBe(false);
      expect(result.rooms).toHaveLength(0);
    });
  });

  // ─── Test: No room fits the guest count ───
  describe('checkAvailability — capacity exceeded', () => {
    it('should return no rooms for 6 guests (max capacity is 4)', () => {
      const result = checkAvailability({
        sessionId: 'test-5',
        checkIn: '2026-10-12',
        checkOut: '2026-10-14',
        adults: 6,
      });

      expect(result.available).toBe(false);
      expect(result.rooms).toHaveLength(0);
      expect(result.message).toContain('multiple rooms');
    });
  });

  // ─── Seasonal pricing ───
  describe('checkAvailability — seasonal pricing', () => {
    it('should apply peak-season multiplier (1.2x) for October bookings', () => {
      const result = checkAvailability({
        sessionId: 'test-6',
        checkIn: '2026-10-12',
        checkOut: '2026-10-14',
        adults: 2,
      });

      // Deluxe Room base: ₹8,500. Peak: ₹8,500 * 1.2 = ₹10,200
      const deluxe = result.rooms.find(r => r.roomType === 'Deluxe Room');
      expect(deluxe).toBeDefined();
      expect(deluxe!.pricePerNight).toBe(10200); // 8500 * 1.2
    });

    it('should apply monsoon discount (0.85x) for July bookings', () => {
      const result = checkAvailability({
        sessionId: 'test-7',
        checkIn: '2026-07-10',
        checkOut: '2026-07-12',
        adults: 2,
      });

      const deluxe = result.rooms.find(r => r.roomType === 'Deluxe Room');
      expect(deluxe).toBeDefined();
      expect(deluxe!.pricePerNight).toBe(7225); // 8500 * 0.85
    });
  });

  // ─── Validation ───
  describe('validateAvailabilityRequest', () => {
    it('should return errors for missing required fields', () => {
      const errors = validateAvailabilityRequest({
        sessionId: 'test',
        checkIn: '',
        checkOut: '',
        adults: 0,
      });

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.field === 'checkIn')).toBe(true);
      expect(errors.some(e => e.field === 'checkOut')).toBe(true);
      expect(errors.some(e => e.field === 'adults')).toBe(true);
    });

    it('should error when checkOut is before checkIn', () => {
      const errors = validateAvailabilityRequest({
        sessionId: 'test',
        checkIn: '2026-10-14',
        checkOut: '2026-10-12',
        adults: 2,
      });

      expect(errors.some(e => e.field === 'checkOut')).toBe(true);
    });

    it('should error for past dates', () => {
      const errors = validateAvailabilityRequest({
        sessionId: 'test',
        checkIn: '2020-01-01',
        checkOut: '2020-01-03',
        adults: 2,
      });

      expect(errors.some(e => e.field === 'checkIn')).toBe(true);
    });

    it('should error for groups larger than 10', () => {
      const errors = validateAvailabilityRequest({
        sessionId: 'test',
        checkIn: '2026-10-12',
        checkOut: '2026-10-14',
        adults: 15,
      });

      expect(errors.some(e => e.field === 'adults')).toBe(true);
    });

    it('should pass for valid request', () => {
      const errors = validateAvailabilityRequest({
        sessionId: 'test',
        checkIn: '2026-10-12',
        checkOut: '2026-10-14',
        adults: 2,
        children: 1,
      });

      expect(errors).toHaveLength(0);
    });
  });
});
