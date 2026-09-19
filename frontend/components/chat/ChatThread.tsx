'use client';

import React, { useRef, useEffect } from 'react';
import { Message } from '@/lib/types';
import MessageBubble from './MessageBubble';
import StatusIndicator from './StatusIndicator';

interface ChatThreadProps {
  messages: Message[];
  isLoading: boolean;
  statusText: string;
  onRetry?: () => void;
}

export default function ChatThread({ messages, isLoading, statusText, onRetry }: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4 scroll-smooth" id="chat-thread">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="text-center space-y-3">
            <div className="text-4xl">🛎️</div>
            <p className="text-slate-600 text-sm max-w-xs">
              Ask me anything about the hotel — check-in times, amenities, room options, or availability.
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onRetry={message.isError ? onRetry : undefined}
        />
      ))}

      {isLoading && (
        <StatusIndicator text={statusText} />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
