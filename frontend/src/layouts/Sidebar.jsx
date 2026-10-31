import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  User,
  KeyRound,
  Shield,
  Stethoscope,
  HeartPulse,
  LogOut,
  X,
  Calendar,
  Boxes,
  PlusCircle,
  ChevronDown,
} from 'lucide-react';
import { ClinicBrandIcon } from '../components/ClinicArtwork';

export default function Sidebar({
  role = 'admin', // 'superadmin' | 'admin'
  user,
  onLogout,
  isOpen = false,
  onClose,
}) {
  const isSuperAdmin = role === 'superadmin';
  const location = useLocation();

  const isInInventory = location.pathname.startsWith('/admin/inventory');
  const [inventoryOpen, setInventoryOpen] = useState(isInInventory);

  useEffect(() => {
    if (isInInventory) {
      setInventoryOpen(true);
    }
  }, [isInInventory]);

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
      to: '/admin/appointments',
      label: 'Appointments',
      icon: Calendar,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const inventorySubItems = [
    {
      to: '/admin/inventory/products/create',
      label: 'Create Product',
      icon: PlusCircle,
    },
  ];

  const adminFooterNavItems = [
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
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-18 px-5 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <ClinicBrandIcon size={40} variant={isSuperAdmin ? 'purple' : 'blue'} />
              <div>
                <span className="text-sm font-bold tracking-tight text-white block leading-snug font-display">
                  Iniya Clinic<span className="text-blue-400">.</span>OPD
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 micro-label">
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

          {/* Scrollable Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 micro-label">
              Clinical Desk Modules
            </div>

            {isSuperAdmin ? (
              superAdminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600/25 via-indigo-600/15 to-transparent text-white border-l-4 border-blue-500 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300`}
                    >
                      <Icon className="w-4 h-4 drop-shadow-sm" />
                    </div>
                    <span className="truncate group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                  </NavLink>
                );
              })
            ) : (
              <>
                {/* Standard Admin Top Items */}
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600/25 via-indigo-600/15 to-transparent text-white border-l-4 border-blue-500 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300`}
                      >
                        <Icon className="w-4 h-4 drop-shadow-sm" />
                      </div>
                      <span className="truncate group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                    </NavLink>
                  );
                })}

                {/* ======================================================== */}
                {/* INVENTORY MANAGEMENT ACCORDION SECTION (Phase 5)         */}
                {/* ======================================================== */}
                <div className="pt-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setInventoryOpen(!inventoryOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer group ${
                      isInInventory
                        ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 transition-all">
                        <Boxes className="w-4 h-4 drop-shadow-sm" />
                      </div>
                      <span className="truncate">Inventory Management</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        inventoryOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </button>

                  {/* Collapsible Submenu */}
                  {inventoryOpen && (
                    <div className="pl-4 pr-1 pt-1.5 space-y-1">
                      {inventorySubItems.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <NavLink
                            key={sub.to}
                            to={sub.to}
                            end
                            onClick={onClose}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                isActive
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                              }`
                            }
                          >
                            <SubIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Profile & Security Footer Items */}
                {adminFooterNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600/25 via-indigo-600/15 to-transparent text-white border-l-4 border-blue-500 shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300`}
                      >
                        <Icon className="w-4 h-4 drop-shadow-sm" />
                      </div>
                      <span className="truncate group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                    </NavLink>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Bottom Section: Clinic Help & User Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3 shrink-0">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-950/70 to-indigo-950/70 border border-blue-900/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-1 font-display">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>OPD Helpline 24/7</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal leading-tight">
              Emergency &amp; triage support desk active.
            </p>
          </div>

          <div className="flex items-center gap-3 px-1 pt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0 font-display">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate font-display tracking-tight">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {user?.email || 'admin@example.com'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-rose-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
