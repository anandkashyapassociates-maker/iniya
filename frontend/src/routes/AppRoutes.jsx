import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Super Admin Module (Dedicated, Isolated Architecture)
import SuperAdminLayout from '../superadmin/layouts/SuperAdminLayout';
import SuperAdminProtectedRoute from '../superadmin/auth/SuperAdminProtectedRoute';
import SuperAdminLoginPage from '../superadmin/pages/SuperAdminLoginPage';
import SuperAdminForgotPasswordPage from '../superadmin/pages/SuperAdminForgotPasswordPage';
import SuperAdminResetPasswordPage from '../superadmin/pages/SuperAdminResetPasswordPage';
import SuperAdminDashboardPage from '../superadmin/pages/SuperAdminDashboardPage';
import SuperAdminAdminsListPage from '../pages/superadmin/SuperAdminAdminsListPage';
import SuperAdminCreateAdminPage from '../pages/superadmin/SuperAdminCreateAdminPage';
import SuperAdminEditAdminPage from '../pages/superadmin/SuperAdminEditAdminPage';
import SuperAdminProfilePage from '../pages/superadmin/SuperAdminProfilePage';

// Admin Module (Panel 2 - Separate Team Developer)
import AdminLayout from '../layouts/AdminLayout';
import AdminProtectedRoute from './AdminProtectedRoute';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminForgotPasswordPage from '../pages/admin/AdminForgotPasswordPage';
import AdminResetPasswordPage from '../pages/admin/AdminResetPasswordPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminProfilePage from '../pages/admin/AdminProfilePage';
import AdminChangePasswordPage from '../pages/admin/AdminChangePasswordPage';

// Portal Root
import LandingPage from '../pages/LandingPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root Portal Switcher */}
      <Route path="/" element={<LandingPage />} />

      {/* ======================================================== */}
      {/* 1. Super Admin Public Routes (Dedicated Auth)             */}
      {/* ======================================================== */}
      <Route path="/superadmin" element={<SuperAdminLoginPage />} />
      <Route path="/superadmin/forgot-password" element={<SuperAdminForgotPasswordPage />} />
      <Route path="/superadmin/reset-password" element={<SuperAdminResetPasswordPage />} />

      {/* ======================================================== */}
      {/* 2. Super Admin Protected Routes                          */}
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
      {/* 3. Admin Public Routes (Panel 2 - Isolated)              */}
      {/* ======================================================== */}
      <Route path="/admin" element={<AdminLoginPage />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
      <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />

      {/* ======================================================== */}
      {/* 4. Admin Protected Routes (Panel 2 - Isolated)           */}
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
