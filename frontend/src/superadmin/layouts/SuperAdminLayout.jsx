import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Lock,
  UserCheck,
} from 'lucide-react';
import { useSuperAdminAuth } from '../auth/SuperAdminAuthContext';
import ToastNotifications from '../../components/ToastNotifications';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminLayout() {
  const { user, logout } = useSuperAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully.');
      navigate('/superadmin');
    } catch {
      navigate('/superadmin');
    }
  };

  const navItems = [
    {
      to: '/superadmin/dashboard',
      label: 'Phase 1 Dashboard',
      icon: LayoutDashboard,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      <ToastNotifications />

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* ======================================================== */}
      {/* SIDEBAR: Modern Deep Navy Theme                          */}
      {/* ======================================================== */}
      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen`}
      >
        <div>
          {/* Logo / Header */}
          <div className="h-18 px-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-white uppercase block leading-none">
                  INIYA<span className="text-blue-500">.</span>ERP
                </span>
                <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">
                  Superadmin Console
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Executive Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Phase 1 Security Architecture Badge */}
          <div className="mx-4 mt-2 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-blue-400 font-bold mb-1 text-[11px] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Phase 1 Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Superadmin authentication barrier is active with dedicated <code className="text-blue-300 font-mono text-[10px]">super_admins</code> table and Sanctum token validation.
            </p>
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">
                  {user?.name || 'Super Administrator'}
                </p>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active" />
              </div>
              <p className="text-[11px] text-slate-400 truncate font-mono">
                {user?.email || 'superadmin@example.com'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-rose-400 bg-slate-900 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN VIEW AREA                                           */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Header */}
        <header className="h-18 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Superadmin Administration Portal
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Multi-Panel ERP Architecture • Phase 1 Identity &amp; Access Layer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Executive Auth Verified</span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="py-4 px-8 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          Iniya ERP Systems • Phase 1 Superadmin Authentication Module
        </footer>
      </div>
    </div>
  );
}
