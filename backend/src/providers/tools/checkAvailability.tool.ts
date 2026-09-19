import { AvailabilityRequest, AvailabilityResponse, RoomResult, AvailabilityValidationError } from '../../types/availability.types';
import { knowledgeBaseRepository } from '../../data/knowledgeBase.repository';

/**
 * checkAvailability — Pure deterministic mock function.
 * No LLM involved. Simulates a PMS (Property Management System) call.
 * 
 * Mock logic:
 * - Rooms matching capacity >= total guests are returned
 * - Certain date ranges are mocked as "fully booked" to test fallback
 * - Prices may vary by a mock seasonal multiplier
 */
export function checkAvailability(request: AvailabilityRequest): AvailabilityResponse {
  const { checkIn, checkOut, adults, children = 0 } = request;
  const totalGuests = adults + children;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  // Get rooms from KB
  const allRooms = knowledgeBaseRepository.getRooms();

  // Mock: Dec 24–26 and Dec 31–Jan 2 are "fully booked"
  const isBlackout = isBlackoutPeriod(checkInDate, checkOutDate);
  if (isBlackout) {
    return {
      available: false,
      rooms: [],
      message: `We're sorry, all rooms are fully booked for ${formatDateRange(checkIn, checkOut)}. This is a peak holiday period. Please try alternative dates or contact us at +91-22-6789-0000 for waitlist options.`,
      nights,
      checkIn,
      checkOut,
    };
  }

  // Filter rooms that can accommodate the guest count
  const matchingRooms: RoomResult[] = allRooms
    .filter(room => room.capacity >= totalGuests)
    .map(room => ({
      roomType: room.roomType,
      description: room.description,
      capacity: room.capacity,
      pricePerNight: applySeasonalPricing(room.pricePerNight, checkInDate),
      currency: room.currency,
      amenities: room.amenities,
      available: true,
    }));

  if (matchingRooms.length === 0) {
    return {
      available: false,
      rooms: [],
      message: `We don't have a single room that accommodates ${totalGuests} guests. Our largest room fits ${Math.max(...allRooms.map(r => r.capacity))} guests. You may want to book multiple rooms. Please contact us at +91-22-6789-0000 for group bookings.`,
      nights,
      checkIn,
      checkOut,
    };
  }

  return {
    available: true,
    rooms: matchingRooms,
    message: `We have ${matchingRooms.length} room type${matchingRooms.length > 1 ? 's' : ''} available for ${formatDateRange(checkIn, checkOut)} (${nights} night${nights > 1 ? 's' : ''}).`,
    nights,
    checkIn,
    checkOut,
  };
}

/**
 * Validate availability request fields. Returns field-level errors.
 */
export function validateAvailabilityRequest(request: AvailabilityRequest): AvailabilityValidationError[] {
  const errors: AvailabilityValidationError[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (!request.checkIn) {
    errors.push({ field: 'checkIn', message: 'Check-in date is required.' });
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(request.checkIn)) {
    errors.push({ field: 'checkIn', message: 'Check-in date must be in YYYY-MM-DD format.' });
  } else if (new Date(request.checkIn) < now) {
    errors.push({ field: 'checkIn', message: 'Check-in date cannot be in the past.' });
  }

  if (!request.checkOut) {
    errors.push({ field: 'checkOut', message: 'Check-out date is required.' });
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(request.checkOut)) {
    errors.push({ field: 'checkOut', message: 'Check-out date must be in YYYY-MM-DD format.' });
  } else if (request.checkIn && new Date(request.checkOut) <= new Date(request.checkIn)) {
    errors.push({ field: 'checkOut', message: 'Check-out date must be after check-in date.' });
  }

  if (!request.adults || request.adults < 1) {
    errors.push({ field: 'adults', message: 'At least 1 adult is required.' });
  } else if (request.adults > 10) {
    errors.push({ field: 'adults', message: 'For groups larger than 10, please contact us directly.' });
  }

  if (request.children !== undefined && request.children < 0) {
    errors.push({ field: 'children', message: 'Children count cannot be negative.' });
  }

  return errors;
}

// ─── Helpers ───

function isBlackoutPeriod(checkIn: Date, checkOut: Date): boolean {
  const blackouts = [
    { start: '12-24', end: '12-26' },
    { start: '12-31', end: '01-02' },
  ];

  for (const blackout of blackouts) {
    const year = checkIn.getFullYear();
    const bStart = new Date(`${year}-${blackout.start}`);
    const bEnd = new Date(blackout.end === '01-02' ? `${year + 1}-${blackout.end}` : `${year}-${blackout.end}`);

    // Overlap check
    if (checkIn <= bEnd && checkOut >= bStart) {
      return true;
    }
  }
  return false;
}

function applySeasonalPricing(basePrice: number, checkIn: Date): number {
  const month = checkIn.getMonth(); // 0-indexed
  // Peak: Oct-Feb (wedding/tourist season in Mumbai)
  if (month >= 9 || month <= 1) {
    return Math.round(basePrice * 1.2);
  }
  // Monsoon discount: Jun-Aug
  if (month >= 5 && month <= 7) {
    return Math.round(basePrice * 0.85);
  }
  return basePrice;
}

function formatDateRange(checkIn: string, checkOut: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const ciDate = new Date(checkIn);
  const coDate = new Date(checkOut);
  return `${ciDate.toLocaleDateString('en-IN', opts)} – ${coDate.toLocaleDateString('en-IN', opts)}`;
}
