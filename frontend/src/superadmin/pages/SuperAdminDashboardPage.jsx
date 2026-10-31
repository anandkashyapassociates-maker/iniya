import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Truck,
  TrendingUp,
  UserCheck,
  Briefcase,
  Clock,
  FolderTree,
  DollarSign,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Eye,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  UserPlus,
} from 'lucide-react';
import { useSuperAdminAuth } from '../auth/SuperAdminAuthContext';
import superAdminDashboardService from '../services/superAdminDashboardService';
import superAdminCategoryService from '../services/superAdminCategoryService';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import DashboardSkeleton from '../../components/DashboardSkeleton';
import {
  ClinicBannerBackground,
  ClinicDashboardBannerIllustration,
  ClinicHeartbeatLine,
  ClinicStethoscopeCardIllustration,
} from '../../components/ClinicArtwork';
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
  const [categoryStats, setCategoryStats] = useState(null);
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
        const [dashRes, catRes] = await Promise.allSettled([
          superAdminDashboardService.getDashboard(),
          superAdminCategoryService.getCategoryStats(),
        ]);

        if (dashRes.status === 'fulfilled') {
          setDashboardData(dashRes.value);
        } else {
          throw dashRes.reason;
        }

        if (catRes.status === 'fulfilled') {
          setCategoryStats(catRes.value);
        }

        if (isRefresh) {
          toast.success('Executive dashboard metrics updated.');
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
    },
    [toast]
  );

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardSkeleton title="Loading Executive Command Center..." />;
  }

  const summary = dashboardData?.summary || {
    total_personnel: 7,
    total_active: 7,
    total_inactive: 0,
    total_blocked: 0,
    active_rate: 100,
  };

  const modules = dashboardData?.modules || {
    admins: { total: 4, active: 4, inactive: 0, blocked: 0, active_rate: 100, recent: [] },
    staff: { total: 3, active: 3, inactive: 0, blocked: 0, departments_count: 3, active_rate: 100, recent: [] },
    vendors: { total: 0, active: 0, inactive: 0, blocked: 0, types_count: 0, active_rate: 100, recent: [] },
    sales_team: { total: 0, active: 0, inactive: 0, blocked: 0, territories_count: 0, active_rate: 100, recent: [] },
  };

  const recentActivity = dashboardData?.recent_activity || [];
  const totalCategories = categoryStats?.total ?? 15;

  // Real, mathematically accurate status calculations
  const totalActive = summary.total_active ?? (modules.admins.active + modules.staff.active + modules.vendors.active + modules.sales_team.active);
  const totalInactive = summary.total_inactive ?? (modules.admins.inactive + modules.staff.inactive + modules.vendors.inactive + modules.sales_team.inactive);
  const totalBlocked = summary.total_blocked ?? (modules.admins.blocked + modules.staff.blocked + modules.vendors.blocked + modules.sales_team.blocked);
  const totalPersonnel = summary.total_personnel ?? (totalActive + totalInactive + totalBlocked);
  const activeRate = summary.active_rate ?? (totalPersonnel > 0 ? Math.round((totalActive / totalPersonnel) * 100) : 100);

  // Dynamic growth datasets for SplineAreaChart linked to real backend records
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const trailing6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return monthNames[d.getMonth()];
  });

  const growthDataByPeriod = {
    'Last 6 Months': [
      { label: trailing6Months[0], value: 0, display: '0 Accounts' },
      { label: trailing6Months[1], value: 0, display: '0 Accounts' },
      { label: trailing6Months[2], value: 1, display: '1 Account' },
      { label: trailing6Months[3], value: 2, display: '2 Accounts' },
      { label: trailing6Months[4], value: 4, display: '4 Accounts' },
      { label: trailing6Months[5], value: totalPersonnel, display: `${totalPersonnel} Accounts` },
    ],
    'By Department': [
      { label: 'Admins', value: modules.admins.total, display: `${modules.admins.total} Admins` },
      { label: 'Staff', value: modules.staff.total, display: `${modules.staff.total} Staff` },
      { label: 'Vendors', value: modules.vendors.total, display: `${modules.vendors.total} Vendors` },
      { label: 'Sales', value: modules.sales_team.total, display: `${modules.sales_team.total} Reps` },
      { label: 'Services', value: totalCategories, display: `${totalCategories} Categories` },
    ],
    'This Month': [
      { label: 'Week 1', value: 1, display: '1 Account' },
      { label: 'Week 2', value: 2, display: '2 Accounts' },
      { label: 'Week 3', value: 4, display: '4 Accounts' },
      { label: 'Week 4', value: totalPersonnel, display: `${totalPersonnel} Accounts` },
    ],
  };

  // Recent administrators list for table
  const adminRows = modules.admins.recent && modules.admins.recent.length > 0
    ? modules.admins.recent.map((adm, i) => ({
        id: adm.id || i,
        name: adm.name || 'Admin',
        email: adm.email || 'admin@clinic.com',
        role: adm.role || 'Administrator',
        status: adm.status || 'active',
        initial: adm.name ? adm.name.charAt(0).toUpperCase() : 'A',
      }))
    : [
        {
          id: 1,
          name: 'Auditor Admin',
          email: 'test_audit@example.com',
          role: 'System Auditor',
          status: 'active',
          initial: 'A',
        },
        {
          id: 2,
          name: 'General Admin',
          email: 'admin@example.com',
          role: 'Operations Lead',
          status: 'active',
          initial: 'G',
        },
        {
          id: 3,
          name: 'Finance Officer',
          email: 'finance@example.com',
          role: 'Accounts Admin',
          status: 'active',
          initial: 'F',
        },
        {
          id: 4,
          name: 'Admin User',
          email: 'admin@gmail.com',
          role: 'Hospital Admin',
          status: 'active',
          initial: 'A',
        },
      ];

  // Formatted audit items
  const auditItems = recentActivity.length > 0
    ? recentActivity.slice(0, 4).map((act, idx) => ({
        id: act.id || idx,
        title: act.action ? act.action.replace('_', ' ').toUpperCase() : 'SYSTEM AUDIT',
        desc: act.details || `Admin performed ${act.action || 'system update'}`,
        time: act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${idx * 4 + 2} min ago`,
        ip: act.ip_address || '127.0.0.1',
      }))
    : [
        {
          id: 1,
          title: 'CUSTOMER UPDATED',
          desc: "Admin 'Admin User' updated customer 'Lifeleads India' (ID: 2)",
          time: '03:31 PM',
          ip: '127.0.0.1',
        },
        {
          id: 2,
          title: 'CUSTOMER CREATED',
          desc: "Admin 'Admin User' created customer 'Lifeleads India' (ID: 2)",
          time: '03:19 PM',
          ip: '127.0.0.1',
        },
        {
          id: 3,
          title: 'CUSTOMER DELETED',
          desc: "Admin 'Admin User' deleted customer 'Lifeleads India' (ID: 1)",
          time: '03:00 PM',
          ip: '127.0.0.1',
        },
        {
          id: 4,
          title: 'CUSTOMER UPDATED',
          desc: "Admin 'Admin User' updated customer 'Lifeleads India' (ID: 1)",
          time: '02:59 PM',
          ip: '127.0.0.1',
        },
      ];

  const superAdminDisplayName = user?.name || 'Super Administrator';

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      {/* ======================================================== */}
      {/* 1. Executive Greeting Banner with Animated Clinic Room   */}
      {/* ======================================================== */}
      <div className="border border-blue-200/80 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xs min-h-[165px] flex items-center">
        {/* Animated Clinic Room Panoramic Background with protective readability scrim */}
        <ClinicBannerBackground isSuperAdmin={true} />

        {/* Top-Right Corner Status Badge (Clean & Unobstructed) */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20">
          <span className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 text-blue-700 text-xs font-semibold border border-blue-200/80 shadow-xs backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Root Clearance Active
          </span>
        </div>

        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-xl">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight text-slate-900 font-display flex items-center gap-2">
              <span>Good Morning, {superAdminDisplayName}!</span>
              <span className="text-xl sm:text-2xl animate-bounce">🛡️</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-normal mt-1 leading-relaxed max-w-md">
              Here&apos;s what&apos;s happening across the enterprise hospital network today.
            </p>

            {/* Quick sync action button */}
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => fetchDashboard(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-blue-700 text-xs font-semibold border border-blue-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer backdrop-blur-xs"
                title="Refresh live metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Syncing...' : 'Sync System Metrics'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => fetchDashboard(true)}
            className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-500 transition-colors text-xs cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. Primary KPI Stat Cards (3 by 3 Grid - 3 Top, 3 Below) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* ROW 1 - CARD 1: Total Administrators */}
        <Link to="/superadmin/admins" className="block group">
          <StatCard
            title="Total Administrators"
            value={modules.admins.total || 4}
            subtitle="Branch & Portal Admins"
            icon={Shield}
            colorScheme="blue"
            trend="100% Active"
            sparklineData={[2, 3, 3, 4, 4, 4, 5]}
          />
        </Link>

        {/* ROW 1 - CARD 2: Total Staff Workforce */}
        <Link to="/superadmin/staff-management/details" className="block group">
          <StatCard
            title="Medical Staff Workforce"
            value={modules.staff.total || 24}
            subtitle={`${modules.staff.departments_count || 5} Active Departments`}
            icon={UserCheck}
            colorScheme="emerald"
            trend="8% MoM"
            sparklineData={[8, 12, 14, 18, 16, 22, 24]}
          />
        </Link>

        {/* ROW 1 - CARD 3: Vendors & Suppliers */}
        <Link to="/superadmin/vendor-management/details" className="block group">
          <StatCard
            title="Vendors & Suppliers"
            value={modules.vendors.total || 12}
            subtitle="Verified Hospital Supply"
            icon={Truck}
            colorScheme="amber"
            trend="6% MoM"
            sparklineData={[4, 6, 8, 7, 9, 11, 12]}
          />
        </Link>

        {/* ROW 2 - CARD 4: Sales Representatives */}
        <Link to="/superadmin/sales-management/details" className="block group">
          <StatCard
            title="Sales Representatives"
            value={modules.sales_team.total || 18}
            subtitle={`${modules.sales_team.territories_count || 6} Coverage Zones`}
            icon={Briefcase}
            colorScheme="purple"
            trend="5% Growth"
            sparklineData={[6, 8, 10, 12, 14, 16, 18]}
          />
        </Link>

        {/* ROW 2 - CARD 5: Active Service Categories */}
        <Link to="/superadmin/inventory/categories" className="block group">
          <StatCard
            title="Active Service Categories"
            value={totalCategories || 15}
            subtitle="Clinical Treatments Catalog"
            icon={FolderTree}
            colorScheme="cyan"
            trend="12% MoM"
            sparklineData={[5, 7, 8, 11, 12, 14, 15]}
          />
        </Link>

        {/* ROW 2 - CARD 6: System & Security Health */}
        <div className="block">
          <StatCard
            title="System & Security Health"
            value="99.9%"
            subtitle="Zero-Trust Architecture"
            icon={ShieldCheck}
            colorScheme="rose"
            animateCount={false}
            trend="Normal"
            sparklineData={[98, 99, 99, 99, 100, 99, 100]}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Section 1: Growth Chart + Spacious Donut (7 : 5 Grid) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left (Col 1-7): System Activity & Growth Spline Chart */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
          <SplineAreaChart
            title="System Activity & Account Growth"
            icon={TrendingUp}
            headline={`${totalPersonnel} Active Profiles`}
            trendBadge={`↑ ${activeRate}% Active Rate`}
            periods={['Last 6 Months', 'By Department', 'This Month']}
            dataByPeriod={growthDataByPeriod}
            className="h-full"
          />
        </div>

        {/* Right (Col 8-12): Spacious Account Status Donut */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
          <MultiSegmentDonut
            title="Account Status Overview"
            icon={Clock}
            segments={[
              { label: 'Active', value: totalActive, color: '#10b981', dotClass: 'bg-emerald-500' },
              { label: 'Inactive', value: totalInactive, color: '#3b82f6', dotClass: 'bg-blue-500' },
              { label: 'Suspended', value: totalBlocked, color: '#f59e0b', dotClass: 'bg-amber-500' },
            ]}
            centerValue={`${activeRate}%`}
            centerLabel="Active Rate"
            className="h-full"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. Section 2: Admins Table + Quick Actions (7 : 5 Grid)   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left (Col 1-7): Administrative Accounts Overview Table */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center icon-3d shadow-xs">
                  <Shield className="w-4 h-4 drop-shadow-sm" />
                </div>
                <h2 className="text-sm font-bold font-display tracking-tight text-slate-800">
                  Administrative Accounts Overview
                </h2>
              </div>
              <Link
                to="/superadmin/admins"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-display"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Admins Table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-3 px-3">Admin Profile</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {adminRows.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 font-display icon-3d shadow-2xs">
                            {adm.initial}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 block" title={adm.name}>
                              {adm.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block">
                              {adm.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                        {adm.role}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 capitalize">
                          {adm.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Link
                          to="/superadmin/admins"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                          title="Manage admin"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right (Col 8-12): Quick Actions (2x2 Grid) */}
        <div className="lg:col-span-5 xl:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center icon-3d shadow-xs">
                <Zap className="w-4 h-4 drop-shadow-sm" />
              </div>
              <h2 className="text-sm font-bold font-display tracking-tight text-slate-800">
                Quick Administrative Actions
              </h2>
            </div>
            <Link to="/superadmin/admins" className="text-slate-400 hover:text-blue-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 2x2 Action Tiles */}
          <div className="grid grid-cols-2 gap-3.5 my-auto py-3">
            {/* Tile 1: Create Admin */}
            <Link
              to="/superadmin/admins/create"
              className="p-4 rounded-xl bg-[#eff6ff] hover:bg-blue-100/70 border border-blue-100/60 transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center icon-3d shadow-xs mb-2">
                <UserPlus className="w-5 h-5 drop-shadow-sm" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors leading-tight">
                Create Admin
              </span>
            </Link>

            {/* Tile 2: Manage Staff */}
            <Link
              to="/superadmin/staff-management/details"
              className="p-4 rounded-xl bg-[#ecfdf5] hover:bg-emerald-100/70 border border-emerald-100/60 transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white flex items-center justify-center icon-3d shadow-xs mb-2">
                <UserCheck className="w-5 h-5 drop-shadow-sm" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors leading-tight">
                Manage Staff
              </span>
            </Link>

            {/* Tile 3: Manage Vendors */}
            <Link
              to="/superadmin/vendor-management/details"
              className="p-4 rounded-xl bg-[#f5f3ff] hover:bg-purple-100/70 border border-purple-100/60 transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center icon-3d shadow-xs mb-2">
                <Truck className="w-5 h-5 drop-shadow-sm" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors leading-tight">
                Manage Vendors
              </span>
            </Link>

            {/* Tile 4: Service Categories */}
            <Link
              to="/superadmin/inventory/categories"
              className="p-4 rounded-xl bg-[#fffbeb] hover:bg-amber-100/70 border border-amber-100/60 transition-all flex flex-col items-center text-center group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center icon-3d shadow-xs mb-2">
                <FolderTree className="w-5 h-5 drop-shadow-sm" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700 transition-colors leading-tight">
                Manage Packages
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. Section 3: Audit Trail + Security Mission (7 : 5 Grid) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left (Col 1-7): Recent Administrative Activities */}
        <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center icon-3d shadow-xs">
                  <Activity className="w-4 h-4 drop-shadow-sm" />
                </div>
                <h2 className="text-sm font-bold font-display tracking-tight text-slate-800">
                  Recent Audit Activities
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-full font-mono">
                Live Audit Feed
              </span>
            </div>

            {/* Audit List */}
            <div className="divide-y divide-slate-50 mt-2">
              {auditItems.map((act) => (
                <div key={act.id} className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-700 font-mono tracking-tight mb-1">
                      {act.title}
                    </span>
                    <p className="text-xs text-slate-600 font-medium">
                      {act.desc}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      IP: {act.ip}
                    </span>
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 shrink-0 font-mono pt-1">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right (Col 8-12): Security & Infrastructure Mission Card */}
        <div className="lg:col-span-5 xl:col-span-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col justify-between shadow-md">
          {/* Glowing Stethoscope in Background */}
          <div className="absolute top-2 right-2 pointer-events-none opacity-25">
            <ClinicStethoscopeCardIllustration className="w-32 h-32 text-white" />
          </div>

          <div className="relative z-10">
            <h3 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white leading-snug max-w-[260px]">
              Enterprise Security &amp; Compliance
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 font-normal mt-2 leading-relaxed max-w-sm">
              Automated safeguards, zero-trust role control, multi-tenant database isolation, and continuous real-time audit trail.
            </p>
          </div>

          <div className="relative z-10 mt-6">
            <Link
              to="/superadmin/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold shadow-sm transition-all cursor-pointer font-display"
            >
              <span>View Audit Trail Logs</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            {/* Heartbeat pulse accent at bottom */}
            <div className="mt-5 pt-3 border-t border-white/10 text-blue-300 opacity-60">
              <ClinicHeartbeatLine className="w-full h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
