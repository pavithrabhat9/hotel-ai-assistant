'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DateGuestForm from './DateGuestForm';
import { checkAvailability, ApiRequestError } from '@/lib/apiClient';
import { AvailabilityResponse, Message } from '@/lib/types';

interface StayDetailsPanelProps {
  sessionId: string;
  onAvailabilityResult?: (message: Message) => void;
}

export default function StayDetailsPanel({ sessionId, onAvailabilityResult }: StayDetailsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AvailabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: { checkIn: string; checkOut: string; adults: number; children: number }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkAvailability({
        sessionId,
        ...data,
      });

      setResult(response);

      // Also add to chat as a message
      if (onAvailabilityResult) {
        const guestMsg: Message = {
          id: uuidv4(),
          role: 'guest',
          content: `Check availability: ${data.checkIn} to ${data.checkOut}, ${data.adults} adult${data.adults > 1 ? 's' : ''}${data.children > 0 ? `, ${data.children} child${data.children > 1 ? 'ren' : ''}` : ''}`,
          timestamp: Date.now(),
        };
        onAvailabilityResult(guestMsg);

        const assistantMsg: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: response.message,
          type: 'availability_result',
          sources: [],
          toolCall: {
            name: 'checkAvailability',
            args: data,
            result: response as unknown as Record<string, unknown>,
          },
          timestamp: Date.now(),
        };
        onAvailabilityResult(assistantMsg);
      }
    } catch (err) {
      const errMsg = err instanceof ApiRequestError
        ? err.fields
          ? Object.values(err.fields).join(', ')
          : err.message
        : 'Failed to check availability. Please try again.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-md">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Stay Details</h3>
            <p className="text-[10px] text-slate-500">Check room availability & pricing</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-5">
        <DateGuestForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 pb-4">
          <div className="rounded-xl px-4 py-3 text-sm border" style={{ background: '#FFF3EE', borderColor: '#FDDDD3', color: '#D14017' }}>
            {error}
          </div>
        </div>
      )}

      {/* Results go to the chat thread — no duplicate shown here */}
      {result && (
        <div className="px-5 pb-4">
          <div className="rounded-xl px-4 py-3 text-xs text-slate-500 border border-slate-100 bg-slate-50 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Results sent to chat
          </div>
        </div>
      )}
    </div>
  );
}
