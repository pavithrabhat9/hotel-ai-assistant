'use client';

import React, { useState } from 'react';
import { SourceReference } from '@/lib/types';

interface SourceChipProps {
  source: SourceReference;
}

export default function SourceChip({ source }: SourceChipProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
          bg-orange-50 border border-orange-200
          text-[11px] font-medium text-orange-600
          hover:bg-orange-100 hover:border-orange-300
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-orange-500/30"
        title={`Source: ${source.topic}`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {source.topic}
        <svg className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded snippet */}
      {isExpanded && (
        <div className="absolute left-0 top-full mt-1 z-10 w-72 sm:w-80
          rounded-xl bg-white border border-slate-200 shadow-xl shadow-black/5
          p-3 animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <p className="text-xs font-semibold text-orange-600 mb-1.5">{source.topic}</p>
          <p className="text-xs text-slate-700 leading-relaxed">{source.snippet}</p>
        </div>
      )}
    </div>
  );
}
