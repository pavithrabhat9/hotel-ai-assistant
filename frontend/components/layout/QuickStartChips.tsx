'use client';

import React from 'react';

interface QuickStartChipsProps {
  topics: string[];
  onSelect: (topic: string) => void;
  disabled?: boolean;
}

// Map topics to clean SVG outline icons
const topicIcons: Record<string, React.ReactNode> = {
  'Check-in & Check-out times': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  ),
  'Room types & pricing': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  'Breakfast & dining': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c0-1.657-1.343-3-3-3S6 6.343 6 8c0 1.306.835 2.418 2 2.83V20h2v-9.17C11.165 10.418 12 9.306 12 8zm6-3v8h-2V5h-1v8h-2V5h-1v8c0 1.306.835 2.418 2 2.83V20h2v-4.17C17.165 15.418 18 14.306 18 13V5h-1z" />
    </svg>
  ),
  'Swimming pool & spa': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h10a4 4 0 100-8H7a4 4 0 00-4 4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9a3 3 0 116 0" />
    </svg>
  ),
  'Cancellation policy': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  'Airport transfer': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  'Check room availability': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

const defaultIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export default function QuickStartChips({ topics, onSelect, disabled }: QuickStartChipsProps) {
  return (
    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-2.5">Quick questions</p>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => {
          const icon = topicIcons[topic] || defaultIcon;
          return (
            <button
              key={topic}
              onClick={() => onSelect(topic === 'Check room availability' ? 'I want to check room availability' : topic)}
              disabled={disabled}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                bg-white border border-slate-200 shadow-sm
                text-xs font-medium text-slate-700
                hover:border-[#F1592A] hover:text-[#F1592A] hover:bg-orange-50/50
                active:scale-[0.97]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-150 ease-out
                focus:outline-none focus:ring-2 focus:ring-[#F1592A]/30 focus:ring-offset-1"
            >
              <span className="text-slate-500 group-hover:text-[#F1592A] transition-colors duration-150">{icon}</span>
              <span>{topic}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
