import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Lock,
  UserCheck,
  Users,
  UserPlus,
  User,
  ChevronDown,
  ListFilter,
  Truck,
  TrendingUp,
  FolderTree,
} from 'lucide-react';
import { useSuperAdminAuth } from '../auth/SuperAdminAuthContext';
import ToastNotifications from '../../components/ToastNotifications';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminLayout() {
  const { user, logout } = useSuperAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Active section identification
  const isInAdminManagement =
    location.pathname.startsWith('/superadmin/admin-management') ||
    location.pathname.startsWith('/superadmin/admins');

  const isInStaffManagement =
    location.pathname.startsWith('/superadmin/staff-management') ||
    location.pathname.startsWith('/superadmin/staff');

  const isInVendorManagement =
    location.pathname.startsWith('/superadmin/vendor-management') ||
    location.pathname.startsWith('/superadmin/vendors');

  const isInSalesManagement =
    location.pathname.startsWith('/superadmin/sales-members') ||
    location.pathname.startsWith('/superadmin/sales-team');

  // Initialize only the currently active section as open on page load / reload
  const [adminMenuOpen, setAdminMenuOpen] = useState(isInAdminManagement);
  const [staffMenuOpen, setStaffMenuOpen] = useState(isInStaffManagement);
  const [vendorMenuOpen, setVendorMenuOpen] = useState(isInVendorManagement);
  const [salesMenuOpen, setSalesMenuOpen] = useState(isInSalesManagement);

  // When route changes, automatically ensure only the active section is open
  useEffect(() => {
    if (isInAdminManagement) {
      setAdminMenuOpen(true);
      setStaffMenuOpen(false);
      setVendorMenuOpen(false);
      setSalesMenuOpen(false);
    } else if (isInStaffManagement) {
      setStaffMenuOpen(true);
      setAdminMenuOpen(false);
      setVendorMenuOpen(false);
      setSalesMenuOpen(false);
    } else if (isInVendorManagement) {
      setVendorMenuOpen(true);
      setAdminMenuOpen(false);
      setStaffMenuOpen(false);
      setSalesMenuOpen(false);
    } else if (isInSalesManagement) {
      setSalesMenuOpen(true);
      setAdminMenuOpen(false);
      setStaffMenuOpen(false);
      setVendorMenuOpen(false);
    }
  }, [location.pathname, isInAdminManagement, isInStaffManagement, isInVendorManagement, isInSalesManagement]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out successfully.');
      navigate('/superadmin');
    } catch {
      navigate('/superadmin');
    }
  };

  const isSubItemActive = (path) => location.pathname === path;

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
        <div className="flex-1 overflow-y-auto">
          {/* Logo / Header */}
          <div className="h-18 px-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-950 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold font-display tracking-tight text-white uppercase block leading-none">
                  INIYA<span className="text-blue-500">.</span>ERP
                </span>
                <span className="text-[10px] font-extrabold text-blue-400 tracking-widest uppercase micro-label">
                  Superadmin Console
                </span>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 micro-label">
              Executive Modules
            </div>

            {/* Dashboard Link */}
            <NavLink
              to="/superadmin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            {/* Category Oversight Link */}
            <NavLink
              to="/superadmin/categories"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`
              }
            >
              <FolderTree className="w-4 h-4 shrink-0" />
              <span>Category Registry</span>
            </NavLink>

            {/* Profile & Security Link */}
            <NavLink
              to="/superadmin/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`
              }
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Profile &amp; Security</span>
            </NavLink>

            {/* ======================================================== */}
            {/* ADMIN MANAGEMENT ACCORDION SECTION (Phase 2 Requirement) */}
            {/* ======================================================== */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  isInAdminManagement
                    ? 'text-blue-400 bg-slate-900/90'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Admin Management</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    adminMenuOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {/* Collapsible Submenu */}
              {adminMenuOpen && (
                <div className="pl-6 pr-1 pt-1.5 pb-1 space-y-1">
                  {/* 1. Admin Creation */}
                  <NavLink
                    to="/superadmin/admin-management/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive || isSubItemActive('/superadmin/admins/create')
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span>Admin Creation</span>
                  </NavLink>

                  {/* 2. Admin Details */}
                  <NavLink
                    to="/superadmin/admin-management/details"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive || isSubItemActive('/superadmin/admins')
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <ListFilter className="w-3.5 h-3.5 shrink-0" />
                    <span>Admin Details</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* STAFF MANAGEMENT ACCORDION SECTION (Phase 3 Requirement) */}
            {/* ======================================================== */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setStaffMenuOpen(!staffMenuOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  isInStaffManagement
                    ? 'text-blue-400 bg-slate-900/90'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Staff Management</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    staffMenuOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {/* Collapsible Submenu */}
              {staffMenuOpen && (
                <div className="pl-6 pr-1 pt-1.5 pb-1 space-y-1">
                  {/* 1. Staff Creation */}
                  <NavLink
                    to="/superadmin/staff-management/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive || isSubItemActive('/superadmin/staff/create')
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span>Staff Creation</span>
                  </NavLink>

                  {/* 2. Staff Details */}
                  <NavLink
                    to="/superadmin/staff-management/details"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive || isSubItemActive('/superadmin/staff')
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <ListFilter className="w-3.5 h-3.5 shrink-0" />
                    <span>Staff Details</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* VENDOR MANAGEMENT ACCORDION SECTION (Phase 4)             */}
            {/* ======================================================== */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setVendorMenuOpen(!vendorMenuOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  isInVendorManagement
                    ? 'text-blue-400 bg-slate-900/90'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Vendor Management</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    vendorMenuOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {/* Collapsible Submenu */}
              {vendorMenuOpen && (
                <div className="pl-6 pr-1 pt-1.5 pb-1 space-y-1">
                  {/* 1. Vendor Creation */}
                  <NavLink
                    to="/superadmin/vendors/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive ||
                        isSubItemActive('/superadmin/vendors/create') ||
                        isSubItemActive('/superadmin/vendor-management/create')
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span>Vendor Creation</span>
                  </NavLink>

                  {/* 2. Vendor Details */}
                  <NavLink
                    to="/superadmin/vendors"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive ||
                        isSubItemActive('/superadmin/vendors') ||
                        isSubItemActive('/superadmin/vendor-management') ||
                        isSubItemActive('/superadmin/vendor-management/details')
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <ListFilter className="w-3.5 h-3.5 shrink-0" />
                    <span>Vendor Details</span>
                  </NavLink>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SALES TEAM MANAGEMENT ACCORDION SECTION (Phase 5)         */}
            {/* ======================================================== */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSalesMenuOpen(!salesMenuOpen)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                  isInSalesManagement
                    ? 'text-blue-400 bg-slate-900/90'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Sales Team Management</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    salesMenuOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {/* Collapsible Submenu */}
              {salesMenuOpen && (
                <div className="pl-6 pr-1 pt-1.5 pb-1 space-y-1">
                  {/* 1. Sales Member Creation */}
                  <NavLink
                    to="/superadmin/sales-members/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive ||
                        isSubItemActive('/superadmin/sales-members/create') ||
                        isSubItemActive('/superadmin/sales-team/create')
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span>Sales Member Creation</span>
                  </NavLink>

                  {/* 2. Sales Member Details */}
                  <NavLink
                    to="/superadmin/sales-members"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive ||
                        isSubItemActive('/superadmin/sales-members') ||
                        isSubItemActive('/superadmin/sales-team')
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <ListFilter className="w-3.5 h-3.5 shrink-0" />
                    <span>Sales Member Details</span>
                  </NavLink>
                </div>
              )}
            </div>
          </div>

          {/* Security Architecture Badge */}
          <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-blue-400 font-medium mb-1 text-[11px] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Security Architecture</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Superadmin authentication barrier is active with dedicated <code className="text-blue-300 font-mono text-[10px]">super_admins</code> table and Sanctum token validation.
            </p>
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-medium text-blue-400">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-medium text-white truncate">
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
              <h1 className="text-xs sm:text-sm font-bold font-display text-slate-900 tracking-tight">
                Superadmin Administration Portal
              </h1>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Multi-Panel ERP Architecture • Identity &amp; Access Layer
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
          Iniya ERP Systems • Superadmin Authentication &amp; Admin Management Module
        </footer>
      </div>
    </div>
  );
}
