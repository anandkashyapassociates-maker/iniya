import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../features/auth/AdminAuthContext';
import LoadingState from '../components/LoadingState';

/**
 * Route Guard that strictly restricts access to Clinic Administrators.
 * If a Staff Practitioner attempts to type or navigate directly to an Admin-only URL,
 * they are blocked from opening the page and automatically redirected to their allowed portal.
 */
export default function AdminOnlyRoute() {
  const { user, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullPage message="Verifying administrative clearance..." />;
  }

  const isStaff =
    user?.role?.toLowerCase() === 'staff' ||
    user?.user_type?.toLowerCase() === 'staff' ||
    Boolean(user?.is_staff) ||
    user?.role === 'Staff Practitioner' ||
    Boolean(user?.staff_code);

  if (isStaff) {
    return <Navigate to="/admin/my-appointments" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

