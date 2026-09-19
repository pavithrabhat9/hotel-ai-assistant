'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ComposerInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ComposerInput({ onSend, disabled, placeholder }: ComposerInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value);
      setValue('');
      // Reset height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6 py-4">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder || 'Ask about the hotel…'}
            rows={1}
            className="w-full resize-none rounded-xl bg-slate-50 border border-slate-200
              text-sm text-slate-900 placeholder-slate-500
              px-4 py-3 pr-12
              focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200"
            id="chat-input"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-xl
            active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center justify-center
            shadow-lg
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-[#F1592A]/40"
            style={{ background: 'linear-gradient(166deg, #FF8E1F 0%, #FC4E1B 100%)' }}
          id="send-button"
          aria-label="Send message"
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
          </svg>
        </button>
      </div>
      <p className="text-center text-[10px] text-slate-600 mt-2">
        Powered by AI · Answers sourced from hotel knowledge base
      </p>
    </div>
  );
}
