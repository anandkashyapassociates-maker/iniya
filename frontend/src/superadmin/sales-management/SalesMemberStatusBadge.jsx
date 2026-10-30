import React from 'react';
import { CheckCircle2, AlertCircle, Ban } from 'lucide-react';

export default function SalesMemberStatusBadge({ status, size = 'normal' }) {
  const isSmall = size === 'small';
  const effectiveStatus = (status || 'active').toLowerCase();

  if (effectiveStatus === 'blocked') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs ${
          isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
        }`}
      >
        <Ban className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-rose-600`} />
        <span>Blocked</span>
      </span>
    );
  }

  if (effectiveStatus === 'inactive') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs ${
          isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
        }`}
      >
        <AlertCircle className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-amber-600`} />
        <span>Inactive</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs ${
        isSmall ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      <CheckCircle2 className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-emerald-600`} />
      <span>Active</span>
    </span>
  );
}

