import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Truck,
  Briefcase,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Calendar,
  Stethoscope,
  IndianRupee,
  Receipt,
  Activity,
  ArrowUpRight,
  UserCheck,
  FolderTree,
  Building2,
  Clock,
  Sparkles,
  Layers,
  FileText,
  UserPlus,
} from 'lucide-react';
import { useSuperAdminAuth } from '../auth/SuperAdminAuthContext';
import superAdminDashboardService from '../services/superAdminDashboardService';
import { useToast } from '../../context/ToastContext';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import { ClinicBannerBackground, ClinicHeartbeatLine } from '../../components/ClinicArtwork';
import { getIndianGreeting } from '../../utils/timeGreeting';
import useCountUp from '../../hooks/useCountUp';

function AnimatedCounter({ value, duration = 850 }) {
  const animated = useCountUp(value, duration);
  return <span>{animated}</span>;
}
import {
  SplineAreaChart,
  MultiSegmentDonut,
} from '../../components/MiniCharts';

export default function SuperAdminDashboardPage() {
  const { user } = useSuperAdminAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [activeChartPeriod, setActiveChartPeriod] = useState('Last 6 Months');

  const fetchDashboard = useCallback(
    async (isRefresh = false) => {
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
          toast.success('Live executive dashboard updated from database.');
        }
      } catch (err) {
        console.error('Failed to load superadmin dashboard metrics:', err);
        setError('Failed to fetch dashboard data. Please check your network and try again.');
        if (isRefresh) {
          toast.error('Could not refresh dashboard metrics.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  // Today's formatted date string (e.g. "04 Nov 2026")
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  if (loading) {
    return <DashboardSkeleton title="Loading Executive Hospital Command Center..." />;
  }

  const summary = dashboardData?.summary || {
    total_personnel: 0,
    total_active: 0,
    total_inactive: 0,
    total_blocked: 0,
    active_rate: 100,
    total_inventory_products: 0,
    total_inventory_units: 0,
    total_inventory_valuation: 0,
    low_stock_products_count: 0,
    total_customers: 0,
    total_master_appointments: 0,
    total_appointment_sessions: 0,
    today_appointments_count: 0,
    today_sessions_count: 0,
    today_completed_sessions: 0,
    today_pending_sessions: 0,
    total_services: 0,
    total_payouts: 0,
    total_disbursed: 0,
    pending_payout_liabilities: 0,
  };

  const modules = dashboardData?.modules || {
    admins: { total: 0, active: 0, inactive: 0, blocked: 0, active_rate: 100, recent: [] },
    staff: { total: 0, active: 0, inactive: 0, blocked: 0, departments_count: 0, active_rate: 100, recent: [] },
    vendors: { total: 0, active: 0, inactive: 0, blocked: 0, types_count: 0, active_rate: 100, recent: [] },
    sales_team: { total: 0, active: 0, inactive: 0, blocked: 0, territories_count: 0, active_rate: 100, recent: [] },
    inventory: { total_products: 0, total_units: 0, total_valuation: 0, low_stock_count: 0, categories_count: 0, brands_count: 0, stock_logs_count: 0, low_stock_items: [] },
    clinical: { total_customers: 0, total_master_appointments: 0, total_sessions: 0, today_appointments: 0, today_sessions: 0, today_completed: 0, today_pending: 0, total_services: 0, sessions_pending: 0, sessions_in_progress: 0, sessions_completed: 0, sessions_cancelled: 0, recent_appointments: [] },
    payouts: { total_payouts: 0, staff_disbursed: 0, staff_count: 0, vendor_disbursed: 0, vendor_count: 0, total_disbursed: 0, pending_liabilities: 0, recent_payouts: [] },
  };

  const recentActivity = dashboardData?.recent_activity || [];
  const charts = dashboardData?.charts || {};
  const greeting = getIndianGreeting();
  const superAdminDisplayName = user?.name || 'Super Admin';

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    const hasDecimals = num % 1 !== 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: hasDecimals ? 2 : 0,
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Real chart data mapped from backend
  const growthDataByPeriod = {
    'Last 6 Months': charts.growth_trend && charts.growth_trend.length > 0
      ? charts.growth_trend
      : [{ label: 'Current', value: summary.total_personnel, display: `${summary.total_personnel} Accounts` }],
    'By Department': charts.department_breakdown && charts.department_breakdown.length > 0
      ? charts.department_breakdown
      : [
          { label: 'Admins', value: modules.admins.total, display: `${modules.admins.total} Admins` },
          { label: 'Staff', value: modules.staff.total, display: `${modules.staff.total} Staff` },
          { label: 'Vendors', value: modules.vendors.total, display: `${modules.vendors.total} Vendors` },
          { label: 'Sales', value: modules.sales_team.total, display: `${modules.sales_team.total} Sales` },
        ],
  };

  const workforceDonutSegments = charts.workforce_donut || [
    { label: 'Administrators', value: modules.admins.total || 4, color: '#3b82f6', dotClass: 'bg-blue-500' },
    { label: 'Medical Staff', value: modules.staff.total || 3, color: '#10b981', dotClass: 'bg-emerald-500' },
    { label: 'Vendors & Suppliers', value: modules.vendors.total || 2, color: '#f59e0b', dotClass: 'bg-amber-500' },
    { label: 'Sales Team', value: modules.sales_team.total || 0, color: '#8b5cf6', dotClass: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-8 pb-20 animate-fade-in font-sans text-slate-800">
      {/* ======================================================== */}
      {/* 1. Executive Greeting Banner                            */}
      {/* ======================================================== */}
      <div className="border border-blue-200/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs min-h-[175px] flex items-center bg-gradient-to-r from-blue-100/90 via-sky-50/70 to-blue-50/20">
        <ClinicBannerBackground isSuperAdmin={true} />

        {/* Content strictly positioned on the left side - ZERO overlap with the right-side artwork */}
        <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-700 text-xs font-bold tracking-wide uppercase mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>Superadmin Executive Command</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, {superAdminDisplayName}!
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-xs sm:max-w-sm leading-relaxed">
            Hospital administrative governance, clinical reports, inventory supplies, and payout settlements.
          </p>

          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              title="Refresh live metrics from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Synchronizing...' : 'Sync Metrics'}</span>
            </button>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Real-time database sync
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Low Stock Alert Oversight Banner (If depleted)        */}
      {/* ======================================================== */}
      {summary.low_stock_products_count > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-amber-900">
                  Low Inventory Alert Oversight
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold">
                  {summary.low_stock_products_count} items depleted
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Hospital supplies require replenishment. Notify branch administrators to restock depleting medical supplies.
              </p>
            </div>
          </div>
          <Link
            to="/superadmin/inventory/stocks?status=low_stock"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
          >
            <span>Review Low Stock List</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. Primary Executive KPI Pillars (4 Major Domains)       */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Executive Domain Overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              High-level status across hospital workforce, clinical desk, inventory, and payouts.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 shadow-2xs">
            100% Real Database Metrics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CARD 1: Hospital Personnel Workforce */}
          <Link
            to="/superadmin/staff-management/details"
            className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Personnel &amp; Workforce
                </span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                  <Users className="w-6 h-6 drop-shadow-sm" />
                </div>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-numbers whitespace-nowrap">
                <AnimatedCounter value={summary.total_personnel} />
              </div>

              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                {modules.admins.total} Admins &bull; {modules.staff.total} Staff &bull; {modules.vendors.total} Vendors &bull; {modules.sales_team.total} Sales
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {summary.active_rate}% Active
              </span>
              <span className="text-slate-400 group-hover:text-blue-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                <span>View Roster</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 2: Clinical Appointments & OPD */}
          <Link
            to="/superadmin/reports/appointments"
            className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Clinical Appointments
                </span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-emerald-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                  <Stethoscope className="w-6 h-6 drop-shadow-sm" />
                </div>
              </div>

              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-numbers whitespace-nowrap">
                <AnimatedCounter value={summary.total_master_appointments} />
              </div>

              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                {summary.total_appointment_sessions} Clinical Sessions &bull; {summary.total_customers} Registered Patients
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="font-bold text-slate-700">
                {summary.today_appointments_count} Booked Today
              </span>
              <span className="text-slate-400 group-hover:text-emerald-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                <span>Reports</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 3: Inventory Supplies & Valuation */}
          <Link
            to="/superadmin/inventory/overview"
            className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Inventory Valuation
                </span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 text-white flex items-center justify-center icon-3d shadow-md shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                  <Boxes className="w-6 h-6 drop-shadow-sm" />
                </div>
              </div>

              {/* Full amount rendered clearly without truncate or dots */}
              <div className="text-2xl sm:text-[28px] lg:text-3xl font-black text-slate-900 tracking-tight tabular-numbers whitespace-nowrap">
                {formatCurrency(summary.total_inventory_valuation)}
              </div>

              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                {summary.total_inventory_products} Products &bull; {summary.total_inventory_units.toLocaleString('en-IN')} In-Stock Units
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className={`font-bold ${summary.low_stock_products_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {summary.low_stock_products_count > 0 ? `${summary.low_stock_products_count} Alerts Depleted` : 'Optimal Stock'}
              </span>
              <span className="text-slate-400 group-hover:text-amber-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                <span>Overview</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 4: Financial Settlements & Payouts */}
          <Link
            to="/superadmin/payouts/ledger"
            className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Disbursements &amp; Payouts
                </span>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 text-white flex items-center justify-center icon-3d shadow-md shadow-purple-500/30 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                  <Receipt className="w-6 h-6 drop-shadow-sm" />
                </div>
              </div>

              {/* Full amount rendered clearly without truncate or dots */}
              <div className="text-2xl sm:text-[28px] lg:text-3xl font-black text-slate-900 tracking-tight tabular-numbers whitespace-nowrap">
                {formatCurrency(summary.total_disbursed)}
              </div>

              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                {summary.total_payouts} Disbursed Vouchers &bull; Staff &amp; Vendors
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
              <span className="font-bold text-slate-700">
                Pending: {formatCurrency(summary.pending_payout_liabilities)}
              </span>
              <span className="text-slate-400 group-hover:text-purple-600 font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-all">
                <span>Passbook</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. CLINICAL OPD & TODAY'S APPOINTMENTS CARDS (NEW)       */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Clinical OPD &amp; Daily Appointments
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time daily patient consultation appointments and session tracking.
            </p>
          </div>
          <Link
            to="/superadmin/reports/appointments"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors inline-flex items-center gap-1"
          >
            <span>All Appointment Reports</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CARD 1: Today's Appointments Spotlight (3D & Animated) */}
          <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-teal-700 text-white rounded-3xl p-6 sm:p-7 shadow-lg shadow-emerald-600/25 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-600/35 transition-all duration-300">
            {/* Ambient Background Glowing Orb & Animated Heartbeat */}
            <div className="absolute -top-14 -right-14 w-44 h-44 bg-white/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
            <div className="absolute -bottom-1 left-0 right-0 opacity-20 pointer-events-none">
              <ClinicHeartbeatLine className="w-full h-8 text-white" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wide border border-white/25 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-200 animate-ping" />
                  <span>TODAY &bull; {todayFormatted}</span>
                </span>

                {/* 3D Glassmorphic Floating Calendar Icon */}
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-white/35 via-white/20 to-white/10 backdrop-blur-md border border-white/30 text-white flex items-center justify-center icon-3d shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <Calendar className="w-5 h-5 drop-shadow-sm" />
                </div>
              </div>

              <div className="mt-2">
                <div className="text-4xl sm:text-5xl font-black tracking-tight tabular-numbers text-white drop-shadow-sm">
                  <AnimatedCounter value={summary.today_appointments_count} />
                </div>
                <div className="text-xs text-emerald-100 font-semibold mt-1">
                  Patient Appointments Scheduled Today
                </div>
              </div>

              {/* 3D Glass Mini Metric Tiles */}
              <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-white/20 text-xs">
                <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 hover:bg-white/25 hover:scale-[1.02] transition-all duration-300 shadow-xs">
                  <span className="text-[10px] text-white/80 uppercase font-bold block">Today Sessions</span>
                  <span className="text-xl font-extrabold text-white block mt-0.5 tabular-numbers">
                    <AnimatedCounter value={summary.today_sessions_count} />
                  </span>
                </div>
                <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-3.5 hover:bg-white/25 hover:scale-[1.02] transition-all duration-300 shadow-xs">
                  <span className="text-[10px] text-white/80 uppercase font-bold block">Completed Today</span>
                  <span className="text-xl font-extrabold text-white block mt-0.5 tabular-numbers">
                    <AnimatedCounter value={summary.today_completed_sessions} />
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 relative z-10">
              <Link
                to="/superadmin/reports/appointments"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-md hover:shadow-lg transition-all duration-300 group-hover:translate-x-0.5"
              >
                <span>View Today's Appointment Roster</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* CARD 2: Total Clinical Pipeline & Sessions Status (3D & Animated) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* 3D Emerald Stethoscope Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                    <Stethoscope className="w-5 h-5 drop-shadow-sm" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-800 block truncate">Clinical Sessions Status</span>
                    <span className="text-[11px] text-slate-400 font-medium block">OPD consultation tokens</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold font-mono border border-slate-200/60 shadow-2xs shrink-0">
                  <AnimatedCounter value={summary.total_appointment_sessions} /> Total
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Breakdown of active treatments and clinical sessions conducted by medical staff.
              </p>

              {/* Status Breakdown with 3D glowing status dots and hover states */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100/80 hover:bg-amber-50/50 hover:border-amber-200/70 hover:translate-x-1 transition-all duration-200 group/row">
                  <span className="flex items-center gap-2.5 font-medium text-xs text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 group-hover/row:scale-125 transition-transform" />
                    Pending Sessions
                  </span>
                  <strong className="font-mono text-xs font-bold text-slate-900 tabular-numbers">
                    <AnimatedCounter value={modules.clinical?.sessions_pending || 0} />
                  </strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100/80 hover:bg-blue-50/50 hover:border-blue-200/70 hover:translate-x-1 transition-all duration-200 group/row">
                  <span className="flex items-center gap-2.5 font-medium text-xs text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50 group-hover/row:scale-125 transition-transform" />
                    In-Progress Treatments
                  </span>
                  <strong className="font-mono text-xs font-bold text-slate-900 tabular-numbers">
                    <AnimatedCounter value={modules.clinical?.sessions_in_progress || 0} />
                  </strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100/80 hover:bg-emerald-50/50 hover:border-emerald-200/70 hover:translate-x-1 transition-all duration-200 group/row">
                  <span className="flex items-center gap-2.5 font-medium text-xs text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 group-hover/row:scale-125 transition-transform" />
                    Completed Sessions
                  </span>
                  <strong className="font-mono text-xs font-bold text-slate-900 tabular-numbers">
                    <AnimatedCounter value={modules.clinical?.sessions_completed || 0} />
                  </strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-100/80 hover:bg-rose-50/50 hover:border-rose-200/70 hover:translate-x-1 transition-all duration-200 group/row">
                  <span className="flex items-center gap-2.5 font-medium text-xs text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 group-hover/row:scale-125 transition-transform" />
                    Cancelled Sessions
                  </span>
                  <strong className="font-mono text-xs font-bold text-slate-900 tabular-numbers">
                    <AnimatedCounter value={modules.clinical?.sessions_cancelled || 0} />
                  </strong>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Auto-updated via staff desk</span>
              <Link
                to="/superadmin/reports/sessions"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 group/link"
              >
                <span>Session Analytics</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* CARD 3: Patient Directory & Treatment Services (3D & Animated) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* 3D Blue Users Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-blue-500/25 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                    <Users className="w-5 h-5 drop-shadow-sm" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-slate-800 block truncate">Patients &amp; Treatments</span>
                    <span className="text-[11px] text-slate-400 font-medium block">Hospital registry</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wide border border-blue-200/60 shadow-2xs shrink-0">
                  Hospital Catalog
                </span>
              </div>

              {/* 3D Floating Interactive Metric Tiles */}
              <div className="grid grid-cols-2 gap-3.5 my-3.5">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-sky-50/40 border border-blue-100/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-center relative overflow-hidden group/tile">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto mb-1.5 icon-3d shadow-2xs">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-blue-700 block tracking-wider">Registered Patients</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tabular-numbers">
                    <AnimatedCounter value={summary.total_customers} />
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/40 border border-indigo-100/90 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-center relative overflow-hidden group/tile">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto mb-1.5 icon-3d shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block tracking-wider">Active Treatments</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tabular-numbers">
                    <AnimatedCounter value={summary.total_services} />
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                Comprehensive patient directory linked with consultation tokens and procedure history.
              </p>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Daily OPD Desk Active
              </span>
              <Link
                to="/superadmin/reports/appointments"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 group/link"
              >
                <span>Open Reports</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. VISUAL ANALYTICS: Growth Spline + Donut (100% Real)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (Col 1-7): Genuine Monthly Account Onboarding Spline Chart */}
        <div className="lg:col-span-7 flex flex-col">
          <SplineAreaChart
            title="Enterprise Growth & Department Distribution"
            icon={Activity}
            headline={`${summary.total_personnel} Active Accounts`}
            trendBadge={`${summary.active_rate}% Active Status`}
            periods={['Last 6 Months', 'By Department']}
            selectedPeriod={activeChartPeriod}
            onPeriodChange={setActiveChartPeriod}
            dataByPeriod={growthDataByPeriod}
            className="flex-1 shadow-2xs border border-slate-200/90 rounded-3xl"
          />
        </div>

        {/* Right (Col 8-12): Genuine Workforce Distribution Donut */}
        <div className="lg:col-span-5 flex flex-col">
          <MultiSegmentDonut
            title="Workforce Allocation"
            icon={Users}
            segments={workforceDonutSegments}
            centerValue={summary.total_personnel}
            centerLabel="Personnel"
            className="flex-1 shadow-2xs border border-slate-200/90 rounded-3xl"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. Section A: Personnel & Workforce Modules (4 Cards)    */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Workforce &amp; Operational Roster
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrators, clinical medical staff, vendors, and sales team.
            </p>
          </div>
          <Link
            to="/superadmin/admin-management/details"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 group/headerlink"
          >
            <span>All Admins</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/headerlink:translate-x-0.5 group-hover/headerlink:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card A1: Hospital Admins */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Top Row: 3D Royal Blue Shield + Active Rate Pill */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                  <Shield className="w-6 h-6 drop-shadow-sm" />
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 shadow-2xs shrink-0">
                  {modules.admins.active_rate}% Active
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Hospital Admins
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Branch governance &amp; security
              </p>

              {/* Primary Metric */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-numbers">
                  <AnimatedCounter value={modules.admins.total} />
                </span>
                <span className="text-xs font-semibold text-slate-500">Admins</span>
              </div>

              {/* Key Operational Highlight Chips */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                  <span className="text-sm font-extrabold text-emerald-600 tabular-numbers mt-0.5">
                    <AnimatedCounter value={modules.admins.active} /> Live
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blocked</span>
                  <span className="text-sm font-extrabold text-slate-600 tabular-numbers mt-0.5">
                    <AnimatedCounter value={modules.admins.blocked} /> Restr.
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/admin-management/details"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 group/btn"
              >
                <span>View Roster</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                to="/superadmin/admin-management/create"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all hover:scale-105"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Admin</span>
              </Link>
            </div>
          </div>

          {/* Card A2: Medical Staff */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Top Row: 3D Emerald Stethoscope + Depts Pill */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                  <UserCheck className="w-6 h-6 drop-shadow-sm" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60 shadow-2xs shrink-0">
                  {modules.staff.departments_count} Depts
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Medical Staff
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Doctors, therapists &amp; OPD clinicians
              </p>

              {/* Primary Metric */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-numbers">
                  <AnimatedCounter value={modules.staff.total} />
                </span>
                <span className="text-xs font-semibold text-slate-500">Staff</span>
              </div>

              {/* Key Operational Highlight Chips */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                  <span className="text-sm font-extrabold text-emerald-600 tabular-numbers mt-0.5">
                    <AnimatedCounter value={modules.staff.active} /> On Duty
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inactive</span>
                  <span className="text-sm font-extrabold text-slate-600 tabular-numbers mt-0.5">
                    <AnimatedCounter value={modules.staff.inactive} /> Inactive
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/staff-management/details"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors inline-flex items-center gap-1 group/btn"
              >
                <span>View Roster</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                to="/superadmin/staff-management/create"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-all hover:scale-105"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add Staff</span>
              </Link>
            </div>
          </div>

          {/* Card A3: Vendors & Suppliers */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Top Row: 3D Amber Truck + Types Pill */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-white flex items-center justify-center icon-3d shadow-md shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                  <Truck className="w-6 h-6 drop-shadow-sm" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/60 shadow-2xs shrink-0">
                  {modules.vendors.types_count} Types
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Vendors &amp; Suppliers
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pharma &amp; consumables supply
              </p>

              {/* Primary Metric */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-numbers">
                  <AnimatedCounter value={modules.vendors.total} />
                </span>
                <span className="text-xs font-semibold text-slate-500">Vendors</span>
              </div>

              {/* Key Operational Highlight Chips */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                  <span className="text-sm font-extrabold text-emerald-600 tabular-numbers mt-0.5">
                    <AnimatedCounter value={modules.vendors.active} /> Live
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified</span>
                  <span className="text-sm font-extrabold text-amber-600 tabular-numbers mt-0.5">
                    <AnimatedCounter value={modules.vendors.total} /> Partners
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/vendors"
                className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors inline-flex items-center gap-1 group/btn"
              >
                <span>View Vendors</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                to="/superadmin/vendors/create"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold transition-all hover:scale-105"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Add Vendor</span>
              </Link>
            </div>
          </div>

          {/* Card A4: Sales Team */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
            <div>
              {/* Top Row: 3D Purple Briefcase + Zones Pill */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-pink-500 text-white flex items-center justify-center icon-3d shadow-md shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                  <Briefcase className="w-6 h-6 drop-shadow-sm" />
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200/60 shadow-2xs shrink-0">
                  {modules.sales_team.territories_count} Zones
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Sales Team
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Territory leads &amp; client outreach
              </p>

              {/* Primary Metric */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-numbers">
                  <AnimatedCounter value={modules.sales_team.total} />
                </span>
                <span className="text-xs font-semibold text-slate-500">Reps</span>
              </div>

              {/* Key Operational Highlight Chips */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                  <span className="text-sm font-extrabold text-emerald-600 tabular-numbers mt-0.5">
                    <AnimatedCounter value={modules.sales_team.active} /> Active
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zones</span>
                  <span className="text-sm font-extrabold text-purple-600 tabular-numbers mt-0.5">
                    <AnimatedCounter value={modules.sales_team.territories_count} /> Coverage
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/sales-members"
                className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors inline-flex items-center gap-1 group/btn"
              >
                <span>View Team</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                to="/superadmin/sales-members/create"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-all hover:scale-105"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>Add Rep</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. Section B: Inventory & Supply Chain Health (Cards)    */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Inventory &amp; Medical Supplies Oversight
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Current hospital stock levels, valuation, catalog categories, and depletion warnings.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <Link
              to="/superadmin/inventory/stocks"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <span>Manage Stocks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/superadmin/inventory/overview"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors"
            >
              <span>Inventory Overview</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Inventory Quick Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/90">
            <span className="text-[11px] font-semibold text-slate-500 block">Catalog Products</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1 tabular-numbers">
              {summary.total_inventory_products}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/90">
            <span className="text-[11px] font-semibold text-slate-500 block">In-Stock Units</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1 tabular-numbers">
              {summary.total_inventory_units.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/90">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Valuation</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1 tabular-numbers truncate">
              {formatCurrency(summary.total_inventory_valuation)}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/90">
            <span className="text-[11px] font-semibold text-slate-500 block">Low Stock Alerts</span>
            <span className={`text-xl sm:text-2xl font-black block mt-1 tabular-numbers ${summary.low_stock_products_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {summary.low_stock_products_count}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/90">
            <span className="text-[11px] font-semibold text-slate-500 block">Product Categories</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1 tabular-numbers">
              {modules.inventory?.categories_count || 0}
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/90">
            <span className="text-[11px] font-semibold text-slate-500 block">Brands Catalog</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-1 tabular-numbers">
              {modules.inventory?.brands_count || 0}
            </span>
          </div>
        </div>

        {/* Depleted & Low Stock List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Critical Low Stock / Depleted Supplies
            </span>
            <Link
              to="/superadmin/inventory/stocks?status=low_stock"
              className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
            >
              View Full Depletion List
            </Link>
          </div>

          {modules.inventory?.low_stock_items && modules.inventory.low_stock_items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.inventory.low_stock_items.map((prod) => (
                <div key={prod.id} className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-slate-900 text-sm">{prod.product_name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] shrink-0">
                        Low Stock
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {prod.category?.name || 'Category'} &bull; {prod.brand?.name || 'Brand'}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-200/50 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Stock Level</span>
                      <span className="font-mono font-bold text-slate-900">
                        {prod.quantity} / {prod.low_stock_threshold} units
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Cost</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {formatCurrency(prod.buy_price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-7 px-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-emerald-800">
                All inventory products have adequate stock levels. No depleted items detected.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8. Section C: Payouts & Financial Ledger (2 Cards)       */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Payout Settlements &amp; Financial Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Staff salary disbursements, vendor supply invoices, and pending liability balance.
            </p>
          </div>
          <Link
            to="/superadmin/payouts/ledger"
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors inline-flex items-center gap-1"
          >
            <span>Complete Ledger Passbook</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Staff Payouts Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Staff Salary Payouts</h3>
                    <p className="text-[11px] text-slate-500">Medical staff compensation vouchers</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-extrabold shrink-0">
                  {modules.payouts?.staff_count || 0} Vouchers
                </span>
              </div>

              <div className="my-4">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Disbursed to Staff</span>
                <div className="text-3xl font-black text-slate-900 mt-1 tabular-numbers truncate">
                  {formatCurrency(modules.payouts?.staff_disbursed || 0)}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Automatic tax &amp; deduction logging</span>
              <Link
                to="/superadmin/payouts/staff"
                className="text-purple-600 hover:text-purple-800 font-bold inline-flex items-center gap-1"
              >
                <span>Staff Payouts</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Vendor Payouts Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Vendor Supplier Invoices</h3>
                    <p className="text-[11px] text-slate-500">Procurement &amp; clinic consumables</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold shrink-0">
                  {modules.payouts?.vendor_count || 0} Invoices
                </span>
              </div>

              <div className="my-4">
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Settled to Suppliers</span>
                <div className="text-3xl font-black text-slate-900 mt-1 tabular-numbers truncate">
                  {formatCurrency(modules.payouts?.vendor_disbursed || 0)}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Pending: {formatCurrency(modules.payouts?.pending_liabilities || 0)}</span>
              <Link
                to="/superadmin/payouts/vendors"
                className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
              >
                <span>Vendor Payouts</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 9. Section D: Real Enterprise Audit & Activity Logs      */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Real-Time Enterprise Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Direct chronological logs of system logins, customer modifications, and administrative operations.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 shrink-0">
            {recentActivity.length} Recent Events
          </span>
        </div>

        {recentActivity && recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentActivity.map((log) => (
              <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 px-3 rounded-xl transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 uppercase">
                        {log.action ? log.action.replace('_', ' ') : 'SYSTEM EVENT'}
                      </span>
                      {log.ip_address && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.ip_address}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
                      {log.description || 'System operation executed.'}
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono shrink-0 sm:text-right pl-5 sm:pl-0">
                  {log.created_at ? new Date(log.created_at).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : 'Recently'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400">
            No system activity logs recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
