import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageUrl';

export default function StaffAvatar({
  staff,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  const rawPhoto = staff?.image_url || staff?.profile_photo || staff?.image;

  useEffect(() => {
    setImgError(false);
  }, [rawPhoto, staff?.id]);

  const resolvedSrc = rawPhoto ? getImageUrl(rawPhoto) : null;
  const isDoctor = Boolean(
    staff?.name?.toLowerCase().includes('dr') ||
    staff?.designation?.toLowerCase().includes('dr') ||
    staff?.designation?.toLowerCase().includes('doctor') ||
    staff?.department?.toLowerCase().includes('dermatology') ||
    staff?.department?.toLowerCase().includes('dental')
  );

  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-12 h-12 rounded-xl',
  }[size] || 'w-8 h-8 rounded-lg';

  if (resolvedSrc && !imgError) {
    return (
      <img
        src={resolvedSrc}
        alt={staff?.name || 'Staff'}
        className={`${sizeClasses} object-cover border border-slate-200 shrink-0 shadow-2xs ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Realistic vector illustration of doctor / clinical staff member
  return (
    <div
      className={`${sizeClasses} overflow-hidden shrink-0 border border-slate-200/90 shadow-2xs flex items-center justify-center ${className}`}
      title={staff?.name || 'Staff'}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect
          width="48"
          height="48"
          rx="10"
          fill={isDoctor ? '#EFF6FF' : '#F0FDF4'}
        />
        {/* Medical badge icon */}
        <rect
          x="34"
          y="6"
          width="8"
          height="8"
          rx="2"
          fill={isDoctor ? '#DBEAFE' : '#DCFCE7'}
        />
        <path
          d="M38 8v4M36 10h4"
          stroke={isDoctor ? '#3B82F6' : '#16A34A'}
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Head & Hair */}
        <circle
          cx="24"
          cy="18"
          r="8"
          fill={isDoctor ? '#3B82F6' : '#10B981'}
        />
        <circle
          cx="24"
          cy="18"
          r="6.5"
          fill="#FED7AA"
        />
        {/* Hair */}
        <path
          d="M17.5 17c0-4 2.9-7 6.5-7s6.5 3 6.5 7c-2-1.5-4-2-6.5-2s-4.5.5-6.5 2z"
          fill={isDoctor ? '#1E3A8A' : '#064E3B'}
        />

        {/* Shoulders / Coat */}
        <path
          d="M10 44c0-7.732 6.268-14 14-14s14 6.268 14 14H10z"
          fill={isDoctor ? '#2563EB' : '#059669'}
        />
        {/* White Coat Lapel */}
        <path
          d="M15 44l5-12h8l5 12H15z"
          fill="#FFFFFF"
        />
        <path
          d="M20 32l4 6 4-6"
          fill={isDoctor ? '#93C5FD' : '#6EE7B7'}
        />

        {/* Stethoscope */}
        <path
          d="M18 31v5a6 6 0 0012 0v-5"
          stroke={isDoctor ? '#1D4ED8' : '#047857'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle
          cx="24"
          cy="38"
          r="2"
          fill="#F59E0B"
        />
      </svg>
    </div>
  );
}

