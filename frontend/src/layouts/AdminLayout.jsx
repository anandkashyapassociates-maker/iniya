import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, ExternalLink } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ToastNotifications from '../components/ToastNotifications';
import { useAdminAuth } from '../features/auth/AdminAuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminLayout() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isImpersonated = Boolean(localStorage.getItem('admin_impersonated_by_superadmin'));

  const handleReturnToSuperAdmin = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_impersonated_by_superadmin');
    toast.info('Exited Admin Panel. Returned to Superadmin Administration Portal.');
    navigate('/superadmin/admin-management/details');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast notifications container */}
      <ToastNotifications />

      {/* Superadmin Impersonation Banner */}
      {isImpersonated && (
        <aside
          aria-label="Superadmin Impersonation Banner"
          className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sticky top-0 z-50 shadow-md border-b border-indigo-500/40"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <ShieldCheck className="w-4 h-4 text-blue-200 shrink-0" />
            <span className="font-normal text-slate-100">
              <strong className="font-semibold text-white">Superadmin Access Mode:</strong> You are operating as Admin{' '}
              <span className="underline decoration-blue-300 font-semibold text-white">{user?.name}</span> ({user?.email})
            </span>
          </div>

          <button
            type="button"
            onClick={handleReturnToSuperAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-medium text-xs transition-all cursor-pointer border border-white/20 shadow-xs self-start sm:self-auto shrink-0"
            title="Return to Superadmin Administration Portal"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Superadmin</span>
          </button>
        </aside>
      )}

      <div className="flex-1 flex">
        {/* Admin Navigation Sidebar */}
        <Sidebar
          role="admin"
          user={user}
          onLogout={logout}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Topbar
            role="admin"
            user={user}
            onLogout={logout}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

