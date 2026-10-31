import React from 'react';

/**
 * Premium Shimmer Skeleton Loader for Dashboards (matching visual reference)
 */
export default function DashboardSkeleton({ title = 'Loading dashboard metrics...' }) {
  return (
    <div className="space-y-5 animate-pulse font-sans">
      {/* 1. Header Banner Skeleton (Light Pastel) */}
      <div className="bg-gradient-to-r from-blue-100/70 via-sky-50/70 to-blue-50/30 rounded-2xl p-6 sm:p-7 border border-blue-100/60 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3 max-w-xl w-full">
            <div className="h-4 w-32 bg-blue-200/50 rounded-full" />
            <div className="h-8 w-72 bg-blue-200/60 rounded-xl" />
            <div className="h-4 w-96 max-w-full bg-blue-200/40 rounded-lg" />
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="h-8 w-28 bg-white/80 rounded-full" />
            <div className="h-24 w-44 bg-blue-200/30 rounded-2xl hidden lg:block" />
          </div>
        </div>
      </div>

      {/* 2. 6 KPI Cards Grid Skeleton (3 by 3: 3 Top, 3 Below) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[145px]"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-24 bg-slate-100 rounded" />
                <div className="h-7 w-28 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
              <div className="h-3 w-16 bg-slate-100 rounded" />
              <div className="h-6 w-24 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Section 1 Skeleton (7 : 5 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs h-64 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-7 w-24 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-8 w-28 bg-slate-200 rounded" />
          <div className="h-32 w-full bg-slate-50 rounded-xl" />
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs h-64 flex flex-col items-center justify-center space-y-4">
          <div className="h-4 w-28 bg-slate-100 rounded self-start" />
          <div className="w-32 h-32 rounded-full border-8 border-slate-100" />
        </div>
      </div>
    </div>
  );
}
