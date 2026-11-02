import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSuperAdminAuth } from '../superadmin/auth/SuperAdminAuthContext';
import { useAdminAuth } from '../features/auth/AdminAuthContext';
import LoadingState from '../components/LoadingState';

/**
 * SuperAdminGuestRoute
 * Restricts access to public/guest pages (/superadmin, /superadmin/login, forgot/reset password).
 * If a SuperAdmin or Admin is already authenticated, redirects them directly to their active dashboard.
 */
export default function SuperAdminGuestRoute() {
  const { isAuthenticated: isSuperAdminAuth, isLoading: isSuperAdminLoading } = useSuperAdminAuth();
  const { isAuthenticated: isAdminAuth, isLoading: isAdminLoading, user: adminUser } = useAdminAuth();

  if (isSuperAdminLoading || isAdminLoading) {
    return <LoadingState fullPage message="Verifying executive security clearance..." />;
  }

  // If already authenticated as SuperAdmin, redirect to SuperAdmin dashboard
  if (isSuperAdminAuth) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  // If already authenticated as active Admin, redirect to Admin dashboard
  if (isAdminAuth && adminUser?.is_active) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

