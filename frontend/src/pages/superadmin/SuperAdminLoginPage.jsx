import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../../layouts/AuthLayout';
import LoginForm from '../../components/LoginForm';
import { useSuperAdminAuth } from '../../features/auth/SuperAdminAuthContext';
import { useToast } from '../../context/ToastContext';

export default function SuperAdminLoginPage() {
  const { login } = useSuperAdminAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    try {
      await login(credentials);
      toast.success('Authenticated successfully. Welcome, Super Admin!');
      navigate('/superadmin/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      role="superadmin"
      title="Super Admin Portal"
      subtitle="Enter your high-privilege credentials and security challenge."
    >
      <LoginForm
        role="superadmin"
        onSubmit={handleLogin}
        isLoading={isLoading}
        forgotPasswordPath="/superadmin/forgot-password"
      />
    </AuthLayout>
  );
}

