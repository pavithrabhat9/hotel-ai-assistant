'use client';

import React, { useState } from 'react';
import { Message, RoomResult } from '@/lib/types';
import SourceChip from './SourceChip';
import RoomResultCard from '../availability/RoomResultCard';

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
}

export default function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isGuest = message.role === 'guest';
  const isError = message.isError;

  // Extract availability results if present
  const availabilityResult = message.toolCall?.result as {
    available?: boolean;
    rooms?: RoomResult[];
    nights?: number;
    checkIn?: string;
    checkOut?: string;
    message?: string;
  } | undefined;

  return (
    <div
      className={`flex ${isGuest ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
      id={`message-${message.id}`}
    >
      <div className={`max-w-[85%] sm:max-w-[75%] ${isGuest ? 'order-2' : 'order-1'}`}>
        {/* Avatar + name */}
        <div className={`flex items-center gap-2 mb-1.5 ${isGuest ? 'justify-end' : 'justify-start'}`}>
          {!isGuest && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg flex-shrink-0"
              style={{ background: 'linear-gradient(166deg, #FF8E1F 0%, #FC4E1B 100%)' }}>
              AI
            </div>
          )}
          <span className="text-xs text-slate-500 font-medium">
            {isGuest ? 'You' : 'Guest Assistant'}
          </span>
          <span className="text-[10px] text-slate-600">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isGuest
              ? 'text-white rounded-br-md shadow-lg'
              : isError
                ? 'bg-red-50 border border-red-200 text-red-600 rounded-bl-md'
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
          }`}
          style={isGuest ? { background: 'linear-gradient(166deg, #FF8E1F 0%, #FC4E1B 100%)' } : {}}
        >
          {/* Text content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content
              .replace(/\*\*/g, '')
              .replace(/__/g, '')
              .replace(/^\s*\*\s+/gm, '• ')
              .replace(/^\s*-\s+/gm, '• ')}
          </div>

          {/* Error retry button */}
          {isError && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-red-500/40"
              id="retry-button"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          )}
        </div>

        {/* Room cards for availability results */}
        {message.type === 'availability_result' && availabilityResult && (
          <div className="mt-3 space-y-2">
            {availabilityResult.available && availabilityResult.rooms && availabilityResult.rooms.length > 0 ? (
              <>
                <p className="text-xs text-slate-400 font-medium px-1">
                  {availabilityResult.rooms.length} room type{availabilityResult.rooms.length > 1 ? 's' : ''} available
                  {availabilityResult.nights ? ` · ${availabilityResult.nights} night${availabilityResult.nights > 1 ? 's' : ''}` : ''}
                </p>
                <div className="grid gap-2">
                  {availabilityResult.rooms.map((room, idx) => (
                    <RoomResultCard key={idx} room={room} nights={availabilityResult.nights || 1} />
                  ))}
                </div>
              </>
            ) : (
              !availabilityResult.available && (
                <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 text-sm text-orange-800">
                  <span className="font-medium">No availability</span>
                  <span className="mx-1.5">·</span>
                  <span className="text-orange-700/80">{availabilityResult.message}</span>
                </div>
              )
            )}
          </div>
        )}

        {/* Source chips */}
        {message.sources && message.sources.length > 0 && message.type === 'answer' && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.sources.map((source, idx) => (
              <SourceChip key={idx} source={source} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
