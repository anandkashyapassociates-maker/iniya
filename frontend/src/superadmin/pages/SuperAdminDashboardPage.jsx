import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Truck,
  TrendingUp,
  UserCheck,
  UserX,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  RefreshCw,
  Briefcase,
  MapPin,
  Tag,
  Activity,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useSuperAdminAuth } from '../auth/SuperAdminAuthContext';
import superAdminDashboardService from '../services/superAdminDashboardService';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminDashboardPage() {
  const { user } = useSuperAdminAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('admins');
  const [showActivitySection, setShowActivitySection] = useState(true);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await superAdminDashboardService.getDashboard();
      setDashboardData(data);
      if (isRefresh) {
        toast.success('Dashboard live metrics updated.');
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Failed to fetch dashboard data. Please try again.');
      if (isRefresh) {
        toast.error('Could not refresh dashboard data.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  const summary = dashboardData?.summary || {
    total_personnel: 0,
    total_active: 0,
    total_inactive: 0,
    total_blocked: 0,
    active_rate: 100,
  };

  const modules = dashboardData?.modules || {
    admins: { total: 0, active: 0, inactive: 0, blocked: 0, active_rate: 100, recent: [] },
    staff: { total: 0, active: 0, inactive: 0, blocked: 0, departments_count: 0, active_rate: 100, recent: [] },
    vendors: { total: 0, active: 0, inactive: 0, blocked: 0, types_count: 0, active_rate: 100, recent: [] },
    sales_team: { total: 0, active: 0, inactive: 0, blocked: 0, territories_count: 0, active_rate: 100, recent: [] },
  };

  const recentActivity = dashboardData?.recent_activity || [];

  return (
    <div className="space-y-6 pb-12">
      {/* ======================================================== */}
      {/* 1. Executive Greeting & Action Bar                      */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Executive Command Center</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display">
              Welcome back, {user?.name || 'Super Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed font-normal">
              Real-time enterprise overview of administrators, staff, vendors, and sales teams across Iniya ERP.
            </p>
          </div>

          {/* Right Aligned Executive Controls */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-3 lg:ml-auto shrink-0">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white border border-white/20 transition-all shadow-xs hover:shadow-md disabled:opacity-50 cursor-pointer backdrop-blur-md"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Updating...' : 'Refresh Live Data'}</span>
            </button>

            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white shadow-inner">
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Executive Root
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="font-mono text-xs font-bold text-blue-300 block truncate max-w-[180px]">
                  {user?.email || 'superadmin@example.com'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => fetchDashboard(true)}
            className="px-3.5 py-1.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-500 transition-colors cursor-pointer text-xs ml-auto shadow-xs"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Executive High-Level KPI Aggregation Ribbon          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Personnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 micro-label">
                Total Accounts
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs ml-auto">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-slate-900 tracking-tight">
              {loading ? <span className="animate-pulse">...</span> : summary.total_personnel}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>4 Primary Divisions</span>
            <span className="font-bold text-blue-600 ml-auto font-display">Enterprise</span>
          </div>
        </div>

        {/* KPI 2: Active & Operational */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 micro-label">
                Active Operational
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs ml-auto">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-emerald-600 tracking-tight">
              {loading ? <span className="animate-pulse">...</span> : summary.total_active}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Operational
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] ml-auto tabular-numbers font-display">
              {summary.active_rate}%
            </span>
          </div>
        </div>

        {/* KPI 3: Inactive Accounts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 micro-label">
                Inactive Accounts
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs ml-auto">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-amber-600 tracking-tight">
              {loading ? <span className="animate-pulse">...</span> : summary.total_inactive}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-medium">
            <span>Dormant Profiles</span>
            <span className="text-[11px] font-bold text-amber-600 ml-auto font-display">Pending Review</span>
          </div>
        </div>

        {/* KPI 4: Blocked / Restricted */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 micro-label">
                Blocked / Suspended
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-2xs ml-auto">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-rose-600 tracking-tight">
              {loading ? <span className="animate-pulse">...</span> : summary.total_blocked}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-rose-700 font-medium">
            <span>Restricted Access</span>
            <span className="text-[11px] font-bold text-rose-600 ml-auto font-display">Enforced</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Dedicated Module Status Cards (The Sidebar Modules)   */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight font-display">
              Operational Division Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Live status, headcount, and quick access for each sidebar executive division.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Module 1: Admin Management */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-2xs">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Admin Management</h3>
                    <p className="text-[11px] text-slate-400">Branch Administrators</p>
                  </div>
                </div>
                <Link
                  to="/superadmin/admin-management/details"
                  className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors ml-auto shadow-2xs"
                  title="View Admin Details"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Total Headcount */}
              <div className="py-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-slate-900 tracking-tight">
                    {loading ? '...' : modules.admins.total}
                  </span>
                  <span className="text-[11px] font-bold font-mono tabular-numbers px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 ml-auto">
                    {modules.admins.active_rate}% Active
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium tracking-tight">Total registered administrators</span>
              </div>

              {/* Breakdown Status Pills (Active | Inactive | Blocked) */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 pb-3 text-center">
                <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-emerald-700 block">
                    Active
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-emerald-800 mt-0.5 block">
                    {loading ? '...' : modules.admins.active}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-amber-700 block">
                    Inactive
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-amber-800 mt-0.5 block">
                    {loading ? '...' : modules.admins.inactive}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/90 border border-rose-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-rose-700 block">
                    Blocked
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-rose-800 mt-0.5 block">
                    {loading ? '...' : modules.admins.blocked}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/admin-management/create"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 py-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create Admin</span>
              </Link>
              <Link
                to="/superadmin/admin-management/details"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all ml-auto"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Module 2: Staff Management */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Staff Management</h3>
                    <p className="text-[11px] text-slate-400">Company Employees</p>
                  </div>
                </div>
                <Link
                  to="/superadmin/staff-management/details"
                  className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors ml-auto shadow-2xs"
                  title="View Staff Details"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Total Headcount */}
              <div className="py-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-slate-900 tracking-tight">
                    {loading ? '...' : modules.staff.total}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono tabular-numbers px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 ml-auto">
                    <Briefcase className="w-3 h-3" />
                    {modules.staff.departments_count} Depts
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium tracking-tight">Total employee workforce</span>
              </div>

              {/* Breakdown Status Pills */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 pb-3 text-center">
                <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-emerald-700 block">
                    Active
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-emerald-800 mt-0.5 block">
                    {loading ? '...' : modules.staff.active}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-amber-700 block">
                    Inactive
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-amber-800 mt-0.5 block">
                    {loading ? '...' : modules.staff.inactive}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/90 border border-rose-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-rose-700 block">
                    Blocked
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-rose-800 mt-0.5 block">
                    {loading ? '...' : modules.staff.blocked}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/staff-management/create"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 py-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Staff</span>
              </Link>
              <Link
                to="/superadmin/staff-management/details"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all ml-auto"
              >
                <span>Directory</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Module 3: Vendor Management */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-cyan-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/10 text-cyan-700 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors shadow-2xs">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Vendor Management</h3>
                    <p className="text-[11px] text-slate-400">Suppliers &amp; Partners</p>
                  </div>
                </div>
                <Link
                  to="/superadmin/vendors"
                  className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-cyan-50 text-slate-400 hover:text-cyan-700 flex items-center justify-center transition-colors ml-auto shadow-2xs"
                  title="View Vendors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Total Headcount */}
              <div className="py-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-slate-900 tracking-tight">
                    {loading ? '...' : modules.vendors.total}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono tabular-numbers px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200/60 ml-auto">
                    <Tag className="w-3 h-3" />
                    {modules.vendors.types_count} Types
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium tracking-tight">Verified supplier profiles</span>
              </div>

              {/* Breakdown Status Pills */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 pb-3 text-center">
                <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-emerald-700 block">
                    Active
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-emerald-800 mt-0.5 block">
                    {loading ? '...' : modules.vendors.active}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-amber-700 block">
                    Inactive
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-amber-800 mt-0.5 block">
                    {loading ? '...' : modules.vendors.inactive}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/90 border border-rose-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-rose-700 block">
                    Blocked
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-rose-800 mt-0.5 block">
                    {loading ? '...' : modules.vendors.blocked}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/vendors/create"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:text-cyan-800 py-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Vendor</span>
              </Link>
              <Link
                to="/superadmin/vendors"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-cyan-700 hover:bg-cyan-50 transition-all ml-auto"
              >
                <span>Vendors</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Module 4: Sales Team Management */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Sales Team</h3>
                    <p className="text-[11px] text-slate-400">Sales Representatives</p>
                  </div>
                </div>
                <Link
                  to="/superadmin/sales-members"
                  className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 flex items-center justify-center transition-colors ml-auto shadow-2xs"
                  title="View Sales Team"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Total Headcount */}
              <div className="py-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-bold font-display tabular-numbers text-slate-900 tracking-tight">
                    {loading ? '...' : modules.sales_team.total}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono tabular-numbers px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 ml-auto">
                    <MapPin className="w-3 h-3" />
                    {modules.sales_team.territories_count} Zones
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium tracking-tight">Field &amp; inside sales force</span>
              </div>

              {/* Breakdown Status Pills */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 pb-3 text-center">
                <div className="p-2 rounded-xl bg-emerald-50/90 border border-emerald-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-emerald-700 block">
                    Active
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-emerald-800 mt-0.5 block">
                    {loading ? '...' : modules.sales_team.active}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-amber-700 block">
                    Inactive
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-amber-800 mt-0.5 block">
                    {loading ? '...' : modules.sales_team.inactive}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-rose-50/90 border border-rose-100/90 shadow-2xs">
                  <span className="micro-label text-[9px] font-extrabold text-rose-700 block">
                    Blocked
                  </span>
                  <span className="text-sm sm:text-base font-bold font-display tabular-numbers text-rose-800 mt-0.5 block">
                    {loading ? '...' : modules.sales_team.blocked}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/sales-members/create"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 py-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </Link>
              <Link
                to="/superadmin/sales-members"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all ml-auto"
              >
                <span>Team</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. Quick Action Shortcuts Hub                            */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl p-5 text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <span>Quick Management Shortcuts</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Quickly provision accounts across any division directly from the dashboard.
          </p>
        </div>

        {/* Right Aligned Quick Buttons */}
        <div className="flex flex-wrap items-center justify-start md:justify-end gap-2.5 md:ml-auto shrink-0">
          <Link
            to="/superadmin/admin-management/create"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-xs hover:shadow-md"
          >
            + Create Admin
          </Link>
          <Link
            to="/superadmin/staff-management/create"
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700/80 transition-all hover:text-white"
          >
            + Add Staff
          </Link>
          <Link
            to="/superadmin/vendors/create"
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700/80 transition-all hover:text-white"
          >
            + Add Vendor
          </Link>
          <Link
            to="/superadmin/sales-members/create"
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700/80 transition-all hover:text-white"
          >
            + Add Sales Member
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. Live Records Preview & Recent Audit Feed (Compact)    */}
      {/* ======================================================== */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-extrabold micro-label text-slate-600">
              Activity &amp; Operational Records
            </h3>
          </div>
          {/* Right Aligned Toggle Button */}
          <button
            type="button"
            onClick={() => setShowActivitySection(!showActivitySection)}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-2xs hover:shadow-xs cursor-pointer ml-auto flex items-center gap-1.5"
          >
            <span>{showActivitySection ? 'Hide Details' : 'Show Details'}</span>
            <span className="text-[10px] text-slate-400">{showActivitySection ? '▲' : '▼'}</span>
          </button>
        </div>

        {showActivitySection && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Compact Module Records (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-xs font-extrabold font-display tracking-tight text-slate-900">Recent Records</span>
                  </div>

                  {/* Compact Tabs Pushed Right */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] ml-auto font-sans">
                    <button
                      type="button"
                      onClick={() => setActiveTab('admins')}
                      className={`px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer font-display ${
                        activeTab === 'admins' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Admins <span className="font-mono text-[10px] tabular-numbers">({modules.admins.total})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('staff')}
                      className={`px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer font-display ${
                        activeTab === 'staff' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Staff <span className="font-mono text-[10px] tabular-numbers">({modules.staff.total})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('vendors')}
                      className={`px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer font-display ${
                        activeTab === 'vendors' ? 'bg-white text-cyan-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Vendors <span className="font-mono text-[10px] tabular-numbers">({modules.vendors.total})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('sales_team')}
                      className={`px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer font-display ${
                        activeTab === 'sales_team' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Sales <span className="font-mono text-[10px] tabular-numbers">({modules.sales_team.total})</span>
                    </button>
                  </div>
                </div>

                {/* Tab Content (Limited to 3 compact rows) */}
                <div className="space-y-2">
                  {activeTab === 'admins' && (
                    modules.admins.recent.length === 0 ? (
                      <p className="py-5 text-center text-xs text-slate-400">No administrators recorded.</p>
                    ) : (
                      modules.admins.recent.slice(0, 3).map((adm) => (
                        <div
                          key={adm.id}
                          className="py-2 px-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex items-center justify-between gap-3 text-xs hover:bg-slate-100/60 transition-colors"
                        >
                          {/* Left Identity */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs font-display">
                              {adm.name ? adm.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 truncate block font-display tracking-tight">{adm.name}</span>
                              <span className="text-[11px] text-slate-400 font-mono truncate block">{adm.email}</span>
                            </div>
                          </div>

                          {/* Right Status & Action Pushed To Far Right */}
                          <div className="flex items-center gap-2.5 ml-auto shrink-0">
                            <span
                              className={`micro-label text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                adm.status === 'active' || (!adm.status && adm.is_active)
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : adm.status === 'blocked'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {adm.status || (adm.is_active ? 'Active' : 'Inactive')}
                            </span>
                            <Link
                              to="/superadmin/admin-management/details"
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors shadow-2xs font-display"
                            >
                              Manage &rarr;
                            </Link>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {activeTab === 'staff' && (
                    modules.staff.recent.length === 0 ? (
                      <p className="py-5 text-center text-xs text-slate-400">No staff members recorded.</p>
                    ) : (
                      modules.staff.recent.slice(0, 3).map((st) => (
                        <div
                          key={st.id}
                          className="py-2 px-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex items-center justify-between gap-3 text-xs hover:bg-slate-100/60 transition-colors"
                        >
                          {/* Left Identity */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs font-display">
                              {st.name ? st.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 truncate font-display tracking-tight">{st.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono tabular-numbers">#{st.staff_code}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 truncate block font-medium">
                                {st.designation || 'Staff'} • {st.department || 'General'}
                              </span>
                            </div>
                          </div>

                          {/* Right Status & Action Pushed To Far Right */}
                          <div className="flex items-center gap-2.5 ml-auto shrink-0">
                            <span
                              className={`micro-label text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                st.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : st.status === 'blocked'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {st.status}
                            </span>
                            <Link
                              to="/superadmin/staff-management/details"
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-2xs font-display"
                            >
                              Manage &rarr;
                            </Link>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {activeTab === 'vendors' && (
                    modules.vendors.recent.length === 0 ? (
                      <p className="py-5 text-center text-xs text-slate-400">No vendors recorded.</p>
                    ) : (
                      modules.vendors.recent.slice(0, 3).map((vn) => (
                        <div
                          key={vn.id}
                          className="py-2 px-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex items-center justify-between gap-3 text-xs hover:bg-slate-100/60 transition-colors"
                        >
                          {/* Left Identity */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-cyan-600/10 text-cyan-700 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs font-display">
                              {vn.vendor_name ? vn.vendor_name.charAt(0).toUpperCase() : 'V'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 truncate font-display tracking-tight">{vn.vendor_name}</span>
                                <span className="text-[10px] text-slate-400 font-mono tabular-numbers">#{vn.vendor_code}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 truncate block font-medium">
                                {vn.company_name || vn.vendor_type || 'Vendor'}
                              </span>
                            </div>
                          </div>

                          {/* Right Status & Action Pushed To Far Right */}
                          <div className="flex items-center gap-2.5 ml-auto shrink-0">
                            <span
                              className={`micro-label text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                vn.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : vn.status === 'blocked'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {vn.status}
                            </span>
                            <Link
                              to="/superadmin/vendors"
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 transition-colors shadow-2xs font-display"
                            >
                              Manage &rarr;
                            </Link>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {activeTab === 'sales_team' && (
                    modules.sales_team.recent.length === 0 ? (
                      <p className="py-5 text-center text-xs text-slate-400">No sales members recorded.</p>
                    ) : (
                      modules.sales_team.recent.slice(0, 3).map((sm) => (
                        <div
                          key={sm.id}
                          className="py-2 px-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex items-center justify-between gap-3 text-xs hover:bg-slate-100/60 transition-colors"
                        >
                          {/* Left Identity */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs font-display">
                              {sm.name ? sm.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 truncate font-display tracking-tight">{sm.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono tabular-numbers">#{sm.sales_code}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 truncate block font-medium">
                                {sm.designation || 'Sales Member'} • {sm.territory || 'Unassigned'}
                              </span>
                            </div>
                          </div>

                          {/* Right Status & Action Pushed To Far Right */}
                          <div className="flex items-center gap-2.5 ml-auto shrink-0">
                            <span
                              className={`micro-label text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                sm.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sm.status === 'blocked'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {sm.status}
                            </span>
                            <Link
                              to="/superadmin/sales-members"
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors shadow-2xs font-display"
                            >
                              Manage &rarr;
                            </Link>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-[11px]">Top 3 recent profiles</span>
                <Link
                  to={
                    activeTab === 'admins'
                      ? '/superadmin/admin-management/details'
                      : activeTab === 'staff'
                      ? '/superadmin/staff-management/details'
                      : activeTab === 'vendors'
                      ? '/superadmin/vendors'
                      : '/superadmin/sales-members'
                  }
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 ml-auto font-display text-xs"
                >
                  <span>Full Directory</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right: Compact Live Audit Feed (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-extrabold font-display tracking-tight text-slate-900">Recent Audit Activities</span>
                  </div>
                  {/* Right Aligned Badge */}
                  <span className="micro-label text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 ml-auto">
                    Live Trail
                  </span>
                </div>

                <div className="space-y-2">
                  {recentActivity.length === 0 ? (
                    <p className="py-5 text-center text-xs text-slate-400">No activity recorded yet.</p>
                  ) : (
                    recentActivity.slice(0, 3).map((log) => (
                      <div
                        key={log.id}
                        className="py-2 px-3 rounded-xl bg-slate-50/80 border border-slate-100/80 flex items-center justify-between gap-3 text-xs hover:bg-slate-100/60 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="font-medium text-slate-700 truncate block text-[11px]">{log.description}</span>
                        </div>
                        {/* Right Aligned Timestamp */}
                        <span className="text-[10px] text-slate-400 font-mono tabular-numbers shrink-0 ml-auto px-2 py-0.5 rounded-md bg-white border border-slate-200/60 shadow-2xs">
                          {log.created_at
                            ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'Now'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Audit trail logs</span>
                </span>
                <span className="font-medium text-slate-400 ml-auto">Automated</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
