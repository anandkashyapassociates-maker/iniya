import React from 'react';
import useCountUp from '../hooks/useCountUp';
import { StatWaveSparkline } from './MiniCharts';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue', // 'blue' | 'emerald' | 'amber' | 'purple' | 'violet' | 'cyan' | 'rose'
  sparklineData,
  trend,
  className = '',
  animateCount = true,
}) {
  const isNumeric = typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
  const animatedValue = useCountUp(isNumeric && animateCount ? value : 0);
  const displayValue = isNumeric && animateCount ? animatedValue : value;

  const schemes = {
    blue: {
      gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-blue-500/30',
      border: 'hover:border-blue-200',
      softBg: 'bg-blue-50/50',
    },
    emerald: {
      gradient: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-700 shadow-emerald-500/30',
      border: 'hover:border-emerald-200',
      softBg: 'bg-emerald-50/50',
    },
    amber: {
      gradient: 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 shadow-amber-500/30',
      border: 'hover:border-amber-200',
      softBg: 'bg-amber-50/50',
    },
    purple: {
      gradient: 'bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700 shadow-purple-500/30',
      border: 'hover:border-purple-200',
      softBg: 'bg-purple-50/50',
    },
    violet: {
      gradient: 'bg-gradient-to-br from-purple-500 via-violet-600 to-indigo-700 shadow-purple-500/30',
      border: 'hover:border-purple-200',
      softBg: 'bg-purple-50/50',
    },
    cyan: {
      gradient: 'bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 shadow-cyan-500/30',
      border: 'hover:border-cyan-200',
      softBg: 'bg-cyan-50/50',
    },
    rose: {
      gradient: 'bg-gradient-to-br from-rose-400 via-rose-500 to-pink-600 shadow-rose-500/30',
      border: 'hover:border-rose-200',
      softBg: 'bg-rose-50/50',
    },
  };

  const current = schemes[colorScheme] || schemes.blue;

  return (
    <div
      className={`bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group min-h-[145px] ${current.border} ${className}`}
    >
      {/* Top Section: 3D Animated Icon on Left, Title & Big Value on Right */}
      <div className="flex items-start gap-4">
        {Icon && (
          <div
            className={`w-12 h-12 rounded-2xl ${current.gradient} text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 block leading-snug">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 tracking-tight mt-1 tabular-numbers leading-tight">
            {displayValue}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-1 font-medium tracking-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Section: Trend Badge on Left, Smooth Wave Sparkline on Right */}
      <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between gap-3">
        {trend ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-bold font-mono">
              {trend.startsWith('↑') || trend.startsWith('+') ? trend : `↑ ${trend}`}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 font-medium font-mono">Standard Metric</span>
        )}

        <div className="w-24 sm:w-32 h-8 shrink-0">
          <StatWaveSparkline
            color={colorScheme}
            data={sparklineData}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
