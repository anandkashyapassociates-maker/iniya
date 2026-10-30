import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminAuthLayout from '../components/SuperAdminAuthLayout';
import SuperAdminLoginForm from '../components/SuperAdminLoginForm';
import { useSuperAdminAuth } from '../auth/SuperAdminAuthContext';
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

