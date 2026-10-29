import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import AdminLayout from '../layouts/AdminLayout';

// Protected Route Guards
import SuperAdminProtectedRoute from './SuperAdminProtectedRoute';
import AdminProtectedRoute from './AdminProtectedRoute';

// Landing Page
import LandingPage from '../pages/LandingPage';

// Super Admin Pages
import SuperAdminLoginPage from '../pages/superadmin/SuperAdminLoginPage';
import SuperAdminForgotPasswordPage from '../pages/superadmin/SuperAdminForgotPasswordPage';
import SuperAdminResetPasswordPage from '../pages/superadmin/SuperAdminResetPasswordPage';
import SuperAdminDashboardPage from '../pages/superadmin/SuperAdminDashboardPage';
import SuperAdminAdminsListPage from '../pages/superadmin/SuperAdminAdminsListPage';
import SuperAdminCreateAdminPage from '../pages/superadmin/SuperAdminCreateAdminPage';
import SuperAdminEditAdminPage from '../pages/superadmin/SuperAdminEditAdminPage';
import SuperAdminProfilePage from '../pages/superadmin/SuperAdminProfilePage';

// Admin Pages
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminForgotPasswordPage from '../pages/admin/AdminForgotPasswordPage';
import AdminResetPasswordPage from '../pages/admin/AdminResetPasswordPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminProfilePage from '../pages/admin/AdminProfilePage';
import AdminChangePasswordPage from '../pages/admin/AdminChangePasswordPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root Portal Switcher */}
      <Route path="/" element={<LandingPage />} />

      {/* ======================================================== */}
      {/* Super Admin Public Routes                                 */}
      {/* ======================================================== */}
      <Route path="/superadmin" element={<SuperAdminLoginPage />} />
      <Route path="/superadmin/forgot-password" element={<SuperAdminForgotPasswordPage />} />
      <Route path="/superadmin/reset-password" element={<SuperAdminResetPasswordPage />} />

      {/* ======================================================== */}
      {/* Super Admin Protected Routes                            */}
      {/* ======================================================== */}
      <Route element={<SuperAdminProtectedRoute />}>
        <Route element={<SuperAdminLayout />}>
          <Route path="/superadmin/dashboard" element={<SuperAdminDashboardPage />} />
          <Route path="/superadmin/admins" element={<SuperAdminAdminsListPage />} />
          <Route path="/superadmin/admins/create" element={<SuperAdminCreateAdminPage />} />
          <Route path="/superadmin/admins/:id/edit" element={<SuperAdminEditAdminPage />} />
          <Route path="/superadmin/profile" element={<SuperAdminProfilePage />} />
        </Route>
      </Route>

      {/* ======================================================== */}
      {/* Admin Public Routes                                      */}
      {/* ======================================================== */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
      <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />

      {/* ======================================================== */}
      {/* Admin Protected Routes                                   */}
      {/* ======================================================== */}
      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/profile" element={<AdminProfilePage />} />
          <Route path="/admin/change-password" element={<AdminChangePasswordPage />} />
        </Route>
      </Route>

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

