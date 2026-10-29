import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Activity, User, KeyRound, Clock, CheckCircle2, Shield } from 'lucide-react';
import StatCard from '../../components/StatCard';
import LoadingState from '../../components/LoadingState';
import adminService from '../../services/adminService';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';

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
    return <LoadingState message="Loading administrator dashboard..." />;
  }

  const { stats, account, recent_activity = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-blue-900/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-500/30">
              <Layers className="w-3.5 h-3.5" />
              <span>Operations Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Access your assigned features, view your recent security activity, and manage your account parameters.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/40 transition-all cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>Manage Profile</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Account Status"
          value={stats?.account_status || 'Active'}
          subtitle="System clearance status"
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatCard
          title="Security Actions"
          value={stats?.activity_count ?? 0}
          subtitle="Total logged security actions"
          icon={Activity}
          colorScheme="blue"
        />
        <StatCard
          title="Last Session"
          value={stats?.last_login || 'Active now'}
          subtitle="Most recent sign-in"
          icon={Clock}
          colorScheme="violet"
        />
      </div>

      {/* Grid: Account Snapshot & Personal Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Administrator Credentials</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Assigned Name</span>
                <span className="font-bold text-slate-800">{account?.name || user?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Authorized Email</span>
                <span className="font-mono text-slate-800">{account?.email || user?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">System Role</span>
                <span className="font-semibold text-blue-600">Standard Administrator</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Account Created</span>
                <span className="text-slate-700">{account?.member_since || 'Active'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Need to update credentials?</span>
            <Link
              to="/admin/change-password"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Security History</h2>
            </div>
            <span className="text-[11px] text-slate-400">Your Activity</span>
          </div>

          {recent_activity.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No recent activity logs.</p>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {recent_activity.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 font-mono text-[11px] uppercase tracking-wide">
                      {act.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{act.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

