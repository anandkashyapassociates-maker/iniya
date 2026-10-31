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
 * Modern 3D Clinic Healthcare Brand Emblem (Medical Cross with dynamic ECG heartbeat pulse wave)
 */
export function ClinicBrandIcon({
  size = 40,
  className = '',
  showPing = true,
  variant = 'blue', // 'blue' | 'purple'
}) {
  const gradient =
    variant === 'purple'
      ? 'from-purple-600 via-indigo-600 to-blue-600 shadow-purple-600/30'
      : 'from-blue-600 via-indigo-600 to-cyan-500 shadow-blue-600/30';

  return (
    <div
      className={`relative rounded-xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center shrink-0 shadow-md icon-3d transition-transform hover:scale-105 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Specular glass reflection overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/30 via-white/5 to-transparent pointer-events-none" />

      {/* Modern Medical Cross + ECG Heartbeat Wave SVG */}
      <svg
        viewBox="0 0 32 32"
        className="w-5 h-5 drop-shadow-sm"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Medical Cross Silhouette Background */}
        <path
          d="M12 4C12 2.89543 12.8954 2 14 2H18C19.1046 2 20 2.89543 20 4V10H26C27.1046 10 28 10.8954 28 12V16C28 17.1046 27.1046 18 26 18H20V24C20 25.1046 19.1046 26 18 26H14C12.8954 26 12 25.1046 12 24V18H6C4.89543 18 4 17.1046 4 16V12C4 10.8954 4.89543 10 6 10H12V4Z"
          fill="white"
          fillOpacity="0.22"
        />

        {/* Dynamic ECG Pulse Wave cutting across the cross */}
        <path
          d="M3 15H9L11 9L14.5 22L17.5 8L20.5 17L22.5 15H29"
          stroke="white"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pulse center core light dot */}
        <circle cx="14.5" cy="22" r="1.3" fill="#67e8f9" />
      </svg>

      {/* Pulsing online status indicator on top-right corner */}
      {showPing && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-slate-950" />
        </span>
      )}
    </div>
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
 * Animated Modern Clinic Room Background for Dashboard Welcome Banner
 * Features daylight clinic window, consultation station, animated ECG telemetry wave,
 * ambient sunbeam, live monitor vitals, and high-readability protective text veil.
 */
export function ClinicBannerBackground({ isSuperAdmin = false }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* 1. Base Gradient Canvas */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100/95 via-sky-50/85 to-blue-50/40" />

      {/* 2. Soft Ambient Sunbeam & Lighting */}
      <div className="absolute -top-24 right-1/4 w-96 h-96 bg-gradient-to-b from-sky-300/20 via-blue-200/10 to-transparent rounded-full blur-3xl animate-sunbeam" />
      <div className="absolute top-0 right-10 w-72 h-48 bg-gradient-to-br from-white/40 to-transparent rotate-12 blur-2xl animate-sunbeam" />

      {/* 3. Modern Clinic Interior Architectural SVG (Anchored Right) */}
      <div className="absolute inset-y-0 right-0 w-full md:w-3/5 lg:w-1/2 flex items-center justify-end pr-2 sm:pr-8">
        <svg
          viewBox="0 0 460 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full max-h-[170px] object-contain drop-shadow-sm"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="clinicWindowSky" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#e0f2fe" />
              <stop offset="1" stopColor="#bae6fd" />
            </linearGradient>
            <linearGradient id="chairLeather" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#2563eb" />
              <stop offset="1" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="monitorScreen" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#0f172a" />
              <stop offset="1" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="deskWood" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#f1f5f9" />
            </linearGradient>
          </defs>

          {/* Clinic Panoramic Window with Daylight */}
          <g opacity="0.85">
            <rect x="220" y="10" width="220" height="110" rx="10" fill="url(#clinicWindowSky)" stroke="#93c5fd" strokeWidth="2" />
            {/* Window muntins / dividers */}
            <line x1="330" y1="10" x2="330" y2="120" stroke="#bae6fd" strokeWidth="2.5" />
            <line x1="220" y1="65" x2="440" y2="65" stroke="#bae6fd" strokeWidth="2.5" />
            {/* Soft outdoor silhouettes */}
            <path d="M230 90h30v25h-30z M275 80h45v35h-45z M350 85h50v30h-50z" fill="#93c5fd" opacity="0.3" />
            <circle cx="410" cy="40" r="14" fill="#fef08a" opacity="0.5" className="animate-pulse" />
          </g>

          {/* Medical Cross Wall Watermark with Soft Glow */}
          <g transform="translate(160, 20)" opacity="0.28" className="animate-float-subtle">
            <rect x="18" y="0" width="14" height="50" rx="4" fill="#3b82f6" />
            <rect x="0" y="18" width="50" height="14" rx="4" fill="#3b82f6" />
          </g>

          {/* Doctor Executive Chair with subtle floating breathing */}
          <g className="animate-float-subtle">
            <rect x="110" y="44" width="56" height="64" rx="18" fill="url(#chairLeather)" stroke="#1e40af" strokeWidth="1.5" />
            <rect x="104" y="100" width="68" height="14" rx="7" fill="#1e3a8a" />
            {/* Armrests */}
            <rect x="98" y="68" width="10" height="28" rx="4" fill="#1e3a8a" />
            <rect x="168" y="68" width="10" height="28" rx="4" fill="#1e3a8a" />
            {/* Hydraulic stem & 5-star roller base */}
            <rect x="134" y="114" width="8" height="26" rx="3" fill="#64748b" />
            <path d="M112 140h52l8 12h-68z" fill="#334155" rx="3" />
            <circle cx="118" cy="154" r="3.5" fill="#1e293b" />
            <circle cx="158" cy="154" r="3.5" fill="#1e293b" />
          </g>

          {/* Modern Clinic Consultation Desk */}
          <g>
            {/* Desk Top Chamfer */}
            <path d="M160 92h280l8 12H148z" fill="url(#deskWood)" stroke="#cbd5e1" strokeWidth="1.2" />
            {/* Desk Pedestal & Drawers */}
            <rect x="156" y="104" width="276" height="56" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            {/* Metallic Slim Desk Legs */}
            <rect x="175" y="160" width="8" height="12" rx="2" fill="#94a3b8" />
            <rect x="410" y="160" width="8" height="12" rx="2" fill="#94a3b8" />
            <line x1="260" y1="108" x2="260" y2="156" stroke="#f1f5f9" strokeWidth="1.5" />
          </g>

          {/* Doctor Vitals / Telemetry Monitor with LIVE animated ECG */}
          <g transform="translate(260, 62)">
            <rect x="0" y="0" width="56" height="34" rx="5" fill="url(#monitorScreen)" stroke="#38bdf8" strokeWidth="1.5" className="animate-vital-pulse" />
            <rect x="23" y="34" width="10" height="8" fill="#475569" />
            <rect x="16" y="42" width="24" height="3" rx="1.5" fill="#334155" />
            
            {/* Live Animated ECG Pulse inside Monitor */}
            <path
              d="M3 17h10l3-8 4 16 4-11 3 6h10l3-7 3 9 3-5h4"
              stroke="#22d3ee"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="80"
              className="animate-ecg-flow"
            />
            {/* Blinking green telemetry LED */}
            <circle cx="50" cy="6" r="2" fill="#10b981" className="animate-ping" />
          </g>

          {/* Medical Chart Clipboard & Stethoscope on Desk */}
          <g transform="translate(195, 96)">
            <rect x="0" y="0" width="30" height="20" rx="3" fill="#f8fafc" stroke="#93c5fd" strokeWidth="1" />
            <rect x="8" y="-3" width="14" height="4" rx="2" fill="#3b82f6" />
            <line x1="5" y1="5" x2="16" y2="5" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="5" y1="10" x2="25" y2="10" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="5" y1="14" x2="20" y2="14" stroke="#cbd5e1" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* Potted Therapeutic Clinic Palm/Indoor Plant */}
          <g transform="translate(390, 80)">
            <path d="M12 28l5-24h18l5 24z" fill="#64748b" stroke="#475569" strokeWidth="1" />
            {/* Lush animated leaves */}
            <path d="M26 4c-12-16-24-4-16 10" fill="#10b981" className="animate-float-subtle" />
            <path d="M26 4c12-16 24-4 16 10" fill="#059669" />
            <path d="M26 4c-4-20 4-20 0 0" fill="#34d399" />
            <path d="M28 8c8-12 18-6 12 6" fill="#10b981" />
          </g>
        </svg>
      </div>

      {/* 4. Panoramic ECG Heartbeat Waveform traversing across the banner */}
      <div className="absolute inset-y-0 left-1/4 right-0 flex items-center justify-center opacity-30 pointer-events-none">
        <svg viewBox="0 0 800 60" fill="none" className="w-full h-10 overflow-visible" preserveAspectRatio="none">
          <path
            d="M0 30 H250 L270 12 L285 52 L300 4 L320 46 L335 22 L350 36 L365 30 H800"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="400"
            className="animate-ecg-flow"
          />
        </svg>
      </div>

      {/* 5. Left-Side Readability Scrim (Protective glass veil ensuring text clarity) */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-3/5 lg:w-1/2 bg-gradient-to-r from-blue-100/98 via-sky-50/92 to-transparent z-[1] backdrop-blur-[0.5px]" />
    </div>
  );
}

/**
 * Clinic Hero Graphic for Admin/SuperAdmin Dashboard (Daylight / Modern SaaS Office)
 */
export function ClinicDashboardBannerIllustration() {
  return (
    <div className="relative w-full max-w-[280px] h-[130px] select-none hidden lg:block">
      <svg
        viewBox="0 0 280 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="officeWindow" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#e0f2fe" />
            <stop offset="1" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="chairGrad" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="plantPot" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#94a3b8" />
            <stop offset="1" stopColor="#64748b" />
          </linearGradient>
        </defs>

        {/* Office Background Window with daylight */}
        <rect x="140" y="8" width="130" height="75" rx="6" fill="url(#officeWindow)" opacity="0.6" />
        <line x1="205" y1="8" x2="205" y2="83" stroke="#93c5fd" strokeWidth="1.5" />
        <line x1="140" y1="45" x2="270" y2="45" stroke="#93c5fd" strokeWidth="1.5" />

        {/* Ergonomic Clinic Office Chair */}
        <rect x="75" y="32" width="46" height="52" rx="14" fill="url(#chairGrad)" />
        <rect x="70" y="80" width="56" height="12" rx="6" fill="#1e40af" />
        {/* Chair armrests & base */}
        <path d="M66 52h8v24h-8zM122 52h8v24h-8z" fill="#1e3a8a" rx="3" />
        <rect x="94" y="92" width="8" height="22" rx="3" fill="#64748b" />
        <path d="M78 114h40l6 10h-52z" fill="#475569" rx="2" />
        <circle cx="82" cy="124" r="3" fill="#334155" />
        <circle cx="114" cy="124" r="3" fill="#334155" />

        {/* Modern Clinic Consultation Desk */}
        <path d="M110 70h160l6 10h-172z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="110" y="80" width="156" height="42" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" rx="4" />
        {/* Desk metallic legs */}
        <rect x="120" y="122" width="6" height="8" rx="2" fill="#94a3b8" />
        <rect x="250" y="122" width="6" height="8" rx="2" fill="#94a3b8" />

        {/* Open Laptop on Desk */}
        <rect x="175" y="60" width="34" height="20" rx="3" fill="#1e293b" />
        <rect x="178" y="62" width="28" height="16" rx="2" fill="#0284c7" />
        {/* ECG pulse wave on laptop screen */}
        <path d="M180 70h5l2-4 3 8 2-5 2 3h10" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M168 80h48l2 3h-52z" fill="#94a3b8" />

        {/* Potted Indoor Clinic Plant */}
        <path d="M242 78l4-16h14l4 16z" fill="url(#plantPot)" />
        {/* Leaves */}
        <path d="M253 62c-8-12-16-4-12 6" fill="#10b981" />
        <path d="M253 62c8-12 16-4 12 6" fill="#059669" />
        <path d="M253 62c0-14 4-14 0 0" fill="#34d399" />

        {/* Medical Chart / Tablet on Desk */}
        <rect x="135" y="74" width="22" height="15" rx="3" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1" />
        <rect x="138" y="77" width="10" height="2" rx="1" fill="#3b82f6" />
        <rect x="138" y="81" width="16" height="2" rx="1" fill="#94a3b8" />
        <rect x="138" y="85" width="12" height="2" rx="1" fill="#94a3b8" />

        {/* Soft Ambient Floating Glow */}
        <circle cx="210" cy="35" r="15" fill="#38bdf8" fillOpacity="0.15" filter="blur(8px)" />
      </svg>
    </div>
  );
}

/**
 * Stethoscope Artwork for the Mission Card ("Better Healthcare, Brighter Tomorrow")
 */
export function ClinicStethoscopeCardIllustration({ className = 'w-24 h-24 text-white/20' }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="stethGlow" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="1" stopColor="#60a5fa" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Stethoscope Headset / Tubing */}
      <path
        d="M30 20 C30 50, 45 75, 60 75 C75 75, 90 50, 90 20"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Earpieces */}
      <circle cx="30" cy="20" r="4" fill="currentColor" />
      <circle cx="90" cy="20" r="4" fill="currentColor" />
      <path d="M26 20 h8 M86 20 h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

      {/* Stem down to Chestpiece */}
      <path
        d="M60 75 V90 C60 102, 75 102, 75 92 C75 82, 95 82, 95 95"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Chestpiece Diaphragm */}
      <circle cx="95" cy="98" r="10" stroke="currentColor" strokeWidth="3" fill="url(#stethGlow)" />
      <circle cx="95" cy="98" r="4" fill="currentColor" />

      {/* Heartbeat pulse accent behind */}
      <path
        d="M10 95 H35 L40 85 L46 108 L52 78 L58 102 L64 92 L68 98 H80"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
    </svg>
  );
}

