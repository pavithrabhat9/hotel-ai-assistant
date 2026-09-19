import {
  ChatRequest,
  ChatResponse,
  AvailabilityRequest,
  AvailabilityResponse,
  TopicsResponse,
  ApiError,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Single fetch wrapper — only place in the frontend that calls the backend.
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      const apiError = data as ApiError;
      throw new ApiRequestError(
        apiError.error?.message || `Request failed with status ${response.status}`,
        response.status,
        apiError.error?.code || 'UNKNOWN_ERROR',
        apiError.error?.fields,
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    // Network/connectivity error
    throw new ApiRequestError(
      'Unable to connect to the hotel assistant service. Please check your connection and try again.',
      0,
      'NETWORK_ERROR',
    );
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

// ─── API Methods ───

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
  return apiFetch<AvailabilityResponse>('/availability', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getTopics(): Promise<TopicsResponse> {
  return apiFetch<TopicsResponse>('/chat/topics');
}
