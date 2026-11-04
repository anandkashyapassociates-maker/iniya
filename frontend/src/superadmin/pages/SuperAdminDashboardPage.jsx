import React, { useState, useEffect, useCallback } from 'react';
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
  Eye,
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
  Layers,
  FileText,
  UserX,
  ExternalLink,
} from 'lucide-react';
import { useSuperAdminAuth } from '../auth/SuperAdminAuthContext';
import superAdminDashboardService from '../services/superAdminDashboardService';
import { useToast } from '../../context/ToastContext';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import { ClinicBannerBackground } from '../../components/ClinicArtwork';
import { getIndianGreeting } from '../../utils/timeGreeting';

export default function SuperAdminDashboardPage() {
  const { user } = useSuperAdminAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

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
          toast.success('Live dashboard metrics refreshed from database.');
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
    clinical: { total_customers: 0, total_master_appointments: 0, total_sessions: 0, total_services: 0, sessions_pending: 0, sessions_in_progress: 0, sessions_completed: 0, sessions_cancelled: 0, recent_appointments: [] },
    payouts: { total_payouts: 0, staff_disbursed: 0, staff_count: 0, vendor_disbursed: 0, vendor_count: 0, total_disbursed: 0, pending_liabilities: 0, recent_payouts: [] },
  };

  const recentActivity = dashboardData?.recent_activity || [];
  const greeting = getIndianGreeting();
  const superAdminDisplayName = user?.name || 'Super Admin';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="space-y-7 pb-16 animate-fade-in font-sans text-slate-800">
      {/* ======================================================== */}
      {/* 1. Executive Greeting Banner                            */}
      {/* ======================================================== */}
      <div className="border border-blue-200/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xs min-h-[160px] flex items-center bg-gradient-to-r from-blue-900/10 via-white to-indigo-900/10">
        <ClinicBannerBackground isSuperAdmin={true} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-700 text-xs font-bold tracking-wide uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Superadmin Executive Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {greeting}, {superAdminDisplayName}!
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Real-time administrative governance, clinical reports, inventory supplies, and payout settlements across the enterprise network.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
              title="Refresh live metrics from database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Synchronizing...' : 'Sync System Metrics'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Executive Quick Action Strip (Sidebar Shortcuts)       */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Sidebar Quick Actions
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/superadmin/admin-management/create"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Add Admin</span>
          </Link>

          <Link
            to="/superadmin/staff-management/create"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Add Staff</span>
          </Link>

          <Link
            to="/superadmin/vendors/create"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Add Vendor</span>
          </Link>

          <Link
            to="/superadmin/sales-members/create"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>Add Sales Member</span>
          </Link>

          <Link
            to="/superadmin/inventory/stocks"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
          >
            <Boxes className="w-3.5 h-3.5 text-slate-600" />
            <span>Stock Inventory</span>
          </Link>

          <Link
            to="/superadmin/reports/appointments"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>Appointment Reports</span>
          </Link>

          <Link
            to="/superadmin/payouts/ledger"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-600" />
            <span>Financial Ledger</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Low Stock Alert Oversight Banner                       */}
      {/* ======================================================== */}
      {summary.low_stock_products_count > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-900">
                  Low Inventory Alert Oversight
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-xs font-extrabold">
                  {summary.low_stock_products_count} items depleted
                </span>
              </div>
              <p className="text-xs text-amber-700 mt-1">
                Hospital supplies require replenishment. Notify branch administrators to restock depleting medical items.
              </p>
            </div>
          </div>
          <Link
            to="/superadmin/inventory/stocks?status=low_stock"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
          >
            <span>Review Low Stock List</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. Core Enterprise KPI Pillars (Mirroring Sidebar Groups) */}
      {/* ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Hospital Operations Overview
          </h2>
          <span className="text-xs text-slate-500">100% Real Database Metrics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* CARD 1: Hospital Personnel Workforce */}
          <Link
            to="/superadmin/staff-management/details"
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Personnel &amp; Workforce</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {summary.total_personnel}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {modules.admins.total} Admins, {modules.staff.total} Staff, {modules.vendors.total} Vendors, {modules.sales_team.total} Sales
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {summary.active_rate}% Active
              </span>
              <span className="text-slate-400 group-hover:text-blue-600 font-medium inline-flex items-center gap-0.5">
                Staff Roster <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 2: Clinical Appointments & OPD */}
          <Link
            to="/superadmin/reports/appointments"
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Clinical OPD &amp; Sessions</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {summary.total_master_appointments}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {summary.total_appointment_sessions} Sessions | {summary.total_customers} Registered Patients
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                {modules.clinical?.sessions_completed || 0} Completed
              </span>
              <span className="text-slate-400 group-hover:text-emerald-600 font-medium inline-flex items-center gap-0.5">
                Reports <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 3: Inventory Supplies & Valuation */}
          <Link
            to="/superadmin/inventory/overview"
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Inventory &amp; Valuation</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(summary.total_inventory_valuation)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {summary.total_inventory_products} Products ({summary.total_inventory_units} In-Stock Units)
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className={`font-semibold ${summary.low_stock_products_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {summary.low_stock_products_count > 0 ? `${summary.low_stock_products_count} Alerts` : 'Adequate Supply'}
              </span>
              <span className="text-slate-400 group-hover:text-amber-600 font-medium inline-flex items-center gap-0.5">
                Overview <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          {/* CARD 4: Financial Settlements & Payouts */}
          <Link
            to="/superadmin/payouts/ledger"
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">Disbursements &amp; Payouts</span>
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatCurrency(summary.total_disbursed)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {summary.total_payouts} Disbursed Vouchers Recorded
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                Pending: {formatCurrency(summary.pending_payout_liabilities)}
              </span>
              <span className="text-slate-400 group-hover:text-purple-600 font-medium inline-flex items-center gap-0.5">
                Ledger <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. Section A: Personnel & Workforce Modules Oversight    */}
      {/*    (Directly matching Admins, Staff, Vendors, Sales)     */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Workforce &amp; Operational Roster
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of system administrators, medical staff, vendors, and sales team.
            </p>
          </div>
          <Link
            to="/superadmin/admin-management/details"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
          >
            <span>All Admins</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card A1: Admin Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Admin Management</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold">
                  {modules.admins.active_rate}% Active
                </span>
              </div>

              <div className="text-2xl font-black text-slate-900">
                {modules.admins.total} <span className="text-xs font-normal text-slate-500">Admins</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>Active: <strong className="text-emerald-600">{modules.admins.active}</strong></span>
                <span>Blocked: <strong className="text-rose-600">{modules.admins.blocked}</strong></span>
              </div>

              {/* Recent Admins Roster */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Recent Admins
                </span>
                {modules.admins.recent && modules.admins.recent.length > 0 ? (
                  modules.admins.recent.slice(0, 3).map((adm) => (
                    <div key={adm.id} className="flex items-center justify-between text-xs py-1">
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-800 truncate">{adm.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{adm.email}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
                        Active
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-1">No admin accounts found.</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/admin-management/details"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                View Roster
              </Link>
              <Link
                to="/superadmin/admin-management/create"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                <span>Add Admin</span>
              </Link>
            </div>
          </div>

          {/* Card A2: Staff Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Staff Management</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold">
                  {modules.staff.departments_count} Depts
                </span>
              </div>

              <div className="text-2xl font-black text-slate-900">
                {modules.staff.total} <span className="text-xs font-normal text-slate-500">Staff Members</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>Active: <strong className="text-emerald-600">{modules.staff.active}</strong></span>
                <span>Inactive: <strong className="text-slate-500">{modules.staff.inactive}</strong></span>
              </div>

              {/* Recent Staff Roster */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Recent Staff
                </span>
                {modules.staff.recent && modules.staff.recent.length > 0 ? (
                  modules.staff.recent.slice(0, 3).map((stf) => (
                    <div key={stf.id} className="flex items-center justify-between text-xs py-1">
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-800 truncate">{stf.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{stf.department || 'General'}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold shrink-0">
                        {stf.designation || 'Staff'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-1">No staff members found.</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/staff-management/details"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                View Roster
              </Link>
              <Link
                to="/superadmin/staff-management/create"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add Staff</span>
              </Link>
            </div>
          </div>

          {/* Card A3: Vendor Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Vendor Management</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-extrabold">
                  {modules.vendors.types_count} Categories
                </span>
              </div>

              <div className="text-2xl font-black text-slate-900">
                {modules.vendors.total} <span className="text-xs font-normal text-slate-500">Vendors</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>Active: <strong className="text-emerald-600">{modules.vendors.active}</strong></span>
                <span>Suppliers: <strong className="text-slate-700">{modules.vendors.total}</strong></span>
              </div>

              {/* Recent Vendors Roster */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Recent Vendors
                </span>
                {modules.vendors.recent && modules.vendors.recent.length > 0 ? (
                  modules.vendors.recent.slice(0, 3).map((vnd) => (
                    <div key={vnd.id} className="flex items-center justify-between text-xs py-1">
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-800 truncate">{vnd.vendor_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{vnd.company_name || vnd.email}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold shrink-0">
                        {vnd.vendor_type || 'Supply'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-1">No vendors recorded yet.</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/vendors"
                className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
              >
                View Vendors
              </Link>
              <Link
                to="/superadmin/vendors/create"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Add Vendor</span>
              </Link>
            </div>
          </div>

          {/* Card A4: Sales Team Management */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Sales Management</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-extrabold">
                  {modules.sales_team.territories_count} Zones
                </span>
              </div>

              <div className="text-2xl font-black text-slate-900">
                {modules.sales_team.total} <span className="text-xs font-normal text-slate-500">Sales Reps</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>Active: <strong className="text-emerald-600">{modules.sales_team.active}</strong></span>
                <span>Territories: <strong className="text-purple-600">{modules.sales_team.territories_count}</strong></span>
              </div>

              {/* Recent Sales Team */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Recent Sales Reps
                </span>
                {modules.sales_team.recent && modules.sales_team.recent.length > 0 ? (
                  modules.sales_team.recent.slice(0, 3).map((sls) => (
                    <div key={sls.id} className="flex items-center justify-between text-xs py-1">
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-800 truncate">{sls.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{sls.territory || 'General'}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold shrink-0">
                        {sls.designation || 'Sales'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-2 text-center">
                    No sales members added yet.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                to="/superadmin/sales-members"
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
              >
                View Team
              </Link>
              <Link
                to="/superadmin/sales-members/create"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-600" />
                <span>Add Rep</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. Section B: Inventory & Supply Chain Health            */}
      {/*    (Directly matching Sidebar Inventory Management)      */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Inventory &amp; Medical Supplies Oversight
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Current hospital stock levels, valuation, catalog categories, and depletion warnings.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/superadmin/inventory/stocks"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <span>Manage Stocks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/superadmin/inventory/overview"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors"
            >
              <span>Inventory Overview</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Inventory Quick Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Catalog Products</span>
            <span className="text-xl font-black text-slate-900 block mt-1">
              {summary.total_inventory_products}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">In-Stock Units</span>
            <span className="text-xl font-black text-slate-900 block mt-1">
              {summary.total_inventory_units.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Valuation</span>
            <span className="text-xl font-black text-slate-900 block mt-1">
              {formatCurrency(summary.total_inventory_valuation)}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Low Stock Alerts</span>
            <span className={`text-xl font-black block mt-1 ${summary.low_stock_products_count > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {summary.low_stock_products_count}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Product Categories</span>
            <span className="text-xl font-black text-slate-900 block mt-1">
              {modules.inventory?.categories_count || 0}
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Brands</span>
            <span className="text-xl font-black text-slate-900 block mt-1">
              {modules.inventory?.brands_count || 0}
            </span>
          </div>
        </div>

        {/* Depleted & Low Stock Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Critical Low Stock / Depleted Items
            </span>
            <Link
              to="/superadmin/inventory/stocks?status=low_stock"
              className="text-xs font-semibold text-amber-600 hover:text-amber-800 transition-colors"
            >
              View Full Depletion Report
            </Link>
          </div>

          {modules.inventory?.low_stock_items && modules.inventory.low_stock_items.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3 text-right">In-Stock Qty</th>
                    <th className="px-4 py-3 text-right">Threshold</th>
                    <th className="px-4 py-3 text-right">Unit Buy Price</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modules.inventory.low_stock_items.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{prod.product_name}</td>
                      <td className="px-4 py-3 text-slate-600">{prod.category?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{prod.brand?.name || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {prod.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                        {prod.low_stock_threshold}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatCurrency(prod.buy_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                          Low Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-emerald-800">
                All inventory products have adequate stock levels. No depleted items detected.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. Section C: Clinical Appointments & Financial Payouts  */}
      {/*    (2-Column Layout: Reports & Analytics + Payouts)      */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Col 1-6): Clinical OPD & Reports Overview */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Clinical Appointments &amp; OPD
                </h2>
              </div>
              <Link
                to="/superadmin/reports/appointments"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors inline-flex items-center gap-1"
              >
                <span>Reports</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Metrics Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Master Appts</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {summary.total_master_appointments}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sessions</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {summary.total_appointment_sessions}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Patients</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {summary.total_customers}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Treatments</span>
                <span className="text-lg font-black text-slate-900 mt-0.5 block">
                  {summary.total_services}
                </span>
              </div>
            </div>

            {/* Sessions Status Breakdown */}
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-4">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide block mb-2">
                Clinical Sessions Status Breakdown
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-600">Pending: <strong>{modules.clinical?.sessions_pending || 0}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-600">In Progress: <strong>{modules.clinical?.sessions_in_progress || 0}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Completed: <strong>{modules.clinical?.sessions_completed || 0}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-600">Cancelled: <strong>{modules.clinical?.sessions_cancelled || 0}</strong></span>
                </div>
              </div>
            </div>

            {/* Recent Appointments Table / Clean Empty State */}
            {modules.clinical?.recent_appointments && modules.clinical.recent_appointments.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Appt #</th>
                      <th className="px-3 py-2.5">Patient</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modules.clinical.recent_appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-mono font-bold text-slate-800">{appt.appointment_number}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {appt.customer ? `${appt.customer.first_name} ${appt.customer.last_name || ''}` : 'Patient'}
                        </td>
                        <td className="px-3 py-2 text-slate-500">{appt.appointment_date}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(appt.appointment_fees)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-slate-100">
                <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">
                  No appointments booked in the system yet.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  When doctors and staff register patient consultations in the clinic desk, appointments will display here.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              to="/superadmin/reports/sessions"
              className="text-slate-600 hover:text-slate-900 font-semibold"
            >
              Session-Wise Reports
            </Link>
            <Link
              to="/superadmin/reports/appointments"
              className="text-emerald-600 hover:text-emerald-800 font-bold inline-flex items-center gap-1"
            >
              <span>Open Appointment Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column (Col 7-12): Payouts & Financial Ledger */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Payout Settlements &amp; Ledger
                </h2>
              </div>
              <Link
                to="/superadmin/payouts/ledger"
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors inline-flex items-center gap-1"
              >
                <span>Ledger</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Payout Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wide block">
                  Staff Payouts Disbursed
                </span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {formatCurrency(modules.payouts?.staff_disbursed || 0)}
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5">
                  {modules.payouts?.staff_count || 0} vouchers paid to medical staff
                </div>
                <Link
                  to="/superadmin/payouts/staff"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 mt-2"
                >
                  <span>Staff Payouts</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide block">
                  Vendor Payouts Disbursed
                </span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {formatCurrency(modules.payouts?.vendor_disbursed || 0)}
                </div>
                <div className="text-[11px] text-indigo-700 mt-0.5">
                  {modules.payouts?.vendor_count || 0} invoices settled to suppliers
                </div>
                <Link
                  to="/superadmin/payouts/vendors"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 mt-2"
                >
                  <span>Vendor Payouts</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Total Balance / Liability */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between mb-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Pending Liability / Balances</span>
                <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                  {formatCurrency(modules.payouts?.pending_liabilities || 0)}
                </span>
              </div>
              <Link
                to="/superadmin/payouts/ledger"
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                View Full Passbook
              </Link>
            </div>

            {/* Recent Payouts Table / Clean State */}
            {modules.payouts?.recent_payouts && modules.payouts.recent_payouts.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Voucher #</th>
                      <th className="px-3 py-2.5">Beneficiary</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modules.payouts.recent_payouts.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-mono font-bold text-slate-800">{pay.payout_number}</td>
                        <td className="px-3 py-2 text-slate-700">
                          {pay.payout_type === 'staff' ? (pay.staff?.name || 'Staff') : (pay.vendor?.vendor_name || 'Vendor')}
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded uppercase text-[9px] font-extrabold bg-slate-100 text-slate-700">
                            {pay.payout_type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(pay.paid_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-slate-100">
                <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">
                  No payout vouchers recorded yet.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Disburse staff salaries or clear vendor supplier invoices to track settlements here.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              to="/superadmin/payouts/staff"
              className="text-slate-600 hover:text-slate-900 font-semibold"
            >
              + Disburse Staff Payout
            </Link>
            <Link
              to="/superadmin/payouts/vendors"
              className="text-purple-600 hover:text-purple-800 font-bold inline-flex items-center gap-1"
            >
              <span>+ Settle Vendor Invoice</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 8. Section D: Real Enterprise Audit & Activity Logs      */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Real-Time Enterprise Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Direct chronological logs of system logins, customer modifications, and administrative operations.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {recentActivity.length} Recent Events
          </span>
        </div>

        {recentActivity && recentActivity.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {recentActivity.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 uppercase">
                        {log.action ? log.action.replace('_', ' ') : 'SYSTEM EVENT'}
                      </span>
                      {log.ip_address && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {log.ip_address}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
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
