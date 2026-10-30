import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  User,
  KeyRound,
  Shield,
  Layers,
  LogOut,
  X,
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
    },
    {
      to: '/superadmin/admins',
      label: 'Manage Admins',
      icon: Users,
    },
    {
      to: '/superadmin/admins/create',
      label: 'Create Admin',
      icon: UserPlus,
    },
    {
      to: '/superadmin/profile',
      label: 'Profile & Security',
      icon: User,
    },
  ];

  const adminNavItems = [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/customers',
      label: 'Customers Directory',
      icon: Users,
    },
    {
      to: '/admin/customers/create',
      label: 'Create Customer',
      icon: UserPlus,
    },
    {
      to: '/admin/profile',
      label: 'Account Profile',
      icon: User,
    },
    {
      to: '/admin/change-password',
      label: 'Change Password',
      icon: KeyRound,
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
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
                isSuperAdmin
                  ? 'bg-gradient-to-tr from-blue-600 to-purple-600 text-white'
                  : 'bg-gradient-to-tr from-blue-600 to-cyan-500 text-white'
              }`}
            >
              {isSuperAdmin ? <Shield className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white uppercase block leading-none">
                INIYA<span className="text-blue-500">.</span>CORE
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                {isSuperAdmin ? 'Super Admin' : 'Admin Panel'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? isSuperAdmin
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User profile & Logout footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || 'admin@example.com'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-rose-400 bg-slate-800 hover:bg-slate-800/80 rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

