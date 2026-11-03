import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import ClinicCalendarModal from './ClinicCalendarModal';

/**
 * Computes live 12-hour time parts in Indian Standard Time (Asia/Kolkata).
 */
function getIndianTimeParts() {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const parts = formatter.formatToParts(now);
    const hour = parts.find((p) => p.type === 'hour')?.value || '12';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const second = parts.find((p) => p.type === 'second')?.value || '00';
    const dayPeriod = (parts.find((p) => p.type === 'dayPeriod')?.value || 'PM').toUpperCase();

    const dateFormatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(now);

    return { hour, minute, second, dayPeriod, dateFormatted };
  } catch {
    const now = new Date();
    let h = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return {
      hour: String(h).padStart(2, '0'),
      minute: String(now.getMinutes()).padStart(2, '0'),
      second: String(now.getSeconds()).padStart(2, '0'),
      dayPeriod: ampm,
      dateFormatted: now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    };
  }
}

/**
 * Clean & Responsive Digital Clinic Clock Pill Component for Navbar
 * Desktop: Date button + Digital capsule (HH:MM:SS AM/PM)
 * Mobile (<768px): Compact Digital capsule (HH:MM AM/PM) so topbar never overflows
 */
export default function LiveClock({ className = '' }) {
  const [time, setTime] = useState(() => getIndianTimeParts());
  const [tick, setTick] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getIndianTimeParts());
      setTick((prev) => !prev);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div
        className={`inline-flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50/95 via-indigo-50/80 to-cyan-50/90 border border-blue-200/90 shadow-2xs sm:shadow-sm select-none group backdrop-blur-sm ${className}`}
        title="Indian Standard Time (IST) • Click to open Clinic & Holiday Calendar"
      >
        {/* 1. Interactive Animated Calendar Date Button (visible on md screens and up) */}
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          className="hidden md:inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50/90 border border-blue-200/80 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-bold font-display shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer group/btn"
          title="Click to view Clinic & Holiday Calendar"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-600 group-hover/btn:scale-110 transition-transform shrink-0" />
          <span className="whitespace-nowrap tracking-tight">{time.dateFormatted}</span>
        </button>

        {/* 2. Smooth Obsidian Digital Display Capsule with AM/PM */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-inner font-display">
          {/* Hours */}
          <span className="tabular-nums text-xs sm:text-base font-bold text-white min-w-[14px] sm:min-w-[20px] text-center drop-shadow-sm tracking-wide">
            {time.hour}
          </span>

          {/* Smooth Neon-Cyan Colon */}
          <span
            className={`text-cyan-400 font-bold text-xs sm:text-base select-none transition-opacity duration-200 ${
              tick ? 'opacity-100' : 'opacity-40'
            }`}
          >
            :
          </span>

          {/* Minutes */}
          <span className="tabular-nums text-xs sm:text-base font-bold text-white min-w-[14px] sm:min-w-[20px] text-center drop-shadow-sm tracking-wide">
            {time.minute}
          </span>

          {/* Seconds Colon & Counter (hidden on mobile, visible on sm and up) */}
          <span
            className={`hidden lg:inline text-cyan-400 font-bold text-xs sm:text-sm select-none transition-opacity duration-200 ${
              tick ? 'opacity-100' : 'opacity-40'
            }`}
          >
            :
          </span>
          <span className="hidden lg:inline tabular-nums text-xs text-cyan-300 min-w-[16px] text-center tracking-wide">
            {time.second}
          </span>

          {/* AM / PM Badge */}
          <span className="ml-0.5 sm:ml-1 text-[9px] sm:text-[10px] font-black uppercase text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-1 sm:px-1.5 py-0.5 rounded tracking-wider">
            {time.dayPeriod}
          </span>
        </div>
      </div>

      {/* Clinic & Holiday Calendar Interactive Modal */}
      <ClinicCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </>
  );
}
