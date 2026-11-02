import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSuperAdminAuth } from '../superadmin/auth/SuperAdminAuthContext';
import LoadingState from '../components/LoadingState';

/**
 * SuperAdminGuestRoute
 * Restricts access to public/guest pages (/superadmin, /superadmin/login, forgot/reset password).
 * Only checks SuperAdmin authentication status, allowing separate and independent operation
 * from any active Admin panel session in the same browser.
 */
export default function SuperAdminGuestRoute() {
  const { isAuthenticated: isSuperAdminAuth, isLoading: isSuperAdminLoading } = useSuperAdminAuth();

  if (isSuperAdminLoading) {
    return <LoadingState fullPage message="Verifying executive security clearance..." />;
  }

  // If already authenticated as SuperAdmin, redirect to SuperAdmin dashboard
  if (isSuperAdminAuth) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  return <Outlet />;
}
