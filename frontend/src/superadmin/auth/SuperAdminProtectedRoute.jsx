import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSuperAdminAuth } from './SuperAdminAuthContext';
import { Shield } from 'lucide-react';

export default function SuperAdminProtectedRoute() {
  const { isAuthenticated, isLoading } = useSuperAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg mb-4 animate-pulse">
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <span>Verifying Superadmin authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/superadmin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

