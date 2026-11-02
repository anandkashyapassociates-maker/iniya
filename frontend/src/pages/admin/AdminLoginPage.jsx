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
      await login(credentials);
      toast.success('Authenticated successfully. Welcome to the Admin Portal!');
      navigate('/admin/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      role="admin"
      title="Admin Portal"
      subtitle="Sign in with your administrative credentials and security verification."
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
