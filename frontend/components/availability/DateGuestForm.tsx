'use client';

import React, { useState } from 'react';

interface DateGuestFormProps {
  onSubmit: (data: { checkIn: string; checkOut: string; adults: number; children: number }) => void;
  isLoading?: boolean;
}

export default function DateGuestForm({ onSubmit, isLoading }: DateGuestFormProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get tomorrow's date for min value
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!checkIn) newErrors.checkIn = 'Required';
    if (!checkOut) newErrors.checkOut = 'Required';
    if (checkIn && checkOut && checkOut <= checkIn) {
      newErrors.checkOut = 'Must be after check-in';
    }
    if (adults < 1) newErrors.adults = 'At least 1 adult';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ checkIn, checkOut, adults, children });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Check-in */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Check-in</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={minDate}
            className={`w-full rounded-lg bg-white border ${errors.checkIn ? 'border-red-500/50' : 'border-slate-300'} 
              text-sm text-slate-900 px-3 py-2.5
              focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40
              transition-all duration-200`}
            id="check-in-date"
          />
          {errors.checkIn && <p className="text-[10px] text-red-400 mt-1">{errors.checkIn}</p>}
        </div>

        {/* Check-out */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Check-out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || minDate}
            className={`w-full rounded-lg bg-white border ${errors.checkOut ? 'border-red-500/50' : 'border-slate-300'} 
              text-sm text-slate-900 px-3 py-2.5
              focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/40
              transition-all duration-200`}
            id="check-out-date"
          />
          {errors.checkOut && <p className="text-[10px] text-red-400 mt-1">{errors.checkOut}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Adults */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Adults</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdults(Math.max(1, adults - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              −
            </button>
            <span className="text-sm font-semibold text-slate-900 w-8 text-center">{adults}</span>
            <button
              type="button"
              onClick={() => setAdults(Math.min(10, adults + 1))}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
          {errors.adults && <p className="text-[10px] text-red-400 mt-1">{errors.adults}</p>}
        </div>

        {/* Children */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Children</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setChildren(Math.max(0, children - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              −
            </button>
            <span className="text-sm font-semibold text-slate-900 w-8 text-center">{children}</span>
            <button
              type="button"
              onClick={() => setChildren(Math.min(5, children + 1))}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500
          hover:from-orange-400 hover:to-amber-400
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed
          text-sm font-semibold text-white
          shadow-lg shadow-orange-500/20
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 focus:ring-offset-white"
        id="check-availability-button"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Checking…
          </span>
        ) : (
          'Check Availability'
        )}
      </button>
    </form>
  );
}
