import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Layers, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-4xl w-full text-center relative z-10 space-y-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-4">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>Dual-Tier Enterprise Management Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold text-white tracking-tight">
            INIYA ENTERPRISE SYSTEMS
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mt-3">
            Choose your administrative access level to securely authenticate with Cloudflare Turnstile verification.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Super Admin Portal Card */}
          <div className="bg-slate-900/90 border border-purple-900/40 rounded-3xl p-8 hover:border-purple-500/60 transition-all duration-300 shadow-xl group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
                Executive Tier
              </span>
              <h2 className="text-xl font-bold text-white mb-2">Super Admin Portal</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Complete system oversight, create and provision administrator accounts, manage access status, reset admin credentials, and audit security events.
              </p>

              <ul className="text-xs text-slate-300 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Admin CRUD & status management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Executive analytics & live audit trail</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Strictly isolated authentication table</span>
                </li>
              </ul>
            </div>

            <Link
              to="/superadmin"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/50 transition-all"
            >
              <span>Access Super Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Admin Portal Card */}
          <div className="bg-slate-900/90 border border-blue-900/40 rounded-3xl p-8 hover:border-blue-500/60 transition-all duration-300 shadow-xl group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                Operational Tier
              </span>
              <h2 className="text-xl font-bold text-white mb-2">Admin Portal</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Standard administrator interface to monitor assigned dashboards, review personal access activity, update credentials, and manage profile settings.
              </p>

              <ul className="text-xs text-slate-300 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Personal operations dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Secure credential management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Zero privilege escalation to Super Admin</span>
                </li>
              </ul>
            </div>

            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/50 transition-all"
            >
              <span>Access Admin Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="text-xs text-slate-600">
          Powered by Laravel 13 Sanctum & React. Protected by Cloudflare Turnstile.
        </div>
      </div>
    </div>
  );
}

