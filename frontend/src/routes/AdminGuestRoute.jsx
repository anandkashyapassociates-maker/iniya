import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../features/auth/AdminAuthContext';
import { useSuperAdminAuth } from '../superadmin/auth/SuperAdminAuthContext';
import LoadingState from '../components/LoadingState';

/**
 * AdminGuestRoute
 * Restricts access to public/guest pages (/admin, /admin/login, forgot/reset password).
 * If an Admin or SuperAdmin is already authenticated, redirects them directly to their active dashboard.
 */
export default function AdminGuestRoute() {
  const { isAuthenticated: isAdminAuth, isLoading: isAdminLoading, user: adminUser } = useAdminAuth();
  const { isAuthenticated: isSuperAdminAuth, isLoading: isSuperAdminLoading } = useSuperAdminAuth();

  if (isAdminLoading || isSuperAdminLoading) {
    return <LoadingState fullPage message="Verifying session security clearance..." />;
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

