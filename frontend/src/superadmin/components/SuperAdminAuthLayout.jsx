import React from 'react';
import { Shield, Lock, CheckCircle2, Stethoscope, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClinicAuthIllustration } from '../../components/ClinicArtwork';

export default function SuperAdminAuthLayout({
  children,
  title = 'Superadmin Sign In',
  subtitle = 'Enter your high-privilege credentials to access the executive portal.',
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-800 flex flex-col justify-center items-center p-3 sm:p-6 lg:p-8 font-sans antialiased selection:bg-purple-600 selection:text-white relative overflow-hidden">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full bg-purple-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-blue-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Container: 2-column layout on desktop, 1-column on mobile */}
      <div className="w-full max-w-5xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl shadow-slate-950/40 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] relative z-10">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: Executive Branding & Clinical Artwork         */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-9 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* Top ERP & Clinic Branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-medium tracking-tight text-white uppercase block leading-tight font-sans">
                  INIYA <span className="text-purple-400">HOSPITAL</span>
                </span>
                <span className="text-[10px] font-medium tracking-wider uppercase text-purple-300">
                  Superadmin Executive Gateway
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300 text-[11px] font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>EXECUTIVE ROOT AUTHORIZATION</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight leading-snug">
              Clinical Governance &amp; Multi-Department Security
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed">
              Super-administrative portal for clinic operations, staff roster oversight, vendor partnerships, and system parameters.
            </p>
          </div>

          {/* Animated Clinical Artwork */}
          <div className="relative z-10 my-4 py-2 flex items-center justify-center">
            <ClinicAuthIllustration isSuperAdmin={true} />
          </div>

          {/* Security Features Bullet List */}
          <div className="relative z-10 space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dedicated <code className="text-purple-300 font-mono text-[11px]">super_admins</code> database barrier</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              <span>Hospital Staff, Vendor &amp; OPD Telemetry Control</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Form Card in Clean Light Theme               */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-9 lg:p-11 flex flex-col justify-between bg-white">
          {/* Top header navigation between portals if needed */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">
                Superadmin Workspace
              </span>
            </div>

            <Link
              to="/admin"
              className="text-xs font-medium text-slate-500 hover:text-purple-600 transition-colors"
            >
              Switch to Standard Admin &rarr;
            </Link>
          </div>

          {/* Card Header */}
          <div className="my-auto py-2">
            <div className="mb-5">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Dynamic Form Content */}
            {children}
          </div>

          {/* Security Notice Footer */}
          <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>TLS / AES-256 Encrypted Session</span>
            </div>
            <div>
              &copy; {new Date().getFullYear()} Iniya Hospital &amp; Clinic Suite.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
