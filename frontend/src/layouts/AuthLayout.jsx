import React from 'react';
import { Shield, Lock, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthLayout({
  children,
  role = 'admin', // 'superadmin' | 'admin'
  title,
  subtitle,
}) {
  const isSuperAdmin = role === 'superadmin';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-950 relative overflow-hidden">
      {/* Dynamic ambient backgrounds */}
      {isSuperAdmin ? (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-600/15 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
        </>
      )}

      {/* Grid texture overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Top Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
              isSuperAdmin 
                ? 'bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-purple-900/30' 
                : 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-blue-900/30'
            }`}>
              {isSuperAdmin ? <Shield className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <span className="text-xl font-bold tracking-tight text-white uppercase font-display">
              INIYA<span className="text-blue-500">.</span>CORE
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`text-[10px] font-extrabold uppercase tracking-widest micro-label px-3 py-1 rounded-full border ${
              isSuperAdmin
                ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                : 'bg-blue-950/60 text-blue-300 border-blue-800/60'
            }`}>
              {isSuperAdmin ? 'Super Administrator Access' : 'Administrative Console'}
            </span>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>

        {/* Form Container Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {children}
        </div>

        {/* Portal switcher link & footer */}
        <div className="text-center mt-6 text-xs text-slate-500 flex flex-col gap-2">
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
            &copy; {new Date().getFullYear()} Iniya Security System. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
