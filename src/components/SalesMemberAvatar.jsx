import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageUrl';

export default function SalesMemberAvatar({
  member,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  const rawPhoto = member?.image_url || member?.profile_photo || member?.image;

  useEffect(() => {
    setImgError(false);
  }, [rawPhoto, member?.id]);

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
        alt={member?.name || 'Sales Member'}
        className={`${sizeClasses} object-cover border border-slate-200 shrink-0 shadow-2xs ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  // Elegant Sales Partner / Growth Executive SVG Avatar
  return (
    <div
      className={`${sizeClasses} overflow-hidden shrink-0 border border-purple-200/90 shadow-2xs flex items-center justify-center ${className}`}
      title={member?.name || 'Sales Member'}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background gradient */}
        <rect width="48" height="48" rx="10" fill="#FAF5FF" />

        {/* Sales Growth / Target Icon */}
        <rect x="34" y="6" width="8" height="8" rx="2" fill="#F3E8FF" />
        <path
          d="M36 12l2-2 2 2M38 10v4"
          stroke="#9333EA"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Head */}
        <circle cx="24" cy="18" r="8" fill="#9333EA" />
        <circle cx="24" cy="18" r="6.5" fill="#FED7AA" />
        {/* Hair */}
        <path
          d="M17.5 17c0-4 2.9-7 6.5-7s6.5 3 6.5 7c-2-1.5-4-2-6.5-2s-4.5.5-6.5 2z"
          fill="#581C87"
        />

        {/* Sales Executive Blazer / Shoulders */}
        <path
          d="M10 44c0-7.732 6.268-14 14-14s14 6.268 14 14H10z"
          fill="#7E22CE"
        />
        {/* White Shirt Collar */}
        <path d="M18 44l6-13 6 13H18z" fill="#FFFFFF" />
        {/* Violet Tie */}
        <path d="M22 31h4l-1 9-1 2-1-2-1-9z" fill="#C084FC" />
      </svg>
    </div>
  );
}

