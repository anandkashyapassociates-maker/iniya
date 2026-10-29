import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../features/auth/AdminAuthContext';
import LoadingState from '../components/LoadingState';

export default function AdminProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullPage message="Verifying Admin clearance..." />;
  }

  if (!isAuthenticated || !user?.is_active) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

