import React, { useState } from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import ResetPasswordForm from '../../components/ResetPasswordForm';
import superAdminAuthService from '../../services/superAdminAuthService';

export default function SuperAdminResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (data) => {
    setIsLoading(true);
    try {
      return await superAdminAuthService.resetPassword(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      role="superadmin"
      title="Reset Password"
      subtitle="Establish new credentials for your Super Admin account."
    >
      <ResetPasswordForm
        role="superadmin"
        onSubmit={handleResetPassword}
        isLoading={isLoading}
        loginPath="/superadmin"
      />
    </AuthLayout>
  );
}

