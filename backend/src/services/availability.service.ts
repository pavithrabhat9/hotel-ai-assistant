import { AvailabilityRequest, AvailabilityResponse, AvailabilityValidationError } from '../types/availability.types';
import { checkAvailability, validateAvailabilityRequest } from '../providers/tools/checkAvailability.tool';

class AvailabilityService {
  /**
   * Validate and check room availability.
   * All business logic is deterministic — no LLM.
   */
  check(request: AvailabilityRequest): {
    response?: AvailabilityResponse;
    errors?: AvailabilityValidationError[];
  } {
    // Validate first
    const errors = validateAvailabilityRequest(request);
    if (errors.length > 0) {
      return { errors };
    }

    // Execute deterministic check
    const response = checkAvailability(request);
    return { response };
  }

  /**
   * Format availability results as a natural-language summary.
   * Used by the orchestrator to provide context to the LLM for phrasing.
   * The actual numbers come from here (template), not the LLM.
   */
  formatResultSummary(result: AvailabilityResponse): string {
    if (!result.available) {
      return result.message;
    }

    const lines = [result.message, ''];
    for (const room of result.rooms) {
      lines.push(`• ${room.roomType} — ₹${room.pricePerNight.toLocaleString('en-IN')}/night, fits ${room.capacity} guests. ${room.description}`);
    }
    return lines.join('\n');
  }
}

export const availabilityService = new AvailabilityService();
