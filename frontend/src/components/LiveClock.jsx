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
 * Clean & Eye-Catchy Digital Clinic Clock Pill Component for Navbar
 * Displays:
 * - Hospital Date Pill (Sat, 31 Oct)
 * - Smooth Obsidian Digital Time Capsule with glowing cyan colons & AM/PM badge
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
        className={`inline-flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-gradient-to-r from-blue-50/95 via-indigo-50/80 to-cyan-50/90 border border-blue-200 shadow-sm shadow-blue-500/10 hover:shadow-md hover:border-blue-300 transition-all select-none group backdrop-blur-sm ${className}`}
        title={`Indian Standard Time (IST) • Click to open Clinic & Holiday Calendar`}
      >
        {/* 1. Interactive Animated Calendar Date Button */}
        <button
          type="button"
          onClick={() => setIsCalendarOpen(true)}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50/90 border border-blue-200/80 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-bold font-display shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer group/btn"
          title="Click to view Clinic & Holiday Calendar"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-600 group-hover/btn:scale-110 transition-transform shrink-0" />
          <span className="whitespace-nowrap tracking-tight">{time.dateFormatted}</span>
        </button>

      {/* 2. Smooth Obsidian Digital Display Capsule with AM/PM */}
      <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-inner font-display">
        {/* Hours */}
        <span className="tabular-nums text-xs sm:text-lg font-bold text-white min-w-[16px] sm:min-w-[22px] text-center drop-shadow-sm tracking-wide">
          {time.hour}
        </span>

        {/* Smooth Neon-Cyan Blinking Colon */}
        <span
          className={`text-cyan-400 font-bold text-xs sm:text-lg transition-opacity duration-300 select-none mx-0.5 ${
            tick ? 'opacity-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.85)]' : 'opacity-25'
          }`}
        >
          :
        </span>

        {/* Minutes */}
        <span className="tabular-nums text-xs sm:text-lg font-bold text-white min-w-[16px] sm:min-w-[22px] text-center drop-shadow-sm tracking-wide">
          {time.minute}
        </span>

        {/* Seconds Colon (hidden on mobile) */}
        <span
          className={`hidden sm:inline text-cyan-400 font-bold text-sm sm:text-base transition-opacity duration-300 select-none mx-0.5 ${
            tick ? 'opacity-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.85)]' : 'opacity-25'
          }`}
        >
          :
        </span>

        {/* Seconds Counter (hidden on mobile, visible on sm and up) */}
        <span className="hidden sm:inline tabular-nums text-xs sm:text-sm font-semibold text-cyan-300 min-w-[20px] text-center tracking-wide">
          {time.second}
        </span>

          {/* Vibrant Gradient AM / PM Badge */}
          <span className="ml-1.5 sm:ml-2 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 text-white text-[9px] sm:text-[11px] font-black tracking-wider uppercase shadow-xs">
            {time.dayPeriod}
          </span>
        </div>
      </div>

      {/* Clean, Simple & Interactive Clinic Calendar Modal */}
      <ClinicCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </>
  );
}
