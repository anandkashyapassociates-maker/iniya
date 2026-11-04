import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  User,
  Shield,
  Stethoscope,
  LogOut,
  X,
  Calendar,
  CalendarDays,
  CalendarPlus,
  ListFilter,
  Sparkles,
  ChevronDown,
  Boxes,
  PlusCircle,
  AlertTriangle,
  Package,
  FolderTree,
  Layers,
  FileText,
  Wallet,
} from 'lucide-react';

export default function Sidebar({
  role = 'admin', // 'superadmin' | 'admin'
  user,
  onLogout,
  isOpen = false,
  onClose,
}) {
  const isSuperAdmin = role === 'superadmin';
  const location = useLocation();

  const isAppointmentsActive = location.pathname.startsWith('/admin/appointments');
  const [appointmentsOpen, setAppointmentsOpen] = useState(isAppointmentsActive);

  const isInReports = location.pathname.startsWith('/admin/inventory/reports') || location.pathname.startsWith('/admin/reports');
  const isInInventory = location.pathname.startsWith('/admin/inventory') && !isInReports;
  const [inventoryOpen, setInventoryOpen] = useState(isInInventory);
  const [reportsOpen, setReportsOpen] = useState(isInReports);

  useEffect(() => {
    if (isAppointmentsActive) {
      setAppointmentsOpen(true);
      setInventoryOpen(false);
      setReportsOpen(false);
    } else if (isInReports) {
      setReportsOpen(true);
      setInventoryOpen(false);
      setAppointmentsOpen(false);
    } else if (isInInventory) {
      setInventoryOpen(true);
      setReportsOpen(false);
      setAppointmentsOpen(false);
    }
  }, [isAppointmentsActive, isInReports, isInInventory]);

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
      to: '/admin/profile',
      label: 'Profile',
      icon: User,
      color: 'from-rose-500 to-pink-600',
    },
    {
      to: '/admin/customers',
      label: 'Patient Directory',
      icon: Users,
      color: 'from-teal-500 to-emerald-600',
    },
    {
      label: 'Appointments',
      icon: Calendar,
      color: 'from-blue-600 to-indigo-600',
      isDropdown: true,
      basePath: '/admin/appointments',
      children: [
        {
          to: '/admin/appointments/create',
          label: 'Create Appointments',
          icon: CalendarPlus,
        },
        {
          to: '/admin/appointments',
          label: 'Appointments Directory',
          icon: ListFilter,
          end: true,
        },
        {
          to: '/admin/appointments/services',
          label: 'Create Services',
          icon: Sparkles,
        },
        {
          to: '/admin/appointments/calendar',
          label: 'Session Calendar',
          icon: CalendarDays,
        },
      ],
    },
  ];

  const inventorySubItems = [
    {
      to: '/admin/inventory/stocks',
      label: 'Stock Ledger',
      icon: Boxes,
    },
    {
      to: '/admin/inventory/products',
      label: 'All Products',
      icon: Package,
    },
    {
      to: '/admin/inventory/products/create',
      label: 'Create Product',
      icon: PlusCircle,
    },
    {
      to: '/admin/inventory/categories',
      label: 'Categories',
      icon: FolderTree,
    },
    {
      to: '/admin/inventory/brands',
      label: 'Brands',
      icon: Layers,
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
        <div className="flex-1 flex flex-col min-h-0">
          <div className="h-24 px-3.5 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-950/40">
            <Link
              to="/admin/dashboard"
              className="flex-1 flex items-center justify-center py-1 group transition-all duration-300"
              title="Iniya Aesthetics &amp; Wellness"
            >
              <img
                src="/logo-gold.png"
                alt="Iniya Aesthetics &amp; Wellness"
                className="h-16 sm:h-[68px] w-auto max-w-[200px] object-contain drop-shadow-[0_3px_16px_rgba(255,230,170,0.3)] group-hover:scale-105 group-hover:drop-shadow-[0_5px_20px_rgba(255,230,170,0.45)] transition-all duration-300"
              />
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden ml-2 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 micro-label">
              Clinical Desk Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.isDropdown) {
                const isGroupActive = location.pathname.startsWith(item.basePath || '');
                return (
                  <div key={item.label} className="pt-1.5 pb-1">
                    <button
                      type="button"
                      onClick={() => setAppointmentsOpen((prev) => !prev)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer group ${
                        isGroupActive
                          ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${item.color || 'from-blue-600 to-indigo-600'} text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300`}
                        >
                          <Icon className="w-4 h-4 drop-shadow-sm" />
                        </div>
                        <span className="truncate group-hover:translate-x-0.5 transition-transform">{item.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          appointmentsOpen ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                    </button>

                    {appointmentsOpen && (
                      <div className="pl-4 pr-1 pt-1.5 space-y-1">
                        {item.children?.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <NavLink
                              key={sub.to}
                              to={sub.to}
                              end={sub.end}
                              onClick={onClose}
                              className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                                  isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs font-semibold'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                }`
                              }
                            >
                              {SubIcon && <SubIcon className="w-3.5 h-3.5 shrink-0" />}
                              <span className="truncate">{sub.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${
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

            {!isSuperAdmin && (
              <>
                {/* INVENTORY MANAGEMENT ACCORDION SECTION */}
                <div className="pt-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setInventoryOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer group ${
                      isInInventory
                        ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-teal-500 to-blue-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                        <Boxes className="w-4 h-4 drop-shadow-sm" />
                      </div>
                      <span className="truncate group-hover:translate-x-0.5 transition-transform">Inventory Management</span>
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

                {/* DEDICATED REPORTS SECTION BELOW INVENTORY MANAGEMENT */}
                <div className="pt-1 pb-1">
                  <button
                    type="button"
                    onClick={() => setReportsOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer group ${
                      isInReports
                        ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                        <FileText className="w-4 h-4 drop-shadow-sm" />
                      </div>
                      <span className="truncate group-hover:translate-x-0.5 transition-transform">Reports</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        reportsOpen ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </button>

                  {/* Collapsible Submenu */}
                  {reportsOpen && (
                    <div className="pl-4 pr-1 pt-1.5 space-y-1">
                      <NavLink
                        to="/admin/inventory/reports"
                        end
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`
                        }
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Inventory Reports</span>
                      </NavLink>

                      <NavLink
                        to="/admin/reports/payouts"
                        end
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                          }`
                        }
                      >
                        <Wallet className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Payouts Reports</span>
                      </NavLink>
                    </div>
                  )}
                </div>


              </>
            )}
          </div>
        </div>

        {/* Bottom Section: User Info & Sign Out */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3 shrink-0">
          <div className="flex items-center gap-3 px-1 pt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0 font-display overflow-hidden">
              {user?.image_url ? (
                <img src={user.image_url} alt={user.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-200 truncate font-display tracking-tight">
                  {user?.name || (isSuperAdmin ? 'Super Administrator' : 'Administrator')}
                </p>
                {user?.role === 'staff' && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                    Staff
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate font-mono">
                {user?.email || (isSuperAdmin ? 'superadmin@example.com' : 'admin@example.com')}
              </p>
              {user?.department && (
                <p className="text-[9px] text-slate-400 truncate font-sans">
                  {user.department} {user.staff_code ? `(${user.staff_code})` : ''}
                </p>
              )}
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
