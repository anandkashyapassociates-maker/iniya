import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import LoginForm from '../../components/LoginForm';
import { useAdminAuth } from '../../features/auth/AdminAuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdminLoginPage() {
  const { login, isAuthenticated, user, isLoading: isAdminLoading } = useAdminAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated as active Admin, redirect to Admin dashboard
  if (!isAdminLoading && isAuthenticated && user?.is_active) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    try {
      const res = await login(credentials);
      const isStaff = res?.user?.role === 'staff' || res?.user?.user_type === 'staff';
      const welcomeMsg = isStaff
        ? `Authenticated successfully. Welcome, ${res?.user?.name || 'Staff Member'}!`
        : 'Authenticated successfully. Welcome to the Admin Portal!';
      toast.success(welcomeMsg);
      navigate('/admin/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      role="admin"
      title="Admin & Staff Portal"
      subtitle="Sign in with your Admin or Staff credentials to access the clinic workspace."
    >
      <LoginForm
        role="admin"
        onSubmit={handleLogin}
        isLoading={isLoading}
        forgotPasswordPath="/admin/forgot-password"
      />
    </AuthLayout>
  );
}
