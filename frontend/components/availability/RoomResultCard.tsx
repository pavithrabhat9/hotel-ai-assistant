'use client';

import React from 'react';
import { RoomResult } from '@/lib/types';

interface RoomResultCardProps {
  room: RoomResult;
  nights: number;
}

export default function RoomResultCard({ room, nights }: RoomResultCardProps) {
  const totalPrice = room.pricePerNight * nights;

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-4 hover:border-orange-300 transition-all duration-300 group shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Room name + capacity badge */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{room.roomType}</h4>
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {room.capacity}
            </span>
          </div>
          
          {/* Description */}
          <p className="text-xs text-slate-500 leading-relaxed mb-2">{room.description}</p>
          
          {/* Amenities */}
          <div className="flex flex-wrap gap-1">
            {room.amenities.slice(0, 4).map((amenity, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-50 text-[10px] text-slate-500 border border-slate-100">
                {amenity}
              </span>
            ))}
            {room.amenities.length > 4 && (
              <span className="px-2 py-0.5 rounded-md bg-slate-50 text-[10px] text-slate-500 border border-slate-100">
                +{room.amenities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <p className="text-lg font-bold text-orange-600">
            ₹{room.pricePerNight.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500">per night</p>
          {nights > 1 && (
            <p className="text-xs text-slate-400 mt-1">
              ₹{totalPrice.toLocaleString('en-IN')} total
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
