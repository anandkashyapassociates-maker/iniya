import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import SuperAdminAuthLayout from '../components/SuperAdminAuthLayout';
import SuperAdminLoginForm from '../components/SuperAdminLoginForm';
import { useSuperAdminAuth } from '../auth/SuperAdminAuthContext';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminLoginPage() {
  const { login, isAuthenticated, isLoading: isSuperAdminLoading } = useSuperAdminAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated as SuperAdmin, redirect to SuperAdmin dashboard
  if (!isSuperAdminLoading && isAuthenticated) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    try {
      await login(credentials);
      toast.success('Authenticated successfully. Welcome, Super Administrator!');
      navigate('/superadmin/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperAdminAuthLayout
      title="Superadmin Sign In"
      subtitle="Enter your high-privilege credentials to access the executive ERP management console."
    >
      <SuperAdminLoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        forgotPasswordPath="/superadmin/forgot-password"
      />
    </SuperAdminAuthLayout>
  );
}
