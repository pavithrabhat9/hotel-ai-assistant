'use client';

import React, { useEffect, useState, useCallback } from 'react';
import HeroSection from '@/components/layout/HeroSection';
import QuickStartChips from '@/components/layout/QuickStartChips';
import ChatThread from '@/components/chat/ChatThread';
import ComposerInput from '@/components/chat/ComposerInput';
import StayDetailsPanel from '@/components/availability/StayDetailsPanel';
import { useConversation } from '@/lib/useConversation';
import { getTopics, ApiRequestError } from '@/lib/apiClient';
import { Message } from '@/lib/types';

export default function Home() {
  const {
    messages,
    isLoading,
    statusText,
    error,
    sessionId,
    sendMessage,
    retryLastMessage,
    resetConversation,
  } = useConversation();

  const [topics, setTopics] = useState<string[]>([]);
  const [hotelName, setHotelName] = useState('Simplotel Grand');
  const [serviceStatus, setServiceStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [showPanel, setShowPanel] = useState(false);

  // Fetch topics on mount
  useEffect(() => {
    async function fetchTopics() {
      try {
        const data = await getTopics();
        setTopics(data.topics);
        setHotelName(data.hotelName);
        setServiceStatus('online');
      } catch (err) {
        console.error('Failed to fetch topics:', err);
        setServiceStatus('offline');
        // Set default topics if backend is down
        setTopics([
          'Check-in & Check-out times',
          'Room types & pricing',
          'Breakfast & dining',
          'Swimming pool & spa',
          'Cancellation policy',
          'Airport transfer',
          'Check room availability',
        ]);
      }
    }
    fetchTopics();
  }, []);

  // Handle availability results from the panel
  const [panelMessages, setPanelMessages] = useState<Message[]>([]);
  const handleAvailabilityResult = useCallback((msg: Message) => {
    setPanelMessages(prev => [...prev, msg]);
  }, []);

  // Merge panel messages with conversation messages
  const allMessages = [...messages, ...panelMessages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <HeroSection hotelName={hotelName} />

      {/* Service status banner */}
      {serviceStatus === 'offline' && (
        <div className="border-b px-4 py-2 text-center" style={{ background: '#FFF3EE', borderColor: '#FDDDD3' }} id="service-offline-banner">
          <p className="text-sm" style={{ color: '#D14017' }}>
            ⚠️ Unable to connect to the Simplotel assistant service. Please ensure the backend is running on port 3001.
          </p>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Two-column layout: Chat + Panel */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Chat column */}
          <div className="flex-1 flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden min-h-[500px] max-h-[700px] shadow-sm">
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: 'linear-gradient(166deg, #FF8E1F 0%, #FC4E1B 100%)' }}>
                  AI
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Guest Assistant</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${serviceStatus === 'online' ? 'bg-[#F1592A]' : serviceStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400'}`} />
                    <span className="text-[10px] text-slate-500">
                      {serviceStatus === 'online' ? 'Online' : serviceStatus === 'offline' ? 'Offline' : 'Connecting…'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Toggle panel button (mobile) */}
                <button
                  onClick={() => setShowPanel(!showPanel)}
                  className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  title="Check Availability"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                {/* New chat */}
                <button
                  onClick={resetConversation}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  title="New conversation"
                  id="new-chat-button"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <ChatThread
              messages={allMessages}
              isLoading={isLoading}
              statusText={statusText}
              onRetry={retryLastMessage}
            />

            {/* Quick-start chips — always visible above composer */}
            <QuickStartChips
              topics={topics}
              onSelect={sendMessage}
              disabled={isLoading}
            />

            {/* Composer */}
            <ComposerInput
              onSend={sendMessage}
              disabled={isLoading || serviceStatus === 'offline'}
              placeholder={serviceStatus === 'offline' ? 'Service unavailable…' : 'Ask about the hotel…'}
            />
          </div>

          {/* Stay Details Panel — always visible on desktop, toggleable on mobile */}
          <div className={`lg:w-80 xl:w-96 flex-shrink-0 ${showPanel ? 'block' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-6">
              <StayDetailsPanel
                sessionId={sessionId}
                onAvailabilityResult={handleAvailabilityResult}
              />

              {/* Hotel quick info card */}
              <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                <h4 className="text-sm font-semibold mb-3" style={{ color: '#152039' }}>📍 Quick Info</h4>
                <div className="space-y-2 text-xs text-slate-600">
                  <p>📞 +91-80-4747-5444</p>
                  <p>✉️ info@simplotel.com</p>
                  <p>🕐 Check-in: 2:00 PM · Check-out: 11:00 AM</p>
                  <p>🅿️ Valet parking available</p>
                  <p>📶 Free Wi-Fi throughout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-5 text-center bg-[#152039]">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center justify-center">
            <img 
              src="/simplotel-logo.png" 
              alt="Simplotel Logo" 
              className="h-5 w-auto opacity-70 grayscale" 
            />
          </div>
          <p className="text-[11px] text-white/40">
            © 2026 Simplotel Technologies · AI Guest Assistant
          </p>
        </div>
      </footer>
    </div>
  );
}
