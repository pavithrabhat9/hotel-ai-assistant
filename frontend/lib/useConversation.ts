'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatResponse } from './types';
import { sendChatMessage, ApiRequestError } from './apiClient';

export function useConversation() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(uuidv4());

  const sessionId = sessionIdRef.current;

  const resetConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatusText('');
    sessionIdRef.current = uuidv4();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setError(null);

    // Add guest message
    const guestMessage: Message = {
      id: uuidv4(),
      role: 'guest',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, guestMessage]);
    setIsLoading(true);

    // Determine status text based on message content
    const lowerText = text.toLowerCase();
    if (lowerText.includes('available') || lowerText.includes('room') || lowerText.includes('book')) {
      setStatusText('Checking room details…');
    } else {
      setStatusText('Looking that up…');
    }

    try {
      const response: ChatResponse = await sendChatMessage({
        sessionId: sessionIdRef.current,
        message: text.trim(),
      });

      // Update status for availability
      if (response.type === 'availability_result') {
        const args = response.reply.toolCall?.args as Record<string, string> | undefined;
        if (args?.checkIn && args?.checkOut) {
          setStatusText(`Checked availability for ${args.checkIn} – ${args.checkOut}`);
        }
      }

      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.reply.text,
        type: response.type,
        sources: response.reply.sources,
        toolCall: response.reply.toolCall,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof ApiRequestError
        ? err.message
        : 'Something went wrong. Please try again.';

      setError(errorMessage);

      const errorMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: errorMessage,
        type: 'fallback',
        sources: [],
        timestamp: Date.now(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  }, [isLoading]);

  const retryLastMessage = useCallback(() => {
    const lastGuestMsg = [...messages].reverse().find(m => m.role === 'guest');
    if (lastGuestMsg) {
      // Remove the error message
      setMessages(prev => prev.filter(m => !m.isError || m.timestamp < lastGuestMsg.timestamp));
      // Remove the last guest message too, since sendMessage will re-add it
      setMessages(prev => prev.filter(m => m.id !== lastGuestMsg.id));
      sendMessage(lastGuestMsg.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    statusText,
    error,
    sessionId,
    sendMessage,
    retryLastMessage,
    resetConversation,
  };
}
