import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { SuperAdminAuthProvider } from './features/auth/SuperAdminAuthContext';
import { AdminAuthProvider } from './features/auth/AdminAuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SuperAdminAuthProvider>
          <AdminAuthProvider>
            <AppRoutes />
          </AdminAuthProvider>
        </SuperAdminAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
