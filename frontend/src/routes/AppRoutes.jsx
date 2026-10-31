import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Super Admin Module (Dedicated, Isolated Architecture)
import SuperAdminLayout from '../superadmin/layouts/SuperAdminLayout';
import SuperAdminProtectedRoute from '../superadmin/auth/SuperAdminProtectedRoute';
import SuperAdminLoginPage from '../superadmin/pages/SuperAdminLoginPage';
import SuperAdminForgotPasswordPage from '../superadmin/pages/SuperAdminForgotPasswordPage';
import SuperAdminResetPasswordPage from '../superadmin/pages/SuperAdminResetPasswordPage';
import SuperAdminDashboardPage from '../superadmin/pages/SuperAdminDashboardPage';
import AdminCreationPage from '../superadmin/admin-management/AdminCreationPage';
import AdminDetailsPage from '../superadmin/admin-management/AdminDetailsPage';
import StaffCreationPage from '../superadmin/staff-management/StaffCreationPage';
import StaffDetailsPage from '../superadmin/staff-management/StaffDetailsPage';
import VendorCreationPage from '../superadmin/vendor-management/VendorCreationPage';
import VendorDetailsPage from '../superadmin/vendor-management/VendorDetailsPage';
import SalesMemberCreationPage from '../superadmin/sales-management/SalesMemberCreationPage';
import SalesMemberDetailsPage from '../superadmin/sales-management/SalesMemberDetailsPage';
import SuperAdminEditAdminPage from '../pages/superadmin/SuperAdminEditAdminPage';
import SuperAdminProfilePage from '../pages/superadmin/SuperAdminProfilePage';
import SuperAdminCategoriesPage from '../superadmin/categories/SuperAdminCategoriesPage';

// Super Admin Inventory Module
import SuperAdminInventoryOverviewPage from '../superadmin/inventory/SuperAdminInventoryOverviewPage';
import SuperAdminProductsPage from '../superadmin/inventory/SuperAdminProductsPage';
import SuperAdminInventoryCategoriesPage from '../superadmin/inventory/SuperAdminInventoryCategoriesPage';
import SuperAdminInventoryBrandsPage from '../superadmin/inventory/SuperAdminInventoryBrandsPage';

// Admin Module (Panel 2 - Separate Team Developer)
import AdminLayout from '../layouts/AdminLayout';
import AdminProtectedRoute from './AdminProtectedRoute';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminForgotPasswordPage from '../pages/admin/AdminForgotPasswordPage';
import AdminResetPasswordPage from '../pages/admin/AdminResetPasswordPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminCustomersPage from '../pages/admin/AdminCustomersPage';
import AdminCustomerCreatePage from '../pages/admin/AdminCustomerCreatePage';
import AdminCustomerEditPage from '../pages/admin/AdminCustomerEditPage';
import AdminProfilePage from '../pages/admin/AdminProfilePage';
import AdminChangePasswordPage from '../pages/admin/AdminChangePasswordPage';
import AdminAppointmentsPage from '../pages/admin/AdminAppointmentsPage';
import AdminAppointmentCreatePage from '../pages/admin/AdminAppointmentCreatePage';
import AdminAppointmentEditPage from '../pages/admin/AdminAppointmentEditPage';

// Admin Inventory Management Module
import AdminProductsPage from '../pages/admin/inventory/AdminProductsPage';
import AdminProductCreatePage from '../pages/admin/inventory/AdminProductCreatePage';
import AdminProductEditPage from '../pages/admin/inventory/AdminProductEditPage';
import AdminInventoryCategoryListPage from '../pages/admin/inventory/AdminCategoryListPage';
import AdminInventoryCategoryCreatePage from '../pages/admin/inventory/AdminCategoryCreatePage';
import AdminInventoryCategoryEditPage from '../pages/admin/inventory/AdminCategoryEditPage';
import AdminBrandsPage from '../pages/admin/inventory/AdminBrandsPage';
import AdminBrandCreatePage from '../pages/admin/inventory/AdminBrandCreatePage';
import AdminBrandEditPage from '../pages/admin/inventory/AdminBrandEditPage';

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
          
          {/* Phase 2: Admin Management Submodule Routes */}
          <Route path="/superadmin/admin-management/create" element={<AdminCreationPage />} />
          <Route path="/superadmin/admin-management/details" element={<AdminDetailsPage />} />
          
          {/* Phase 3: Staff Management Submodule Routes */}
          <Route path="/superadmin/staff-management/create" element={<StaffCreationPage />} />
          <Route path="/superadmin/staff-management/details" element={<StaffDetailsPage />} />

          {/* Phase 4: Vendor Management Submodule Routes */}
          <Route path="/superadmin/vendors" element={<VendorDetailsPage />} />
          <Route path="/superadmin/vendors/create" element={<VendorCreationPage />} />
          <Route path="/superadmin/vendor-management" element={<Navigate to="/superadmin/vendors" replace />} />
          <Route path="/superadmin/vendor-management/details" element={<Navigate to="/superadmin/vendors" replace />} />
          <Route path="/superadmin/vendor-management/create" element={<Navigate to="/superadmin/vendors/create" replace />} />

          {/* Phase 5: Sales Team Management Submodule Routes */}
          <Route path="/superadmin/sales-members" element={<SalesMemberDetailsPage />} />
          <Route path="/superadmin/sales-members/create" element={<SalesMemberCreationPage />} />
          <Route path="/superadmin/sales-team" element={<Navigate to="/superadmin/sales-members" replace />} />
          <Route path="/superadmin/sales-team/create" element={<Navigate to="/superadmin/sales-members/create" replace />} />
          
          {/* Backward Compatibility Aliases */}
          <Route path="/superadmin/admins" element={<Navigate to="/superadmin/admin-management/details" replace />} />
          <Route path="/superadmin/admins/create" element={<Navigate to="/superadmin/admin-management/create" replace />} />
          <Route path="/superadmin/admins/:id/edit" element={<SuperAdminEditAdminPage />} />
          <Route path="/superadmin/staff" element={<Navigate to="/superadmin/staff-management/details" replace />} />
          <Route path="/superadmin/staff/create" element={<Navigate to="/superadmin/staff-management/create" replace />} />
          
          {/* Executive Category Oversight */}
          <Route path="/superadmin/categories" element={<Navigate to="/superadmin/inventory/categories" replace />} />

          {/* Super Admin Inventory Management Module */}
          <Route path="/superadmin/inventory" element={<Navigate to="/superadmin/inventory/overview" replace />} />
          <Route path="/superadmin/inventory/overview" element={<SuperAdminInventoryOverviewPage />} />
          <Route path="/superadmin/inventory/products" element={<SuperAdminProductsPage />} />
          <Route path="/superadmin/inventory/categories" element={<SuperAdminInventoryCategoriesPage />} />
          <Route path="/superadmin/inventory/brands" element={<SuperAdminInventoryBrandsPage />} />

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
          <Route path="/admin/appointments" element={<AdminAppointmentsPage />} />
          <Route path="/admin/appointments/create" element={<AdminAppointmentCreatePage />} />
          <Route path="/admin/appointments/:id/edit" element={<AdminAppointmentEditPage />} />
          <Route path="/admin/customers" element={<AdminCustomersPage />} />
          <Route path="/admin/customers/create" element={<AdminCustomerCreatePage />} />
          <Route path="/admin/customers/:id/edit" element={<AdminCustomerEditPage />} />
          <Route path="/admin/categories" element={<Navigate to="/admin/inventory/categories" replace />} />

          {/* Admin Inventory Management Module */}
          <Route path="/admin/inventory" element={<Navigate to="/admin/inventory/products/create" replace />} />
          <Route path="/admin/inventory/products" element={<AdminProductsPage />} />
          <Route path="/admin/inventory/products/create" element={<AdminProductCreatePage />} />
          <Route path="/admin/inventory/products/:id/edit" element={<AdminProductEditPage />} />
          <Route path="/admin/inventory/categories" element={<AdminInventoryCategoryListPage />} />
          <Route path="/admin/inventory/categories/create" element={<AdminInventoryCategoryCreatePage />} />
          <Route path="/admin/inventory/categories/:id/edit" element={<AdminInventoryCategoryEditPage />} />
          <Route path="/admin/inventory/brands" element={<AdminBrandsPage />} />
          <Route path="/admin/inventory/brands/create" element={<AdminBrandCreatePage />} />
          <Route path="/admin/inventory/brands/:id/edit" element={<AdminBrandEditPage />} />

          <Route path="/admin/profile" element={<AdminProfilePage />} />
          <Route path="/admin/change-password" element={<AdminChangePasswordPage />} />
        </Route>
      </Route>

      {/* Fallback to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
