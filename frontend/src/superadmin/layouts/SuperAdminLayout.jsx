import React, { useState, useEffect, useRef } from 'react';
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
  Boxes,
  Package,
  Award,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { useSuperAdminAuth } from '../auth/SuperAdminAuthContext';
import ToastNotifications from '../../components/ToastNotifications';
import { useToast } from '../../context/ToastContext';
import { ClinicBrandIcon } from '../../components/ClinicArtwork';
import LiveClock from '../../components/LiveClock';

export default function SuperAdminLayout() {
  const { user, logout } = useSuperAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isInInventory = location.pathname.startsWith('/superadmin/inventory');

  // Initialize only the currently active section as open on page load / reload
  const [adminMenuOpen, setAdminMenuOpen] = useState(isInAdminManagement);
  const [staffMenuOpen, setStaffMenuOpen] = useState(isInStaffManagement);
  const [vendorMenuOpen, setVendorMenuOpen] = useState(isInVendorManagement);
  const [salesMenuOpen, setSalesMenuOpen] = useState(isInSalesManagement);
  const [inventoryMenuOpen, setInventoryMenuOpen] = useState(isInInventory);

  // When route changes, automatically ensure only the active section is open
  useEffect(() => {
    if (isInAdminManagement) {
      setAdminMenuOpen(true);
      setStaffMenuOpen(false);
      setVendorMenuOpen(false);
      setSalesMenuOpen(false);
      setInventoryMenuOpen(false);
    } else if (isInStaffManagement) {
      setStaffMenuOpen(true);
      setAdminMenuOpen(false);
      setVendorMenuOpen(false);
      setSalesMenuOpen(false);
      setInventoryMenuOpen(false);
    } else if (isInVendorManagement) {
      setVendorMenuOpen(true);
      setAdminMenuOpen(false);
      setStaffMenuOpen(false);
      setSalesMenuOpen(false);
      setInventoryMenuOpen(false);
    } else if (isInSalesManagement) {
      setSalesMenuOpen(true);
      setAdminMenuOpen(false);
      setStaffMenuOpen(false);
      setVendorMenuOpen(false);
      setInventoryMenuOpen(false);
    } else if (isInInventory) {
      setInventoryMenuOpen(true);
      setAdminMenuOpen(false);
      setStaffMenuOpen(false);
      setVendorMenuOpen(false);
      setSalesMenuOpen(false);
    }
  }, [location.pathname, isInAdminManagement, isInStaffManagement, isInVendorManagement, isInSalesManagement, isInInventory]);

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
              <ClinicBrandIcon size={40} />
              <div>
                <span className="text-sm font-bold font-display tracking-tight text-white uppercase block leading-none">
                  INIYA<span className="text-blue-400">.</span>ERP
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-white border-l-4 border-blue-500 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                }`
              }
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 via-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                <LayoutDashboard className="w-4 h-4 drop-shadow-sm" />
              </div>
              <span className="truncate group-hover:translate-x-0.5 transition-transform">Dashboard</span>
            </NavLink>

            {/* Profile & Security Link */}
            <NavLink
              to="/superadmin/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-white border-l-4 border-blue-500 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                }`
              }
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                <User className="w-4 h-4 drop-shadow-sm" />
              </div>
              <span className="truncate group-hover:translate-x-0.5 transition-transform">Profile &amp; Security</span>
            </NavLink>

            {/* ======================================================== */}
            {/* ADMIN MANAGEMENT ACCORDION SECTION (Phase 2 Requirement) */}
            {/* ======================================================== */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer group text-left ${
                  isInAdminManagement
                    ? 'text-blue-400 bg-slate-900/90'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                    <Users className="w-4 h-4 drop-shadow-sm" />
                  </div>
                  <span className="text-left truncate group-hover:translate-x-0.5 transition-transform">
                    Admin Management
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ml-1 ${
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer group text-left ${
                  isInStaffManagement
                    ? 'text-blue-400 bg-slate-900/90'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                    <UserCheck className="w-4 h-4 drop-shadow-sm" />
                  </div>
                  <span className="text-left truncate group-hover:translate-x-0.5 transition-transform">
                    Staff Management
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ml-1 ${
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer group text-left ${
                  isInVendorManagement
                    ? 'text-blue-400 bg-slate-900/90'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                    <Truck className="w-4 h-4 drop-shadow-sm" />
                  </div>
                  <span className="text-left truncate group-hover:translate-x-0.5 transition-transform">
                    Vendor Management
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ml-1 ${
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer group text-left ${
                  isInSalesManagement
                    ? 'text-blue-400 bg-slate-900/90'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                    <TrendingUp className="w-4 h-4 drop-shadow-sm" />
                  </div>
                  <span className="text-left truncate group-hover:translate-x-0.5 transition-transform" title="Sales Team Management">
                    Sales Team Management
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ml-1 ${
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

            {/* ======================================================== */}
            {/* INVENTORY MANAGEMENT ACCORDION SECTION (Superadmin Phase) */}
            {/* ======================================================== */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setInventoryMenuOpen(!inventoryMenuOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-normal transition-all cursor-pointer group text-left ${
                  isInInventory
                    ? 'text-blue-400 bg-slate-900/90'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-teal-500 to-blue-600 text-white flex items-center justify-center shrink-0 icon-3d shadow-md group-hover:scale-110 group-hover:-translate-y-0.5 transition-all duration-300">
                    <Boxes className="w-4 h-4 drop-shadow-sm" />
                  </div>
                  <span className="text-left truncate group-hover:translate-x-0.5 transition-transform" title="Inventory Management">
                    Inventory Management
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ml-1 ${
                    inventoryMenuOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </button>

              {/* Collapsible Submenu */}
              {inventoryMenuOpen && (
                <div className="pl-6 pr-1 pt-1.5 pb-1 space-y-1">
                  {/* 1. Inventory Overview */}
                  <NavLink
                    to="/superadmin/inventory/overview"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                    <span>Inventory Overview</span>
                  </NavLink>

                  {/* 2. All Products */}
                  <NavLink
                    to="/superadmin/inventory/products"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    <span>All Products</span>
                  </NavLink>

                  {/* 3. Stock Ledger */}
                  <NavLink
                    to="/superadmin/inventory/stocks"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <Boxes className="w-3.5 h-3.5 shrink-0" />
                    <span>Stock Ledger</span>
                  </NavLink>

                  {/* 4. Low Stock Alerts */}
                  <NavLink
                    to="/superadmin/inventory/low-stock"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Low Stock Alerts</span>
                  </NavLink>

                  {/* 3. Categories */}
                  <NavLink
                    to="/superadmin/inventory/categories"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <FolderTree className="w-3.5 h-3.5 shrink-0" />
                    <span>Categories</span>
                  </NavLink>

                  {/* 4. Brands */}
                  <NavLink
                    to="/superadmin/inventory/brands"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`
                    }
                  >
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span>Brands</span>
                  </NavLink>
                </div>
              )}
            </div>
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
        <header className="h-18 bg-white border-b border-slate-200 px-3 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs relative">
          {/* Left: Mobile Menu Toggle & Portal Title (Short on mobile, Full on desktop) */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 z-10">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xs sm:text-base font-bold font-display text-slate-900 tracking-tight whitespace-nowrap">
              <span className="sm:hidden">Superadmin</span>
              <span className="hidden sm:inline">Superadmin Administration Portal</span>
            </h1>
          </div>

          {/* Center: Live Clock & Clean Calendar */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
            <LiveClock />
          </div>

          {/* Right side: Profile Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 z-10">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl hover:bg-slate-100/80 border border-slate-200/80 transition-all focus:outline-none cursor-pointer bg-white shadow-2xs group"
              >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center text-xs font-bold font-display icon-3d shadow-2xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-slate-800 block leading-tight font-display tracking-tight">
                  {user?.name || 'Super Admin'}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Root Clearance
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in duration-150">
                {/* User Info Header */}
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 font-display tracking-tight">{user?.name || 'Super Administrator'}</p>
                  <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">{user?.email || 'superadmin@gmail.com'}</p>
                  <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] text-emerald-700 font-semibold w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Root Clearance Active</span>
                  </div>
                </div>

                {/* Nav Links */}
                <div className="py-1">
                  <NavLink
                    to="/superadmin/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/superadmin/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile &amp; Security</span>
                  </NavLink>
                </div>

                {/* Sign Out Action */}
                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
