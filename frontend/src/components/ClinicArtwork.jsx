import React from 'react';

/**
 * Animated SVG Heartbeat (ECG) waveform line
 */
export function ClinicHeartbeatLine({ className = 'w-full h-8 text-blue-500' }) {
  return (
    <svg
      viewBox="0 0 500 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M0 30 H120 L135 15 L145 48 L155 8 L170 42 L180 25 L190 35 L200 30 H500"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-pulse"
      />
    </svg>
  );
}

/**
 * Medical Cross & Radar Pulse Animation
 */
export function ClinicCrossBadge({ size = 48, className = '' }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer pulsing ring */}
      <span className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
      {/* Inner glowing background */}
      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 4v16m-8-8h16" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Comprehensive Medical / Clinic Illustration for Auth pages (Login & Forgot Password)
 */
export function ClinicAuthIllustration({ isSuperAdmin = false }) {
  return (
    <div className="relative w-full max-w-[380px] mx-auto select-none">
      {/* Outer ambient glow circles */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main SVG Graphic */}
      <svg
        className="w-full h-auto drop-shadow-2xl"
        viewBox="0 0 380 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="clinicGrad" x1="0" y1="0" x2="380" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor={isSuperAdmin ? '#1e1b4b' : '#0f172a'} />
            <stop offset="1" stopColor={isSuperAdmin ? '#312e81' : '#1e293b'} />
          </linearGradient>

          <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#38bdf8" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>

          <linearGradient id="ecgGrad" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="0.5" stopColor="#38bdf8" />
            <stop offset="1" stopColor="#38bdf8" stopOpacity="0.2" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Central Hospital / Clinic Glass Panel */}
        <rect
          x="30"
          y="25"
          width="320"
          height="250"
          rx="24"
          fill="url(#clinicGrad)"
          fillOpacity="0.85"
          stroke={isSuperAdmin ? '#4338ca' : '#1e3a8a'}
          strokeWidth="1.5"
        />

        {/* Grid pattern */}
        <line x1="30" y1="100" x2="350" y2="100" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
        <line x1="30" y1="180" x2="350" y2="180" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
        <line x1="120" y1="25" x2="120" y2="275" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
        <line x1="260" y1="25" x2="260" y2="275" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />

        {/* Central Pulse Shield */}
        <circle cx="190" cy="130" r="54" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" opacity="0.7" />
        <circle cx="190" cy="130" r="42" fill="#1e3a8a" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1.5" />
        
        {/* Medical Cross in Center */}
        <rect x="183" y="106" width="14" height="48" rx="4" fill="#38bdf8" />
        <rect x="166" y="123" width="48" height="14" rx="4" fill="#38bdf8" />

        {/* Glowing Heartbeat ECG Waveform running through the center */}
        <path
          d="M45 195 H120 L135 170 L145 220 L160 150 L175 210 L188 185 L200 200 L210 195 H335"
          stroke="url(#ecgGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {/* Satellite Node: Stethoscope Icon Node */}
        <g transform="translate(65, 55)">
          <circle cx="20" cy="20" r="20" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <path
            d="M13 13 C13 23 27 23 27 13 M20 20 V25 A3 3 0 0 0 23 28 H24"
            stroke="#93c5fd"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="25" cy="28" r="2" fill="#93c5fd" />
        </g>

        {/* Satellite Node: Heart Pulse Node */}
        <g transform="translate(275, 55)">
          <circle cx="20" cy="20" r="20" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.5" />
          <path
            d="M14 20 L18 15 L22 25 L26 20 H28"
            stroke="#fb7185"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Satellite Node: Security Shield */}
        <g transform="translate(65, 205)">
          <circle cx="20" cy="20" r="20" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <path
            d="M20 12 L27 15 V20 C27 25 24 28 20 29 C16 28 13 25 13 20 V15 Z"
            fill="#059669"
            fillOpacity="0.4"
            stroke="#34d399"
            strokeWidth="1.5"
          />
        </g>

        {/* Satellite Node: Medical Chart */}
        <g transform="translate(275, 205)">
          <circle cx="20" cy="20" r="20" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" />
          <rect x="14" y="13" width="12" height="14" rx="2" stroke="#c084fc" strokeWidth="1.5" />
          <line x1="17" y1="17" x2="23" y2="17" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17" y1="21" x2="21" y2="21" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        {/* Connecting Neon Lines */}
        <line x1="105" y1="75" x2="150" y2="105" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="275" y1="75" x2="230" y2="105" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="105" y1="225" x2="150" y2="170" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="275" y1="225" x2="230" y2="170" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />

        {/* Bottom Hospital Status Pill */}
        <rect x="110" y="240" width="160" height="24" rx="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="125" cy="252" r="3.5" fill="#10b981" />
        <text x="135" y="256" fill="#e2e8f0" fontSize="9" fontFamily="sans-serif" fontWeight="600" letterSpacing="0.8">
          24/7 CLINIC OPD ACTIVE
        </text>
      </svg>
    </div>
  );
}

/**
 * Clinic Hero Graphic for Admin/SuperAdmin Dashboard
 */
export function ClinicDashboardBannerIllustration() {
  return (
    <div className="relative w-full max-w-[260px] h-auto select-none hidden md:block">
      <svg
        viewBox="0 0 260 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-xl"
      >
        <rect x="10" y="10" width="240" height="140" rx="20" fill="#0f172a" fillOpacity="0.7" stroke="#334155" strokeWidth="1.5" />
        
        {/* Floating cross badge */}
        <circle cx="60" cy="55" r="24" fill="#0284c7" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M60 43v24m-12-12h24" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />

        {/* Floating Heart with ECG */}
        <rect x="110" y="35" width="120" height="42" rx="12" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        <circle cx="128" cy="56" r="4" fill="#10b981" className="animate-ping" />
        <circle cx="128" cy="56" r="4" fill="#10b981" />
        <path d="M142 56h10l4-7 5 14 4-9 3 5h20" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Clinical Patient Record Mini Card */}
        <rect x="35" y="95" width="190" height="40" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="1" />
        <circle cx="55" cy="115" r="10" fill="#3b82f6" />
        <rect x="75" y="108" width="60" height="6" rx="3" fill="#cbd5e1" />
        <rect x="75" y="118" width="40" height="5" rx="2.5" fill="#64748b" />
        <rect x="175" y="108" width="35" height="14" rx="7" fill="#059669" fillOpacity="0.2" stroke="#10b981" strokeWidth="1" />
      </svg>
    </div>
  );
}
