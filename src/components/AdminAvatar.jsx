import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageUrl';

export default function AdminAvatar({
  admin,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  const rawPhoto = admin?.image_url || admin?.image || admin?.profile_photo;

  useEffect(() => {
    setImgError(false);
  }, [rawPhoto, admin?.id]);

  const resolvedSrc = rawPhoto ? getImageUrl(rawPhoto) : null;

  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-12 h-12 rounded-xl',
  }[size] || 'w-8 h-8 rounded-lg';

  if (resolvedSrc && !imgError) {
    return (
      <img
        src={resolvedSrc}
        alt={admin?.name || 'Administrator'}
        className={`${sizeClasses} object-cover border border-slate-200 shrink-0 shadow-2xs ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Elegant Executive Administrator SVG Avatar
  return (
    <div
      className={`${sizeClasses} overflow-hidden shrink-0 border border-indigo-200/90 shadow-2xs flex items-center justify-center ${className}`}
      title={admin?.name || 'Administrator'}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background gradient */}
        <rect width="48" height="48" rx="10" fill="#EEF2FF" />

        {/* Shield / Key Security Emblem */}
        <rect x="34" y="6" width="8" height="8" rx="2" fill="#E0E7FF" />
        <path
          d="M38 8v4M36 10h4"
          stroke="#4F46E5"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Head */}
        <circle cx="24" cy="18" r="8" fill="#4F46E5" />
        <circle cx="24" cy="18" r="6.5" fill="#FED7AA" />
        {/* Hair */}
        <path
          d="M17.5 17c0-4 2.9-7 6.5-7s6.5 3 6.5 7c-2-1.5-4-2-6.5-2s-4.5.5-6.5 2z"
          fill="#1E1B4B"
        />

        {/* Executive Suit / Shoulders */}
        <path
          d="M10 44c0-7.732 6.268-14 14-14s14 6.268 14 14H10z"
          fill="#312E81"
        />
        {/* White Shirt Collar */}
        <path d="M18 44l6-13 6 13H18z" fill="#FFFFFF" />
        {/* Executive Tie */}
        <path d="M22 31h4l-1 9-1 2-1-2-1-9z" fill="#6366F1" />
      </svg>
    </div>
  );
}

