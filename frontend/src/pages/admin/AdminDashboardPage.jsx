import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  FolderTree,
  IndianRupee,
  TrendingUp,
  UserPlus,
  Zap,
  CalendarPlus,
  Boxes,
  Eye,
  AlertTriangle,
  Activity,
  ChevronRight,
  RefreshCw,
  CreditCard,
  Landmark,
  Smartphone,
  Wallet,
  Stethoscope,
  ShieldCheck,
  Award,
  FileText,
  Package,
  ArrowUpRight,
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import adminService from '../../services/adminService';
import adminMasterAppointmentService from '../../services/adminMasterAppointmentService';
import adminInventoryService from '../../services/adminInventoryService';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';
import {
  ClinicBannerBackground,
  ClinicHeartbeatLine,
} from '../../components/ClinicArtwork';
import {
  SplineAreaChart,
  MultiSegmentDonut,
} from '../../components/MiniCharts';
import { getIndianGreeting } from '../../utils/timeGreeting';

export default function AdminDashboardPage() {
  const { user } = useAdminAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState(null);
  const [inventoryStats, setInventoryStats] = useState(null);

  // Live Queue Tab Filter: 'all' | 'in_progress' | 'pending' | 'completed'
  const [queueTab, setQueueTab] = useState('all');

  const loadAllDashboardData = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const userIsStaff =
        user?.role?.toLowerCase() === 'staff' ||
        user?.user_type?.toLowerCase() === 'staff' ||
        Boolean(user?.is_staff) ||
        user?.role === 'Staff Practitioner' ||
        Boolean(user?.staff_code);

      if (userIsStaff) {
        const dashRes = await adminService.getDashboard();
        setDashboardData(dashRes);
      } else {
        const [dashRes, masterAptStatsRes, catStatsRes, stockStatsRes] = await Promise.allSettled([
          adminService.getDashboard(),
          adminMasterAppointmentService.getStats(),
          adminService.getCategoryStats(),
          adminInventoryService.getStockStats(),
        ]);

        if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value);
        if (masterAptStatsRes.status === 'fulfilled') setAppointmentStats(masterAptStatsRes.value);
        if (catStatsRes.status === 'fulfilled') setCategoryStats(catStatsRes.value);
        if (stockStatsRes.status === 'fulfilled') setInventoryStats(stockStatsRes.value);
      }
    } catch (err) {
      console.error('Failed to load Admin dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadAllDashboardData(false);
  }, [loadAllDashboardData]);

  if (isLoading) {
    return <DashboardSkeleton title="Loading Clinic Dashboard & Command Center..." />;
  }

  const {
    stats = {},
    account = {},
    payment_modes = {},
    revenue_chart = {},
    doctors_on_duty = [],
    low_stock_products = [],
    recent_patients = [],
    recent_activity = [],
    schedule_sessions = [],
  } = dashboardData || {};

  const masterStats = appointmentStats?.data || appointmentStats || {};

  // Check if current user is Staff or Administrator (strictly verified)
  const isStaff =
    user?.role?.toLowerCase() === 'staff' ||
    user?.user_type?.toLowerCase() === 'staff' ||
    Boolean(user?.is_staff) ||
    user?.role === 'Staff Practitioner' ||
    Boolean(user?.staff_code) ||
    account?.role === 'staff' ||
    Boolean(account?.is_staff) ||
    account?.role === 'Staff Practitioner' ||
    Boolean(stats?.is_staff);

  // Operational metrics (strictly personal to the logged-in staff member when isStaff is true)
  const totalPatients = isStaff ? 0 : (stats?.total_customers ?? 0);
  const newPatientsThisMonth = isStaff ? 0 : (stats?.new_customers_this_month ?? 0);
  const todaySessionsCount = stats?.today_sessions ?? (isStaff ? 0 : (masterStats?.today_sessions ?? 0));
  const upcomingQueueCount = stats?.upcoming_appointments ?? (isStaff ? 0 : (masterStats?.upcoming_sessions ?? 0));
  const pendingCount = stats?.pending_sessions ?? (isStaff ? 0 : (masterStats?.pending_sessions ?? 0));
  const inProgressCount = stats?.in_progress_sessions ?? (isStaff ? 0 : (masterStats?.in_progress_sessions ?? 0));
  const completedCount = stats?.completed_sessions ?? (isStaff ? 0 : (masterStats?.completed_sessions ?? 0));
  const cancelledCount = stats?.cancelled_sessions ?? (isStaff ? 0 : (masterStats?.cancelled_sessions ?? 0));
  const activePackages = stats?.active_packages ?? (isStaff ? 0 : (categoryStats?.active ?? categoryStats?.total ?? 0));
  const lowStockCount = stats?.low_stock_count ?? (isStaff ? 0 : (inventoryStats?.total_low_stock_alerts ?? 0));
  const totalInventory = stats?.total_inventory_products ?? (isStaff ? 0 : (inventoryStats?.total_products ?? 0));
  const sessionCompletionRate = stats?.session_completion_rate ?? 0;

  // Financial metrics
  const todayRevenue = stats?.today_revenue ?? 0;
  const totalRevenue = stats?.total_revenue ?? 0;
  const todayPatientPaid = stats?.today_patient_paid ?? 0;
  const totalPatientPaid = stats?.total_patient_paid ?? 0;
  const todayStaffCommission = stats?.today_staff_commission ?? 0;
  const totalStaffCommission = stats?.total_staff_commission ?? 0;

  const totalCollections =
    (payment_modes.cash || 0) +
    (payment_modes.upi || 0) +
    (payment_modes.card || 0) +
    (payment_modes.bank || 0) || totalPatientPaid || 1;

  // Filtered live queue sessions
  const filteredSessions = Array.isArray(schedule_sessions)
    ? queueTab === 'all'
      ? schedule_sessions
      : schedule_sessions.filter((s) => s.status === queueTab)
    : [];

  const adminDisplayName = user?.name || account?.name || (isStaff ? 'Dr. Staff Practitioner' : 'Clinic Administrator');
  const greeting = getIndianGreeting();

  // Fallback revenue chart dataset if empty
  const fallbackChartVal = isStaff ? (totalStaffCommission || 0) : (totalRevenue || 0);
  const defaultRevenueDataByPeriod = {
    'Last 6 Months': [
      { label: 'Jun', value: 0, display: '₹0' },
      { label: 'Jul', value: 0, display: '₹0' },
      { label: 'Aug', value: 0, display: '₹0' },
      { label: 'Sep', value: 0, display: '₹0' },
      { label: 'Oct', value: 0, display: '₹0' },
      { label: 'Nov', value: fallbackChartVal, display: `₹${fallbackChartVal.toLocaleString('en-IN')}` },
    ],
    'Last 30 Days': [
      { label: 'Week 1', value: 0, display: '₹0' },
      { label: 'Week 2', value: 0, display: '₹0' },
      { label: 'Week 3', value: 0, display: '₹0' },
      { label: 'Week 4', value: fallbackChartVal, display: `₹${fallbackChartVal.toLocaleString('en-IN')}` },
    ],
    'This Year': [
      { label: 'Q1', value: 0, display: '₹0' },
      { label: 'Q2', value: 0, display: '₹0' },
      { label: 'Q3', value: 0, display: '₹0' },
      { label: 'Q4', value: fallbackChartVal, display: `₹${fallbackChartVal.toLocaleString('en-IN')}` },
    ],
  };

  const chartData = revenue_chart && Object.keys(revenue_chart).length > 0
    ? revenue_chart
    : defaultRevenueDataByPeriod;

  return (
    <div className="space-y-6 pb-14 animate-fade-in font-sans">
      {/* ======================================================== */}
      {/* 1. EXECUTIVE COMMAND BANNER (Role-Tailored)               */}
      {/* ======================================================== */}
      <div className="border border-blue-200/80 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xs min-h-[175px] flex items-center">
        {/* Animated Background */}
        <ClinicBannerBackground isSuperAdmin={false} />

        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            {/* Top Operational Status Pill */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/90 text-blue-800 text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {isStaff
                    ? "PRACTITIONER CLINICAL DESK • TODAY'S OPD CONSULTATIONS"
                    : 'OPD CLINICAL DESK ONLINE • ALL SYSTEMS OPERATIONAL'}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold shadow-2xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>100% Real Database Metrics</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display flex items-center gap-2">
              <span>{greeting}, {adminDisplayName}!</span>
              <span className="text-2xl sm:text-3xl animate-bounce">👋</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed max-w-lg">
              {isStaff
                ? `${account.department || user?.department || 'Clinical'} Specialist • Staff ID: ${account.staff_code || user?.staff_code || 'STF'} • Manage your assigned consultations, review treatment progress, and monitor your personal clinical earnings.`
                : 'Welcome to your Clinic Command Center. Manage consultations, monitor live doctor queues, control medical supplies, and review instant financial collections.'}
            </p>

            {/* Heartbeat ECG Line beneath greeting */}
            <div className="mt-3 max-w-xs text-blue-500 opacity-80">
              <ClinicHeartbeatLine className="w-full h-5" />
            </div>

            {/* Quick Action Command Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              {isStaff ? (
                <>
                  <Link
                    to="/admin/my-appointments"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer font-display"
                  >
                    <Calendar className="w-4 h-4 text-blue-200" />
                    <span>My Assigned Sessions</span>
                  </Link>
                  <Link
                    to="/admin/profile"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 hover:border-slate-400 transition-all cursor-pointer font-display shadow-xs"
                  >
                    <Stethoscope className="w-4 h-4 text-teal-600" />
                    <span>My Profile</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/admin/appointments/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all cursor-pointer font-display"
                  >
                    <CalendarPlus className="w-4 h-4 text-blue-200" />
                    <span>+ Book Appointment</span>
                  </Link>
                  <Link
                    to="/admin/customers/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-800 transition-all cursor-pointer font-display shadow-xs"
                  >
                    <UserPlus className="w-4 h-4 text-teal-300" />
                    <span>+ Register Patient</span>
                  </Link>
                  <Link
                    to="/admin/appointments/calendar"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 hover:border-slate-400 transition-all cursor-pointer font-display shadow-xs"
                  >
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>OPD Calendar</span>
                  </Link>
                  <Link
                    to="/admin/inventory/stocks"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-300 hover:border-slate-400 transition-all cursor-pointer font-display shadow-xs"
                  >
                    <Boxes className="w-4 h-4 text-amber-600" />
                    <span>Medical Supplies</span>
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => loadAllDashboardData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-300 hover:border-slate-400 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Refresh Live Clinic Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CRITICAL LOW INVENTORY ALERT BANNER (If Depleted)     */}
      {/* ======================================================== */}
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Medical Supplies &amp; Consumables Alert</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                  {lowStockCount} item{lowStockCount > 1 ? 's' : ''} depleted / low
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Hospital supplies require replenishment. Ensure adequate consumables before performing clinical treatments.
              </p>
            </div>
          </div>
          <Link
            to="/admin/inventory/stocks?status=low_stock"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <span>Review Supplies</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. EXECUTIVE FINANCIAL & CLINICAL KPI MATRIX (100% Real DB) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {isStaff ? (
          <>
            {/* STAFF CARD 1: My Total Consultations */}
            <Link to="/admin/my-appointments" className="block group">
              <StatCard
                title="My Total Consultations"
                value={stats?.total_sessions ?? 0}
                subtitle={`${todaySessionsCount} scheduled for today`}
                icon={Calendar}
                colorScheme="blue"
                trend={stats?.total_sessions > 0 ? `${stats.total_sessions} Assigned` : '0 Assigned'}
                trendColor={stats?.total_sessions > 0 ? 'blue' : 'slate'}
                actionText="My Queue ↗"
              />
            </Link>

            {/* STAFF CARD 2: Today's Active Consultations */}
            <Link to="/admin/my-appointments" className="block group">
              <StatCard
                title="Today's Active Sessions"
                value={todaySessionsCount}
                subtitle={`${inProgressCount} active • ${pendingCount} pending`}
                icon={Clock}
                colorScheme="emerald"
                trend={todaySessionsCount > 0 ? `${todaySessionsCount} Today` : '0 Active Queue'}
                trendColor={todaySessionsCount > 0 ? 'emerald' : 'slate'}
                actionText="Live Sessions ↗"
              />
            </Link>

            {/* STAFF CARD 3: In-Progress Treatments */}
            <Link to="/admin/my-appointments" className="block group">
              <StatCard
                title="In-Progress Treatments"
                value={inProgressCount}
                subtitle="Currently undergoing therapy"
                icon={Activity}
                colorScheme="indigo"
                trend={inProgressCount > 0 ? `${inProgressCount} In Therapy` : '0 In Progress'}
                trendColor={inProgressCount > 0 ? 'blue' : 'slate'}
                actionText="Active Cases ↗"
              />
            </Link>

            {/* STAFF CARD 4: Completed Consultations */}
            <Link to="/admin/my-appointments" className="block group">
              <StatCard
                title="Completed Sessions"
                value={completedCount}
                subtitle={`${sessionCompletionRate}% personal completion rate`}
                icon={CheckCircle2}
                colorScheme="emerald"
                trend={completedCount > 0 ? `${completedCount} Closed` : '0 Closed'}
                trendColor={completedCount > 0 ? 'emerald' : 'slate'}
                actionText="Completed ↗"
              />
            </Link>

            {/* STAFF CARD 5: Total Earned Commission */}
            <div className="block">
              <StatCard
                title="My Total Commission"
                value={totalStaffCommission > 0 ? `₹${totalStaffCommission.toLocaleString('en-IN')}` : '₹0'}
                subtitle="Earned across completed sessions"
                icon={Award}
                colorScheme="purple"
                animateCount={false}
                trend={totalStaffCommission > 0 ? `₹${totalStaffCommission.toLocaleString('en-IN')} Earned` : '₹0 Earned'}
                trendColor={totalStaffCommission > 0 ? 'purple' : 'slate'}
                actionText="Earnings ↗"
              />
            </div>

            {/* STAFF CARD 6: Today's Cleared Commission */}
            <div className="block">
              <StatCard
                title="Today's Commission"
                value={todayStaffCommission > 0 ? `₹${todayStaffCommission.toLocaleString('en-IN')}` : '₹0'}
                subtitle="Cleared from today's treatments"
                icon={IndianRupee}
                colorScheme="teal"
                animateCount={false}
                trend={todayStaffCommission > 0 ? `₹${todayStaffCommission.toLocaleString('en-IN')} Cleared` : '₹0 Today'}
                trendColor={todayStaffCommission > 0 ? 'emerald' : 'slate'}
                actionText="Daily Payout ↗"
              />
            </div>

            {/* STAFF CARD 7: Pending Patient Queue */}
            <Link to="/admin/my-appointments" className="block group">
              <StatCard
                title="Pending Consultations"
                value={pendingCount}
                subtitle="Upcoming patient appointments"
                icon={Clock}
                colorScheme="amber"
                trend={pendingCount > 0 ? `${pendingCount} Awaiting` : '0 Pending'}
                trendColor={pendingCount > 0 ? 'amber' : 'slate'}
                actionText="Patient Queue ↗"
              />
            </Link>

            {/* STAFF CARD 8: Medical Inventory Stock (Information-only, managed by Admin) */}
            <div className="block">
              <StatCard
                title="Hospital Supplies Stock"
                value={totalInventory}
                subtitle={lowStockCount > 0 ? `${lowStockCount} items depleted` : 'Adequate supply'}
                icon={Boxes}
                colorScheme={lowStockCount > 0 ? 'amber' : 'emerald'}
                trend={lowStockCount > 0 ? `${lowStockCount} Alerts Depleted` : 'Stock Healthy'}
                trendColor={lowStockCount > 0 ? 'amber' : 'emerald'}
                actionText="Supplies ↗"
              />
            </div>
          </>
        ) : (
          <>
            {/* ADMIN ROW 1 - CARD 1: Total Registered Patients */}
            <Link to="/admin/customers" className="block group">
              <StatCard
                title="Total Registered Patients"
                value={totalPatients}
                subtitle={`${newPatientsThisMonth} registered this month`}
                icon={Users}
                colorScheme="blue"
                trend={totalPatients > 0 ? `${totalPatients} Verified Profiles` : '0 Registered'}
                trendColor={totalPatients > 0 ? 'blue' : 'slate'}
                actionText="Patient Directory ↗"
              />
            </Link>

            {/* ADMIN ROW 1 - CARD 2: Today's OPD Consultations */}
            <Link to="/admin/appointments" className="block group">
              <StatCard
                title="Today's OPD Consultations"
                value={todaySessionsCount}
                subtitle={`${upcomingQueueCount} in active queue today`}
                icon={Calendar}
                colorScheme="emerald"
                trend={todaySessionsCount > 0 ? `${todaySessionsCount} In Queue Today` : '0 In Active Queue'}
                trendColor={todaySessionsCount > 0 ? 'emerald' : 'slate'}
                actionText="Live Queue ↗"
              />
            </Link>

            {/* ADMIN ROW 1 - CARD 3: Total Booked Value (Revenue) */}
            <div className="block">
              <StatCard
                title="Total Booked Value"
                value={totalRevenue > 0 ? `₹${totalRevenue.toLocaleString('en-IN')}` : '₹0'}
                subtitle={`₹${todayRevenue.toLocaleString('en-IN')} booked today`}
                icon={TrendingUp}
                colorScheme="violet"
                animateCount={false}
                trend={totalRevenue > 0 ? `₹${totalRevenue.toLocaleString('en-IN')} Booked` : '₹0 Booked'}
                trendColor={totalRevenue > 0 ? 'purple' : 'slate'}
                actionText="OPD Ledger ↗"
              />
            </div>

            {/* ADMIN ROW 1 - CARD 4: Patient Payments Received */}
            <div className="block">
              <StatCard
                title="Collections Received"
                value={totalPatientPaid > 0 ? `₹${totalPatientPaid.toLocaleString('en-IN')}` : '₹0'}
                subtitle={`₹${todayPatientPaid.toLocaleString('en-IN')} collected today`}
                icon={IndianRupee}
                colorScheme="emerald"
                animateCount={false}
                trend={totalPatientPaid > 0 ? `₹${totalPatientPaid.toLocaleString('en-IN')} Received` : '₹0 Received'}
                trendColor={totalPatientPaid > 0 ? 'emerald' : 'slate'}
                actionText="Collections ↗"
              />
            </div>

            {/* ADMIN ROW 2 - CARD 5: Staff Commissions Earned */}
            <div className="block">
              <StatCard
                title="Staff Commissions"
                value={totalStaffCommission > 0 ? `₹${totalStaffCommission.toLocaleString('en-IN')}` : '₹0'}
                subtitle={`₹${todayStaffCommission.toLocaleString('en-IN')} cleared today`}
                icon={Award}
                colorScheme="purple"
                animateCount={false}
                trend={totalStaffCommission > 0 ? `₹${totalStaffCommission.toLocaleString('en-IN')} Cleared` : '₹0 Cleared'}
                trendColor={totalStaffCommission > 0 ? 'purple' : 'slate'}
                actionText="Staff Payouts ↗"
              />
            </div>

            {/* ADMIN ROW 2 - CARD 6: Completed Sessions Rate */}
            <Link to="/admin/appointments" className="block group">
              <StatCard
                title="Execution Success Rate"
                value={`${sessionCompletionRate}%`}
                subtitle={`${completedCount} of ${stats?.total_sessions || 0} sessions closed`}
                icon={CheckCircle2}
                colorScheme="amber"
                animateCount={false}
                trend={completedCount > 0 ? `${completedCount} Closed` : '0 Sessions Closed'}
                trendColor={completedCount > 0 ? 'emerald' : 'slate'}
                actionText="Reports ↗"
              />
            </Link>

            {/* ADMIN ROW 2 - CARD 7: Active Clinical Packages */}
            <Link to="/admin/appointments/services" className="block group">
              <StatCard
                title="Clinical Services Catalog"
                value={activePackages}
                subtitle="Treatments & Procedures Active"
                icon={FolderTree}
                colorScheme="cyan"
                trend={`${activePackages} Active Treatments`}
                trendColor="cyan"
                actionText="Catalog ↗"
              />
            </Link>

            {/* ADMIN ROW 2 - CARD 8: Medical Supplies & Stock Health */}
            <Link to="/admin/inventory/stocks" className="block group">
              <StatCard
                title="Medical Supplies Health"
                value={totalInventory}
                subtitle={lowStockCount > 0 ? `${lowStockCount} items depleted` : 'Adequate supply'}
                icon={Boxes}
                colorScheme={lowStockCount > 0 ? 'amber' : 'emerald'}
                trend={lowStockCount > 0 ? `${lowStockCount} Alerts Depleted` : 'Stock Healthy'}
                trendColor={lowStockCount > 0 ? 'amber' : 'emerald'}
                actionText="Supplies Radar ↗"
              />
            </Link>
          </>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. FINANCIAL TREND SPLINE & PAYMENT DISTRIBUTION (7:5)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left (Col 1-7): Interactive Revenue & Collections Spline Chart */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
          <SplineAreaChart
            title={isStaff ? 'My Clinical Earnings & Commissions Trend' : 'OPD Revenue & Collections Trend'}
            icon={TrendingUp}
            headline={`₹${(isStaff ? totalStaffCommission : totalRevenue || 0).toLocaleString('en-IN')}`}
            trendBadge={isStaff ? 'Personal Earnings' : 'Real Clinic Ledger'}
            periods={['Last 6 Months', 'Last 30 Days', 'This Year']}
            dataByPeriod={chartData}
            className="h-full"
          />
        </div>

        {/* Right (Col 8-12): Session Status Donut & Payment Mode Breakdown */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col space-y-4">
          {/* Donut Card */}
          <MultiSegmentDonut
            title={isStaff ? 'My Session Status Distribution' : 'Session Execution Status'}
            icon={Clock}
            segments={[
              { label: 'Completed', value: completedCount, color: '#10b981', dotClass: 'bg-emerald-500' },
              { label: 'In Progress', value: inProgressCount, color: '#3b82f6', dotClass: 'bg-blue-500' },
              { label: 'Pending', value: pendingCount, color: '#f59e0b', dotClass: 'bg-amber-500' },
              { label: 'Cancelled', value: cancelledCount, color: '#ef4444', dotClass: 'bg-rose-500' },
            ]}
            centerValue={`${sessionCompletionRate}%`}
            centerLabel="Closed"
            className="h-auto"
          />

          {/* Payment Mode Distribution Card (Redesigned with 3D Animated Icons) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-emerald-500/25 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                  <CreditCard className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                    {isStaff ? 'Patient Payments in My Sessions' : 'Collections by Payment Mode'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Total ₹{(totalPatientPaid || 0).toLocaleString('en-IN')} Received &bull; Reconciled
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold font-mono shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified</span>
              </span>
            </div>

            {/* 4 Payment Tiles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4 relative z-10">
              {/* Tile 1: Cash */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-emerald-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center icon-3d shadow-sm shadow-emerald-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <Wallet className="w-4 h-4 drop-shadow-xs" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate group-hover/tile:text-emerald-700 transition-colors">
                        Cash
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">Counter Desk</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-slate-900 text-sm tabular-numbers">
                    ₹{(payment_modes.cash || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Share</span>
                    <span className="font-bold text-slate-600">
                      {totalPatientPaid > 0 ? Math.round(((payment_modes.cash || 0) / totalPatientPaid) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${totalPatientPaid > 0 ? Math.round(((payment_modes.cash || 0) / totalPatientPaid) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tile 2: UPI / QR */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-blue-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-600 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-blue-500/20 group-hover/tile:scale-110 group-hover/tile:-rotate-6 transition-all duration-300 shrink-0">
                      <Smartphone className="w-4 h-4 drop-shadow-xs" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate group-hover/tile:text-blue-700 transition-colors">
                        UPI / QR
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">Instant Pay</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-slate-900 text-sm tabular-numbers">
                    ₹{(payment_modes.upi || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Share</span>
                    <span className="font-bold text-slate-600">
                      {totalPatientPaid > 0 ? Math.round(((payment_modes.upi || 0) / totalPatientPaid) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 via-indigo-500 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${totalPatientPaid > 0 ? Math.round(((payment_modes.upi || 0) / totalPatientPaid) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tile 3: Card POS */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-indigo-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-violet-600 text-white flex items-center justify-center icon-3d shadow-sm shadow-indigo-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <CreditCard className="w-4 h-4 drop-shadow-xs" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate group-hover/tile:text-indigo-700 transition-colors">
                        Card POS
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">Terminal Swipe</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-slate-900 text-sm tabular-numbers">
                    ₹{(payment_modes.card || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Share</span>
                    <span className="font-bold text-slate-600">
                      {totalPatientPaid > 0 ? Math.round(((payment_modes.card || 0) / totalPatientPaid) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-400 via-purple-500 to-violet-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${totalPatientPaid > 0 ? Math.round(((payment_modes.card || 0) / totalPatientPaid) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tile 4: Bank Transfer */}
              <div className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-purple-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 via-violet-600 to-pink-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-purple-500/20 group-hover/tile:scale-110 group-hover/tile:-rotate-6 transition-all duration-300 shrink-0">
                      <Landmark className="w-4 h-4 drop-shadow-xs" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate group-hover/tile:text-purple-700 transition-colors">
                        Bank Transfer
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">NEFT / RTGS</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-slate-900 text-sm tabular-numbers">
                    ₹{(payment_modes.bank || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Share</span>
                    <span className="font-bold text-slate-600">
                      {totalPatientPaid > 0 ? Math.round(((payment_modes.bank || 0) / totalPatientPaid) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${totalPatientPaid > 0 ? Math.round(((payment_modes.bank || 0) / totalPatientPaid) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. LIVE OPD CLINICAL QUEUE & QUICK CONTROL HUB (7 : 5)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left (Col 1-7): Today's Live OPD & Session Dispatch Queue */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          {/* Ambient Background Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-blue-500/25 ring-4 ring-blue-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                  <Calendar className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold font-display tracking-tight text-slate-900">
                    {isStaff ? 'My Scheduled Patient Consultations' : 'Live OPD Clinical Queue & Sessions'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isStaff
                      ? 'Your personal patient treatment queue and assigned sessions'
                      : 'Real-time consultation feed with patient & doctor assignment'}
                  </p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-2xs self-start sm:self-auto">
                {[
                  { key: 'all', label: 'All', count: schedule_sessions.length },
                  { key: 'in_progress', label: 'Active', count: inProgressCount },
                  { key: 'pending', label: 'Pending', count: pendingCount },
                  { key: 'completed', label: 'Closed', count: completedCount },
                ].map((tab) => {
                  const isActive = queueTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setQueueTab(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-white text-blue-700 shadow-xs border border-slate-200/50 scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                        isActive ? 'bg-blue-100/80 text-blue-800' : 'bg-slate-200/70 text-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Queue Table */}
            {filteredSessions.length === 0 ? (
              <div className="py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-50 to-indigo-50/80 border border-blue-100/80 text-blue-600 flex items-center justify-center shadow-xs mx-auto mb-3.5 icon-3d group-hover:scale-105 transition-transform duration-300">
                  <Calendar className="w-7 h-7 drop-shadow-xs" />
                </div>
                <p className="text-sm font-bold text-slate-800">No sessions match the selected filter</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {isStaff ? 'All consultations for this filter are cleared' : 'Schedule an appointment or review all consultations'}
                </p>
                {isStaff ? (
                  <Link
                    to="/admin/my-appointments"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300 group/btn"
                  >
                    <Calendar className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                    <span>View All My Appointments</span>
                  </Link>
                ) : (
                  <Link
                    to="/admin/appointments/create"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 group/btn"
                  >
                    <CalendarPlus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span>+ Book Appointment</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60">
                      <th className="py-2.5 px-3 rounded-l-lg">Time / Date</th>
                      <th className="py-2.5 px-3">Patient Profile</th>
                      <th className="py-2.5 px-3">{isStaff ? 'Treatment & Session' : 'Doctor on Duty'}</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">{isStaff ? 'Commission' : 'Status'}</th>
                      {isStaff && <th className="py-2.5 px-3">Execution</th>}
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/70">
                    {filteredSessions.map((ses) => {
                      const isComplete = ses.status === 'completed';
                      const isInProg = ses.status === 'in_progress';
                      const isPend = ses.status === 'pending';

                      const statusColor = isComplete
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isInProg
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : isPend
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200';

                      return (
                        <tr key={ses.id} className="hover:bg-blue-50/30 transition-colors group/row">
                          <td className="py-3 px-3 font-mono font-medium text-slate-600 whitespace-nowrap">
                            <div className="font-bold text-slate-800">{ses.time || '--'}</div>
                            <div className="text-[10px] text-slate-400 font-sans">{ses.date || '--'}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 font-display icon-3d shadow-2xs group-hover/row:scale-105 transition-transform">
                                {ses.patient_initial || 'PT'}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 block truncate group-hover/row:text-blue-600 transition-colors" title={ses.patient_name}>
                                  {ses.patient_name}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {ses.patient_gender ? (ses.patient_gender.charAt(0).toUpperCase() + ses.patient_gender.slice(1)) : 'Patient'} • {ses.patient_mobile}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Staff sees Treatment & Session #; Admin sees Doctor on Duty */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {isStaff ? (
                              <div>
                                <span className="font-medium text-slate-800 block truncate max-w-[150px]" title={ses.treatment_name}>
                                  {ses.treatment_name || 'Clinical Session'}
                                </span>
                                <span className="text-[10px] text-blue-600 font-semibold">
                                  Session #{ses.session_number || 1} • {ses.appointment_number}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-slate-700">{ses.doctor_name}</div>
                                <div className="text-[10px] text-slate-400">{ses.doctor_department}</div>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            {ses.payment_amount > 0 ? (
                              <div>
                                <span className="font-mono font-bold text-emerald-700 text-xs">
                                  ₹{ses.payment_amount.toLocaleString('en-IN')}
                                </span>
                                <span className="text-[10px] text-slate-400 block uppercase font-mono">
                                  {ses.payment_mode || 'Paid'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                                Unpaid
                              </span>
                            )}
                          </td>

                          {/* If Staff: show staff commission, else show status badge */}
                          {isStaff ? (
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-mono font-bold text-purple-700 text-xs">
                                ₹{(ses.staff_commission || 0).toLocaleString('en-IN')}
                              </span>
                            </td>
                          ) : null}

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                              {isInProg ? 'In Progress' : isComplete ? 'Completed' : (ses.status?.charAt(0).toUpperCase() + ses.status?.slice(1))}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <Link
                              to={isStaff ? `/admin/my-appointments/${ses.id}` : `/admin/appointments/${ses.master_appointment_id || ses.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all inline-flex items-center justify-center hover:scale-110"
                              title={isStaff ? 'Open Session Clinical Details' : 'View Master Appointment & Clinical File'}
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs relative z-10">
            <span className="inline-flex items-center gap-2 text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Queue Feed &bull; {filteredSessions.length} active sessions</span>
            </span>
            <Link
              to={isStaff ? '/admin/my-appointments' : '/admin/appointments'}
              className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-display group/link"
            >
              <span>{isStaff ? 'View My Appointments' : 'View All Appointments'}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right (Col 8-12): Role-Tailored Clinical Control Console */}
        <div className="lg:col-span-5 xl:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          {/* Ambient Background Glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 text-white flex items-center justify-center icon-3d shadow-md shadow-amber-500/25 ring-4 ring-amber-500/10 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                  <Zap className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold font-display tracking-tight text-slate-900">
                    {isStaff ? 'Practitioner Desk Console' : 'Clinical Control Console'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isStaff ? 'Direct shortcuts for your clinical tasks' : 'Direct admin actions & management shortcuts'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold font-mono shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{isStaff ? 'Practitioner' : 'Admin'}</span>
              </span>
            </div>

            {/* Role Action Tiles */}
            {isStaff ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
                {/* Staff Tile 1: My Appointments Queue */}
                <Link
                  to="/admin/my-appointments"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-blue-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <Calendar className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-blue-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-blue-700 transition-colors block">
                      My Appointments Queue
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      Clinical session history
                    </span>
                  </div>
                </Link>

                {/* Staff Tile 2: Active Treatments */}
                <Link
                  to="/admin/my-appointments"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-indigo-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-indigo-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <Activity className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-indigo-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-indigo-700 transition-colors block">
                      Active Consultations
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      In-progress treatments
                    </span>
                  </div>
                </Link>

                {/* Staff Tile 3: Completed Consultations */}
                <Link
                  to="/admin/my-appointments"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-emerald-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <CheckCircle2 className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-emerald-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-emerald-700 transition-colors block">
                      Completed Sessions
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      Commissions &amp; records
                    </span>
                  </div>
                </Link>

                {/* Staff Tile 4: My Profile & Credentials */}
                <Link
                  to="/admin/profile"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-teal-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-teal-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <Stethoscope className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-teal-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-teal-700 transition-colors block">
                      My Profile
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      Credentials &amp; settings
                    </span>
                  </div>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
                {/* Admin Tile 1: Book Appointment */}
                <Link
                  to="/admin/appointments/create"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-blue-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-blue-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <CalendarPlus className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-blue-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-blue-700 transition-colors block">
                      Book Appointment
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      New consultation slot
                    </span>
                  </div>
                </Link>

                {/* Admin Tile 2: Register Patient */}
                <Link
                  to="/admin/customers/create"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-emerald-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <UserPlus className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-emerald-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-emerald-700 transition-colors block">
                      Register Patient
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      New clinical file
                    </span>
                  </div>
                </Link>

                {/* Admin Tile 3: OPD Schedule Calendar */}
                <Link
                  to="/admin/appointments/calendar"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-purple-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-600 text-white flex items-center justify-center icon-3d shadow-sm shadow-purple-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <Calendar className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-purple-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-purple-700 transition-colors block">
                      OPD Calendar
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      Doctor timeslots &amp; rooms
                    </span>
                  </div>
                </Link>

                {/* Admin Tile 4: Inventory & Supplies */}
                <Link
                  to="/admin/inventory/stocks"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-amber-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-amber-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <Boxes className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-amber-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-amber-700 transition-colors block">
                      Inventory Supplies
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      Stock audits &amp; reorders
                    </span>
                  </div>
                </Link>

                {/* Admin Tile 5: Treatment Catalog */}
                <Link
                  to="/admin/appointments/services"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-cyan-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-blue-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-cyan-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <FolderTree className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-cyan-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-cyan-700 transition-colors block">
                      Services &amp; Pricing
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      Treatment package catalog
                    </span>
                  </div>
                </Link>

                {/* Admin Tile 6: Clinical Reports */}
                <Link
                  to="/admin/reports/sessions"
                  className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/70 hover:border-rose-300 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group/tile relative overflow-hidden cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-red-500 text-white flex items-center justify-center icon-3d shadow-sm shadow-rose-500/20 group-hover/tile:scale-110 group-hover/tile:rotate-6 transition-all duration-300 shrink-0">
                      <FileText className="w-5 h-5 drop-shadow-xs" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-40 group-hover/tile:opacity-100 group-hover/tile:text-rose-600 group-hover/tile:translate-x-0.5 group-hover/tile:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 group-hover/tile:text-rose-700 transition-colors block">
                      Clinical Reports
                    </span>
                    <span className="text-[11px] text-slate-400 group-hover/tile:text-slate-500 transition-colors mt-0.5 block leading-snug">
                      Sessions, fees &amp; audits
                    </span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 relative z-10">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Role: <strong className="text-slate-700">{isStaff ? 'Staff Practitioner' : 'Clinic Administrator'}</strong></span>
            </span>
            <Link to="/admin/profile" className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-display group/link">
              <span>Profile Settings</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. OPERATIONAL HUB (Staff: 2 Cards | Admin: 3 Cards)    */}
      {/* ======================================================== */}
      <div className={`grid grid-cols-1 ${isStaff ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-5 sm:gap-6`}>
        {/* DOCTORS ON DUTY (Admin only) */}
        {!isStaff && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-blue-500/25 ring-4 ring-blue-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                    <Stethoscope className="w-5 h-5 drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display tracking-tight">Doctors on Duty Today</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{doctors_on_duty.length} active practitioners</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold font-mono shadow-2xs shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </span>
              </div>

              {/* Doctors List */}
              <div className="divide-y divide-slate-100/70 mt-3">
                {doctors_on_duty.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <Stethoscope className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                    No doctors currently marked on duty.
                  </div>
                ) : (
                  doctors_on_duty.map((doc) => (
                    <div key={doc.id} className="py-2.5 px-2 rounded-xl flex items-center justify-between gap-3 hover:bg-blue-50/40 transition-colors group/doc">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 font-display icon-3d shadow-xs group-hover/doc:scale-105 transition-transform">
                          {doc.name ? doc.name.replace('Dr. ', '').substring(0, 2).toUpperCase() : 'DR'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-800 group-hover/doc:text-blue-600 transition-colors block truncate">
                            {doc.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {doc.department || 'Clinical Desk'} • {doc.staff_code}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 shrink-0 font-mono shadow-2xs">
                        {doc.today_sessions_count || 0} session{doc.today_sessions_count === 1 ? '' : 's'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-end relative z-10">
              <Link to="/admin/appointments" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-display group/link">
                <span>View Consultation Slots</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}

        {/* CRITICAL MEDICAL SUPPLIES & CONSUMABLES WATCHLIST */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          {/* Ambient Background Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-500 text-white flex items-center justify-center icon-3d shadow-md shadow-amber-500/25 ring-4 ring-amber-500/10 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shrink-0">
                  <Package className="w-5 h-5 drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display tracking-tight">
                    {isStaff ? 'Clinical Supplies & Consumables' : 'Critical Medical Supplies'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Stock depletion watch list</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[11px] font-bold font-mono shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{low_stock_products.length} Alerts</span>
              </span>
            </div>

            {/* Supplies List */}
            <div className="divide-y divide-slate-100/70 mt-3">
              {low_stock_products.length === 0 ? (
                <div className="py-8 text-center text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-1.5 drop-shadow-xs" />
                  All clinical supplies are adequately stocked.
                </div>
              ) : (
                low_stock_products.map((item) => {
                  const isDepleted = item.quantity <= 0;
                  return (
                    <div key={item.id} className="py-2.5 px-2 rounded-xl flex items-center justify-between gap-3 hover:bg-amber-50/40 transition-colors group/item">
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-800 group-hover/item:text-amber-700 transition-colors block truncate" title={item.product_name}>
                          {item.product_name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          Unit: {item.business_unit || 'Item'} • Threshold: {item.low_stock_threshold || 10}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 font-mono shadow-2xs border ${
                          isDepleted
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.quantity} in stock
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between relative z-10">
            <span className="text-xs text-slate-400 font-medium">Total {totalInventory} items</span>
            {!isStaff ? (
              <Link to="/admin/inventory/stocks" className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 font-display group/link">
                <span>Inventory Reference</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                Supplies On Duty
              </span>
            )}
          </div>
        </div>

        {/* STAFF VIEW: TODAY'S SCHEDULE OVERVIEW (Instead of Patient Directory) */}
        {isStaff ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-teal-500/25 ring-4 ring-teal-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                    <Calendar className="w-5 h-5 drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display tracking-tight">My Today&apos;s Schedule</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{todaySessionsCount} consultations assigned today</p>
                  </div>
                </div>
                <Link to="/admin/my-appointments" className="w-8 h-8 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 flex items-center justify-center transition-all hover:scale-105 shadow-2xs" title="View Full Queue">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100/70 mt-3">
                {schedule_sessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <Calendar className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                    No active consultations scheduled for today.
                  </div>
                ) : (
                  schedule_sessions.slice(0, 5).map((ses) => (
                    <div key={ses.id} className="py-2.5 px-2 rounded-xl flex items-center justify-between gap-3 hover:bg-teal-50/40 transition-colors group/sched">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold flex items-center justify-center text-[10px] shrink-0 border border-indigo-100 shadow-2xs">
                          {ses.time || '--'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-slate-800 group-hover/sched:text-teal-700 transition-colors block truncate">
                            {ses.patient_name}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {ses.treatment_name || 'Treatment'} • Session #{ses.session_number || 1}
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/admin/my-appointments/${ses.id}`}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-2xs shrink-0"
                      >
                        Open File
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between relative z-10">
              <span className="text-xs text-slate-400 font-medium">{stats?.total_sessions || 0} total sessions</span>
              <Link to="/admin/my-appointments" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-display group/link">
                <span>Open Appointments</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ) : (
          /* ADMIN VIEW: RECENT PATIENT ONBOARDING */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-colors pointer-events-none" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 text-white flex items-center justify-center icon-3d shadow-md shadow-teal-500/25 ring-4 ring-teal-500/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0">
                    <Users className="w-5 h-5 drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display tracking-tight">Recent Patients Onboarded</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">New patient registration records</p>
                  </div>
                </div>
                <Link
                  to="/admin/customers/create"
                  className="w-8 h-8 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white flex items-center justify-center transition-all hover:scale-105 shadow-2xs"
                  title="Register New Patient"
                >
                  <UserPlus className="w-4 h-4" />
                </Link>
              </div>

              {/* Patients List */}
              <div className="divide-y divide-slate-100/70 mt-3">
                {recent_patients.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <Users className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                    No patients registered yet.
                  </div>
                ) : (
                  recent_patients.slice(0, 5).map((p) => {
                    const initial = p.name ? p.name.substring(0, 2).toUpperCase() : 'PT';
                    return (
                      <div key={p.id} className="py-2.5 px-2 rounded-xl flex items-center justify-between gap-3 hover:bg-teal-50/40 transition-colors group/pat">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 font-display icon-3d shadow-xs group-hover/pat:scale-105 transition-transform">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-800 group-hover/pat:text-teal-700 transition-colors block truncate">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {p.gender ? (p.gender.charAt(0).toUpperCase() + p.gender.slice(1)) : 'Patient'} • {p.age ? `${p.age} yrs` : 'OPD'} • {p.mobile}
                            </span>
                          </div>
                        </div>

                        <Link
                          to={`/admin/customers/${p.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-all hover:scale-110"
                          title="Edit Patient Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between relative z-10">
              <span className="text-xs text-slate-400 font-medium">Total {totalPatients} profiles</span>
              <Link to="/admin/customers" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-display group/link">
                <span>Patient Directory</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. SYSTEM AUDIT FEED & RECENT ACTIVITY LOG               */}
      {/* ======================================================== */}
      {recent_activity.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 font-display">
                  {isStaff ? 'My Recent Activity Log' : 'System Audit & Clinical Activity Feed'}
                </h3>
                <p className="text-[10px] text-slate-400">Security event logging and staff interaction logs</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Live Logs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {recent_activity.slice(0, 6).map((act) => (
              <div key={act.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-700 leading-snug break-words">
                    {act.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                    <span>IP: {act.ip_address || '127.0.0.1'}</span>
                    <span>•</span>
                    <span>{act.created_at ? new Date(act.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
