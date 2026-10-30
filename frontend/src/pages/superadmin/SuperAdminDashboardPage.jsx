import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, UserX, UserPlus, Activity, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import StatCard from '../../components/StatCard';
import LoadingState from '../../components/LoadingState';
import superAdminService from '../../services/superAdminService';
import { useSuperAdminAuth } from '../../features/auth/SuperAdminAuthContext';

export default function SuperAdminDashboardPage() {
  const { user } = useSuperAdminAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await superAdminService.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading Super Admin analytics..." />;
  }

  const { stats, recent_admins = [], recent_activity = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-purple-900/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-3 border border-purple-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Executive System Oversight</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">
              Welcome, {user?.name || 'Super Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              High-security central administration console. Control administrator access, monitor system logs, and enforce organizational policy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/superadmin/admins/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/40 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Admin Accounts"
          value={stats?.total_admins ?? 0}
          subtitle="Provisioned administrative users"
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Active Administrators"
          value={stats?.active_admins ?? 0}
          subtitle="Currently authorized to access"
          icon={UserCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Deactivated Admins"
          value={stats?.inactive_admins ?? 0}
          subtitle="Access suspended or revoked"
          icon={UserX}
          colorScheme="rose"
        />
      </div>

      {/* Grid: Recently Created Admins & Recent Administrative Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Created Admins */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-900">Recently Provisioned Admins</h2>
            </div>
            <Link
              to="/superadmin/admins"
              className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
            >
              <span>View Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recent_admins.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No Admin accounts found.</p>
          ) : (
            <div className="space-y-3 flex-1">
              {recent_admins.map((adm) => (
                <div
                  key={adm.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {adm.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{adm.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{adm.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        adm.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {adm.is_active ? 'Active' : 'Suspended'}
                    </span>
                    <Link
                      to={`/superadmin/admins/${adm.id}/edit`}
                      className="text-xs text-slate-400 hover:text-slate-800 p-1.5"
                      title="Edit Admin"
                    >
                      &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Security & Activity Logs */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Audit & Security Log</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Real-time
            </span>
          </div>

          {recent_activity.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No recent security events recorded.</p>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1">
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
                  <p className="text-slate-600 leading-relaxed text-[11px]">{act.description}</p>
                  {act.ip_address && (
                    <div className="mt-1 text-[10px] text-slate-400 font-mono">
                      IP: {act.ip_address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

