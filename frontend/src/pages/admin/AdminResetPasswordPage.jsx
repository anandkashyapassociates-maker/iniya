import React, { useState } from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import ResetPasswordForm from '../../components/ResetPasswordForm';
import adminAuthService from '../../services/adminAuthService';

export default function AdminResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (data) => {
    setIsLoading(true);
    try {
      return await adminAuthService.resetPassword(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      role="admin"
      title="Create New Password"
      subtitle="Establish new credentials for your Admin account."
    >
      <ResetPasswordForm
        role="admin"
        onSubmit={handleResetPassword}
        isLoading={isLoading}
        loginPath="/admin"
      />
    </AuthLayout>
  );
}

