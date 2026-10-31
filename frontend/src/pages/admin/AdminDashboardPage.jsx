import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Activity,
  User,
  KeyRound,
  Clock,
  CheckCircle2,
  Users,
  UserPlus,
  Calendar,
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import LoadingState from '../../components/LoadingState';
import adminService from '../../services/adminService';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';
import { ClinicDashboardBannerIllustration, ClinicHeartbeatLine } from '../../components/ClinicArtwork';

export default function AdminDashboardPage() {
  const { user } = useAdminAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await adminService.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load Admin dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading clinic administration desk..." />;
  }

  const { stats, account, recent_activity = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Clinic Welcome Banner with Clinical Artwork */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-blue-900/40 shadow-xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-20 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
              <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
              <span className="micro-label text-[10px] font-bold tracking-wider uppercase">Iniya Clinic &amp; OPD Management</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display">
              Welcome back, {user?.name || 'Doctor / Clinic Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal mt-1 leading-relaxed">
              Real-time patient registrations, active clinical queues, and administrative access controls.
            </p>

            {/* Heartbeat ECG Line beneath greeting */}
            <div className="mt-4 max-w-xs text-blue-400 opacity-80">
              <ClinicHeartbeatLine className="w-full h-6" />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Link
                to="/admin/appointments/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-950/40 transition-all cursor-pointer font-display"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-200" />
                <span>+ Book Appointment</span>
              </Link>
              <Link
                to="/admin/customers/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all cursor-pointer font-display"
              >
                <UserPlus className="w-3.5 h-3.5 text-teal-400" />
                <span>+ Register Patient</span>
              </Link>
              <Link
                to="/admin/appointments"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all cursor-pointer font-display"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Appointments Directory</span>
              </Link>
            </div>
          </div>

          {/* Right SVG Artwork */}
          <ClinicDashboardBannerIllustration />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/admin/customers" className="block group">
          <StatCard
            title="Total Registered Patients"
            value={stats?.total_customers ?? 0}
            subtitle="Official clinic profiles"
            icon={Users}
            colorScheme="blue"
          />
        </Link>
        <Link to="/admin/appointments" className="block group">
          <StatCard
            title="Master Appointments"
            value={stats?.total_appointments ?? 0}
            subtitle={`${stats?.today_appointments ?? 0} booked today`}
            icon={Calendar}
            colorScheme="indigo"
          />
        </Link>
        <Link to="/admin/appointments/calendar" className="block group">
          <StatCard
            title="Clinical Sessions"
            value={stats?.total_sessions ?? 0}
            subtitle={`${stats?.today_sessions ?? 0} scheduled today`}
            icon={Activity}
            colorScheme="violet"
          />
        </Link>
        <StatCard
          title="OPD Duty Status"
          value={stats?.account_status || 'Active'}
          subtitle="Clinical desk verified"
          icon={CheckCircle2}
          colorScheme="emerald"
        />
      </div>

      {/* Grid: Account Snapshot & Personal Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Details */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold font-display tracking-tight text-slate-800">Administrator Credentials</h2>
              </div>
              <span className="micro-label text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                Standard Admin
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Assigned Name</span>
                <span className="font-semibold font-display text-slate-800 tracking-tight">{account?.name || user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Authorized Email</span>
                <span className="font-mono text-slate-800">{account?.email || user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">OPD Clearance Role</span>
                <span className="font-semibold text-emerald-600 font-display">Active Practitioner</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Member Since</span>
                <span className="text-slate-700 font-mono text-[11px]">{account?.member_since || 'Active'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
            <span className="text-[11px] text-slate-400 font-normal">Update security &amp; password?</span>
            <Link
              to="/admin/change-password"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 font-display cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold font-display tracking-tight text-slate-800">Recent Security History</h2>
            </div>
            <span className="micro-label text-[10px] font-bold text-slate-400">Audit Log</span>
          </div>

          {recent_activity.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center font-normal">No recent activity logs.</p>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {recent_activity.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 font-mono text-[11px] uppercase tracking-wide">
                      {act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono tabular-numbers">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] font-normal leading-relaxed">{act.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
