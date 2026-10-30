import React from 'react';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SuperAdminAuthLayout({
  children,
  title = 'Superadmin Sign In',
  subtitle = 'Enter your high-privilege credentials to access the executive portal.',
}) {
  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Container: 2-column layout on desktop, 1-column on mobile */}
      <div className="w-full max-w-5xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-300/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: ERP Branding & Abstract Tech Illustration    */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Subtle geometric line pattern overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top ERP Branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-white uppercase block leading-tight">
                  INIYA<span className="text-blue-400"> ERP</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-blue-300">
                  Core Management Platform
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>EXECUTIVE ROOT ACCESS</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              Executive Governance &amp; Security Control
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              High-security enterprise administration. Strictly isolated governance architecture with dedicated cryptographic security barriers.
            </p>
          </div>

          {/* Subtle Abstract Technology Illustration (SVG) */}
          <div className="relative z-10 my-8 py-4 flex items-center justify-center">
            <svg
              className="w-full max-w-[280px] h-auto drop-shadow-lg"
              viewBox="0 0 320 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Central Grid and Tech Nodes */}
              <rect x="20" y="20" width="280" height="160" rx="16" fill="#0f172a" fillOpacity="0.6" stroke="#1e293b" strokeWidth="1.5" />
              
              {/* Encrypted Central Safe Node */}
              <circle cx="160" cy="100" r="38" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx="160" cy="100" r="26" fill="#1d4ed8" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1.5" />
              
              {/* Inner Shield icon */}
              <path
                d="M160 86L172 91V102C172 109 166.8 114.5 160 116C153.2 114.5 148 109 148 102V91L160 86Z"
                fill="#2563eb"
                stroke="#93c5fd"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Connecting circuit lines */}
              <line x1="50" y1="60" x2="124" y2="92" stroke="#334155" strokeWidth="1.5" />
              <line x1="270" y1="60" x2="196" y2="92" stroke="#334155" strokeWidth="1.5" />
              <line x1="60" y1="150" x2="124" y2="110" stroke="#334155" strokeWidth="1.5" />
              <line x1="260" y1="150" x2="196" y2="110" stroke="#334155" strokeWidth="1.5" />

              {/* Peripheral Nodes */}
              <circle cx="50" cy="60" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="270" cy="60" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
              <circle cx="60" cy="150" r="10" fill="#0f172a" stroke="#818cf8" strokeWidth="2" />
              <circle cx="260" cy="150" r="10" fill="#0f172a" stroke="#818cf8" strokeWidth="2" />

              {/* Data pulse dots */}
              <circle cx="87" cy="76" r="3" fill="#60a5fa" />
              <circle cx="233" cy="76" r="3" fill="#60a5fa" />
              <circle cx="92" cy="130" r="3" fill="#a5b4fc" />
              <circle cx="228" cy="130" r="3" fill="#a5b4fc" />

              {/* Bottom status text */}
              <text x="160" y="165" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="sans-serif" fontWeight="600" letterSpacing="1">
                ISOLATED SUPERADMIN BARRIER
              </text>
            </svg>
          </div>

          {/* Security Features Bullet List */}
          <div className="relative z-10 space-y-2 border-t border-slate-800/80 pt-5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dedicated <code className="text-blue-300 font-mono text-[11px]">super_admins</code> database table</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sanctum Token &amp; Middleware Authorization Barriers</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cryptographic Bcrypt Hashing &amp; Turnstile CAPTCHA</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Form Card in Clean Light Theme               */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
          {/* Top header navigation between portals if needed */}
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Superadmin Workspace
              </span>
            </div>

            <Link
              to="/admin"
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              Switch to Standard Admin &rarr;
            </Link>
          </div>

          {/* Card Header */}
          <div className="my-auto py-4">
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Dynamic Form Content */}
            {children}
          </div>

          {/* Security Notice Footer */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>TLS / AES-256 Encrypted Session</span>
            </div>
            <div>
              &copy; {new Date().getFullYear()} Iniya ERP. All rights reserved.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
