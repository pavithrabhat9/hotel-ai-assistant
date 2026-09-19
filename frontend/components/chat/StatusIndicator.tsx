'use client';

import React from 'react';

interface StatusIndicatorProps {
  text: string;
}

export default function StatusIndicator({ text }: StatusIndicatorProps) {
  return (
    <div className="flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* AI avatar */}
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg flex-shrink-0 mt-1"
        style={{ background: 'linear-gradient(166deg, #FF8E1F 0%, #FC4E1B 100%)' }}>
        AI
      </div>
      
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-slate-200">
        {/* Animated dots */}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#F1592A', animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#F1592A', animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#F1592A', animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-slate-600 animate-pulse">
          {text || 'Thinking…'}
        </span>
      </div>
    </div>
  );
}
