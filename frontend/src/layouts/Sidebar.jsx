import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  User,
  KeyRound,
  Shield,
  Stethoscope,
  HeartPulse,
  PhoneCall,
  LogOut,
  X,
  FolderTree,
} from 'lucide-react';

export default function Sidebar({
  role = 'admin', // 'superadmin' | 'admin'
  user,
  onLogout,
  isOpen = false,
  onClose,
}) {
  const isSuperAdmin = role === 'superadmin';

  const superAdminNavItems = [
    {
      to: '/superadmin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      to: '/superadmin/admins',
      label: 'Manage Admins',
      icon: Users,
      color: 'from-cyan-600 to-blue-600',
    },
    {
      to: '/superadmin/admins/create',
      label: 'Create Admin',
      icon: UserPlus,
      color: 'from-indigo-600 to-purple-600',
    },
    {
      to: '/superadmin/profile',
      label: 'Profile & Security',
      icon: User,
      color: 'from-violet-600 to-fuchsia-600',
    },
  ];

  const adminNavItems = [
    {
      to: '/admin/dashboard',
      label: 'Clinic Dashboard',
      icon: LayoutDashboard,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      to: '/admin/customers',
      label: 'Patient Directory',
      icon: Users,
      color: 'from-teal-500 to-emerald-600',
    },
    {
      to: '/admin/customers/create',
      label: 'Register New Patient',
      icon: UserPlus,
      color: 'from-violet-500 to-purple-600',
    },
    {
      to: '/admin/categories',
      label: 'Clinic Categories',
      icon: FolderTree,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      to: '/admin/profile',
      label: 'Doctor / Admin Profile',
      icon: User,
      color: 'from-rose-500 to-pink-600',
    },
    {
      to: '/admin/change-password',
      label: 'Security & Password',
      icon: KeyRound,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const navItems = isSuperAdmin ? superAdminNavItems : adminNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800/90 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Section */}
        <div>
          <div className="h-18 px-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg relative ${
                  isSuperAdmin
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-900/30'
                    : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-blue-900/40'
                }`}
              >
                {isSuperAdmin ? (
                  <Shield className="w-5 h-5" />
                ) : (
                  <Stethoscope className="w-5 h-5" />
                )}
                {/* Pulsing online status indicator */}
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
              </div>
              <div>
                <span className="text-sm font-semibold tracking-tight text-white block leading-snug">
                  Iniya Clinic<span className="text-blue-400">.</span>OPD
                </span>
                <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  {isSuperAdmin ? 'Hospital Governance' : 'Doctors On Duty'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="py-5 px-3 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Clinical Desk Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-transparent text-white border-l-4 border-blue-500 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div
                    className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Clinic Help & User Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
          {/* Clinic Emergency Quick Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-950/70 to-indigo-950/70 border border-blue-900/40">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-300 mb-1">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>OPD Helpline 24/7</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal leading-tight">
              Emergency &amp; triage support desk active.
            </p>
          </div>

          {/* Logged in admin profile */}
          <div className="flex items-center gap-3 px-1 pt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-medium shadow-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.email || 'admin@example.com'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}

