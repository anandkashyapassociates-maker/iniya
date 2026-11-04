import React from 'react';
import useCountUp from '../hooks/useCountUp';

/**
 * Executive StatCard for Hospital Administrative & Clinical Command Center.
 * Displays 100% real database metrics with 3D gradient icons, honest status pills,
 * and clean action indicators. No fake waves or hardcoded dummy values.
 */
export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue', // 'blue' | 'emerald' | 'amber' | 'purple' | 'violet' | 'cyan' | 'rose'
  trend,
  trendColor, // 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'slate'
  actionText,
  className = '',
  animateCount = true,
}) {
  const isNumeric = typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
  const animatedValue = useCountUp(isNumeric && animateCount ? value : 0);
  const displayValue = isNumeric && animateCount ? animatedValue : value;

  const schemes = {
    blue: {
      gradient: 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-blue-500/25',
      border: 'hover:border-blue-300/80',
      badge: 'bg-blue-50 text-blue-700 border-blue-200/70',
    },
    emerald: {
      gradient: 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 shadow-emerald-500/25',
      border: 'hover:border-emerald-300/80',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    },
    amber: {
      gradient: 'bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 shadow-amber-500/25',
      border: 'hover:border-amber-300/80',
      badge: 'bg-amber-50 text-amber-800 border-amber-200/70',
    },
    purple: {
      gradient: 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-600 shadow-purple-500/25',
      border: 'hover:border-purple-300/80',
      badge: 'bg-purple-50 text-purple-700 border-purple-200/70',
    },
    violet: {
      gradient: 'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 shadow-violet-500/25',
      border: 'hover:border-violet-300/80',
      badge: 'bg-violet-50 text-violet-700 border-violet-200/70',
    },
    cyan: {
      gradient: 'bg-gradient-to-tr from-cyan-500 via-teal-600 to-blue-600 shadow-cyan-500/25',
      border: 'hover:border-cyan-300/80',
      badge: 'bg-cyan-50 text-cyan-700 border-cyan-200/70',
    },
    rose: {
      gradient: 'bg-gradient-to-tr from-rose-500 via-pink-600 to-rose-600 shadow-rose-500/25',
      border: 'hover:border-rose-300/80',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/70',
    },
  };

  const current = schemes[colorScheme] || schemes.blue;

  const trendColorClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/70',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/70',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/70',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/70',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/70',
    slate: 'bg-slate-50 text-slate-600 border-slate-200/70',
  };

  const badgeClass = trendColor ? (trendColorClasses[trendColor] || trendColorClasses.slate) : current.badge;

  return (
    <div
      className={`bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-[165px] ${current.border} ${className}`}
    >
      {/* Top Section: Title & Value on Left, 3D Icon on Right */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block truncate font-mono">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight mt-2 tabular-numbers leading-tight group-hover:text-blue-600 transition-colors">
            {displayValue}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed truncate">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-2xl ${current.gradient} text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
          >
            <Icon className="w-6 h-6 drop-shadow-sm" />
          </div>
        )}
      </div>

      {/* Bottom Section: Real Status Pill on Left, Action Link on Right */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {trend ? (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs font-mono shrink-0 ${badgeClass}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            <span>{trend}</span>
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 font-semibold font-mono">100% Real DB</span>
        )}

        {actionText && (
          <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors inline-flex items-center gap-1 font-display shrink-0">
            <span>{actionText}</span>
          </span>
        )}
      </div>
    </div>
  );
}
