// ─── Availability Types ───

export interface AvailabilityRequest {
  sessionId: string;
  checkIn: string;   // YYYY-MM-DD
  checkOut: string;  // YYYY-MM-DD
  adults: number;
  children?: number;
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

export interface AvailabilityResponse {
  available: boolean;
  rooms: RoomResult[];
  message: string;
  nights: number;
  checkIn: string;
  checkOut: string;
}

export interface AvailabilityValidationError {
  field: string;
  message: string;
}
