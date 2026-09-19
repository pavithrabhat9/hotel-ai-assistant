'use client';

import React from 'react';

interface HeroSectionProps {
  hotelName: string;
}

export default function HeroSection({ hotelName }: HeroSectionProps) {
  return (
    <header
      className="relative overflow-hidden text-white flex flex-col"
      style={{ background: 'linear-gradient(135deg, #152039 0%, #1e2d4d 40%, #2b1a0e 100%)' }}
    >
      {/* Ambient blobs — moved to header level so they blend across nav and hero */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #FF8E1F, transparent)' }} />
        <div className="absolute -bottom-28 -left-28 w-[480px] h-[480px] rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #FC4E1B, transparent)' }} />
      </div>

      {/* Subtle dot-grid — moved to header level */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

      {/* Simplotel-style top nav bar — transparent so it blends with the header background */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo area */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <img 
                src="/simplotel-logo.png" 
                alt="Simplotel Logo" 
                className="h-8 w-auto" 
              />
            </div>
            <span className="hidden sm:block text-white/30 text-lg">|</span>
            <span className="hidden sm:block text-white/60 text-sm font-light">
              Guest Assistant
            </span>
          </div>


        </div>
      </div>

      {/* Hero banner */}
      <section className="relative z-10 flex-1">

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-20">
          <div className="flex flex-col items-center text-center gap-5">

            {/* Hotel name from backend */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white uppercase">
              {hotelName}
            </h1>

            {/* Tagline */}
            <p className="text-base sm:text-lg text-white/65 max-w-xl font-light">
              Ask anything about your stay — check-in times, room options, dining, and more.
            </p>

            {/* CTA pill */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm">
              <svg className="w-4 h-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm text-white/90 font-medium">Powered by Simplotel AI</span>
            </div>
          </div>
        </div>

        {/* Bottom wave separator */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1440 32" className="w-full" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,32 C360,0 1080,0 1440,32 L1440,32 L0,32 Z" />
          </svg>
        </div>
      </section>
    </header>
  );
}
