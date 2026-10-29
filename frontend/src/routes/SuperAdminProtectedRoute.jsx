import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSuperAdminAuth } from '../features/auth/SuperAdminAuthContext';
import LoadingState from '../components/LoadingState';

export default function SuperAdminProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useSuperAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullPage message="Verifying Super Admin clearance..." />;
  }

  if (!isAuthenticated || !user?.is_active) {
    return <Navigate to="/superadmin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

