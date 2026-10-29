import React, { useState } from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import ForgotPasswordForm from '../../components/ForgotPasswordForm';
import superAdminAuthService from '../../services/superAdminAuthService';

export default function SuperAdminForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (data) => {
    setIsLoading(true);
    try {
      return await superAdminAuthService.forgotPassword(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      role="superadmin"
      title="Recover Access"
      subtitle="Super Administrator credential recovery verification."
    >
      <ForgotPasswordForm
        role="superadmin"
        onSubmit={handleForgotPassword}
        isLoading={isLoading}
        loginPath="/superadmin"
      />
    </AuthLayout>
  );
}

