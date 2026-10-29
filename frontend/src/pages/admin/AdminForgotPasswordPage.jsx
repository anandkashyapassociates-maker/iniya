import React, { useState } from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import ForgotPasswordForm from '../../components/ForgotPasswordForm';
import adminAuthService from '../../services/adminAuthService';

export default function AdminForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (data) => {
    setIsLoading(true);
    try {
      return await adminAuthService.forgotPassword(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      role="admin"
      title="Reset Admin Password"
      subtitle="Enter your verified administrative email address."
    >
      <ForgotPasswordForm
        role="admin"
        onSubmit={handleForgotPassword}
        isLoading={isLoading}
        loginPath="/admin"
      />
    </AuthLayout>
  );
}

