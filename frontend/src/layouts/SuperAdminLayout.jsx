import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ToastNotifications from '../components/ToastNotifications';
import { useSuperAdminAuth } from '../features/auth/SuperAdminAuthContext';

export default function SuperAdminLayout() {
  const { user, logout } = useSuperAdminAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Toast notifications container */}
      <ToastNotifications />

      {/* Super Admin Navigation Sidebar */}
      <Sidebar
        role="superadmin"
        user={user}
        onLogout={logout}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar
          role="superadmin"
          user={user}
          onLogout={logout}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

