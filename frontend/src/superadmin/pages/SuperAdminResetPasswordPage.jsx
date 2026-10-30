import React, { useState } from 'react';
import SuperAdminAuthLayout from '../components/SuperAdminAuthLayout';
import SuperAdminResetPasswordForm from '../components/SuperAdminResetPasswordForm';
import superAdminAuthService from '../auth/superAdminAuthService';

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
    <SuperAdminAuthLayout
      title="Set New Superadmin Password"
      subtitle="Establish new cryptographic credentials for your executive account."
    >
      <SuperAdminResetPasswordForm
        onSubmit={handleResetPassword}
        isLoading={isLoading}
        loginPath="/superadmin"
      />
    </SuperAdminAuthLayout>
  );
}

