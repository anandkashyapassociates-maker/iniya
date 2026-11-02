import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../features/auth/AdminAuthContext';
import LoadingState from '../components/LoadingState';

/**
 * AdminGuestRoute
 * Restricts access to public/guest pages (/admin, /admin/login, forgot/reset password).
 * Only checks Admin authentication status, allowing separate and independent operation
 * from any active SuperAdmin panel session in the same browser.
 */
export default function AdminGuestRoute() {
  const { isAuthenticated: isAdminAuth, isLoading: isAdminLoading, user: adminUser } = useAdminAuth();

  if (isAdminLoading) {
    return <LoadingState fullPage message="Verifying session security clearance..." />;
  }

  // If already authenticated as active Admin, redirect to Admin dashboard
  if (isAdminAuth && adminUser?.is_active) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
