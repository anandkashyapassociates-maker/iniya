import React from 'react';
import { Shield, Lock, Layers, Stethoscope, HeartPulse, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClinicAuthIllustration, ClinicHeartbeatLine } from '../components/ClinicArtwork';

export default function AuthLayout({
  children,
  role = 'admin', // 'superadmin' | 'admin'
  title,
  subtitle,
}) {
  const isSuperAdmin = role === 'superadmin';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 bg-slate-950 relative overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Dynamic ambient backgrounds */}
      {isSuperAdmin ? (
        <>
          <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full bg-purple-600/15 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-blue-600/15 blur-[130px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-cyan-600/15 blur-[130px] pointer-events-none" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full bg-blue-600/15 blur-[130px] pointer-events-none" />
        </>
      )}

      {/* Grid texture overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* 2-Column Responsive Card: 100% Mobile Responsive */}
      <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Clinic Theme & Animated Medical Graphic      */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/70 p-6 sm:p-9 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Subtle line background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                  isSuperAdmin
                    ? 'bg-gradient-to-tr from-purple-600 to-blue-600 text-white shadow-purple-900/40'
                    : 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-blue-900/40'
                }`}
              >
                {isSuperAdmin ? <Shield className="w-5 h-5" /> : <Stethoscope className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-base font-medium tracking-tight text-white uppercase block leading-tight font-sans">
                  INIYA <span className="text-blue-400">CLINIC</span>
                </span>
                <span className="text-[10px] font-medium tracking-wider uppercase text-blue-300">
                  {isSuperAdmin ? 'Executive Governance' : 'Doctor & OPD Care Portal'}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isSuperAdmin ? 'SUPERADMIN EXECUTIVE CONTROL' : 'CLINICAL ADMIN SYSTEM ONLINE'}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight leading-snug">
              {isSuperAdmin
                ? 'Clinical Governance & Enterprise Control'
                : 'Doctor Consultation & Hospital Records Desk'}
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 font-normal leading-relaxed">
              {isSuperAdmin
                ? 'High-level administration portal with role-based access control and comprehensive system audit logs.'
                : 'Secure clinical management platform for electronic health records, patient registration, and daily OPD appointments.'}
            </p>
          </div>

          {/* Animated Clinical Artwork */}
          <div className="relative z-10 my-4 py-2 flex items-center justify-center">
            <ClinicAuthIllustration isSuperAdmin={isSuperAdmin} />
          </div>

          {/* Bottom Security / Hospital Highlights */}
          <div className="relative z-10 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px]">256-bit Encrypted Medical Data Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
              <span className="text-[11px]">Real-Time OPD Token &amp; Consultation Tracking</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Authentication Form Card                   */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-9 lg:p-10 flex flex-col justify-between bg-slate-900/60">
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>{isSuperAdmin ? 'Executive Authentication' : 'Clinical Access Verification'}</span>
              </div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
              {subtitle && <p className="text-xs text-slate-400 font-normal mt-1">{subtitle}</p>}
            </div>

            {/* Child Form */}
            {children}
          </div>

          {/* Portal Switcher & Footer */}
          <div className="text-center mt-6 pt-5 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              {isSuperAdmin ? (
                <span>
                  Standard Admin?{' '}
                  <Link to="/admin" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    Go to Admin Login &rarr;
                  </Link>
                </span>
              ) : (
                <span>
                  Executive Super Admin?{' '}
                  <Link to="/superadmin" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                    Go to Super Admin Login &rarr;
                  </Link>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-600">
              &copy; {new Date().getFullYear()} Iniya Clinical Suite
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
