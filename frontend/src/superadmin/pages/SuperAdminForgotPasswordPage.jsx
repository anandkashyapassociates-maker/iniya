import React, { useState } from 'react';
import SuperAdminAuthLayout from '../components/SuperAdminAuthLayout';
import SuperAdminForgotPasswordForm from '../components/SuperAdminForgotPasswordForm';
import superAdminAuthService from '../auth/superAdminAuthService';

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
    <SuperAdminAuthLayout
      title="Recover Superadmin Access"
      subtitle="Enter your verified administrator email address to request a secure password reset token."
    >
      <SuperAdminForgotPasswordForm
        onSubmit={handleForgotPassword}
        isLoading={isLoading}
        loginPath="/superadmin"
      />
    </SuperAdminAuthLayout>
  );
}

