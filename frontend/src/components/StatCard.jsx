import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'blue', // 'blue' | 'emerald' | 'amber' | 'violet' | 'rose'
}) {
  const schemes = {
    blue: {
      bg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      border: 'border-blue-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      border: 'border-amber-100',
    },
    violet: {
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      border: 'border-purple-100',
    },
    rose: {
      bg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      border: 'border-rose-100',
    },
  };

  const current = schemes[colorScheme] || schemes.blue;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex items-start justify-between">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${current.bg} ${current.iconColor} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

