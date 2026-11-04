import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import adminAuthService from '../../services/adminAuthService';

const AdminAuthContext = createContext(null);

/**
 * Determine initial session for this specific browser tab.
 * Tab-scoped sessionStorage ensures that logging into Admin in Tab 1
 * does NOT force Tab 2 to become Admin or auto-redirect the login page.
 * Admin and Staff sessions are strictly isolated.
 */
const getInitialAuth = () => {
  try {
    // 1. Check tab-scoped sessionStorage first (isolated per tab)
    const tabToken = sessionStorage.getItem('clinic_tab_token');
    const tabUser = sessionStorage.getItem('clinic_tab_user');
    const tabRole = sessionStorage.getItem('clinic_tab_role');
    if (tabToken && tabUser) {
      const parsed = JSON.parse(tabUser);
      return {
        token: tabToken,
        user: parsed,
        role: tabRole || (parsed?.role === 'staff' ? 'staff' : 'admin'),
      };
    }

    // 2. If the tab opened a guest/login page, DO NOT auto-restore!
    // This allows opening a second tab to cleanly see the login portal and choose Staff / Admin.
    const path = window.location.pathname;
    const isGuestPath =
      path === '/' ||
      path === '/admin' ||
      path === '/admin/login' ||
      path === '/admin/forgot-password' ||
      path === '/admin/reset-password';

    if (isGuestPath) {
      return { token: null, user: null, role: null };
    }

    // 3. If navigating directly to a protected page in a new tab:
    // If it's a staff-specific route, check staff storage
    const isStaffPath = path.startsWith('/admin/my-appointments');
    if (isStaffPath) {
      const staffToken = localStorage.getItem('staff_token');
      const staffUser = localStorage.getItem('staff_user');
      if (staffToken && staffUser) {
        sessionStorage.setItem('clinic_tab_token', staffToken);
        sessionStorage.setItem('clinic_tab_user', staffUser);
        sessionStorage.setItem('clinic_tab_role', 'staff');
        return { token: staffToken, user: JSON.parse(staffUser), role: 'staff' };
      }
    }

    // If last active role was staff, restore staff
    const lastRole = localStorage.getItem('clinic_active_role');
    if (lastRole === 'staff') {
      const staffToken = localStorage.getItem('staff_token');
      const staffUser = localStorage.getItem('staff_user');
      if (staffToken && staffUser) {
        sessionStorage.setItem('clinic_tab_token', staffToken);
        sessionStorage.setItem('clinic_tab_user', staffUser);
        sessionStorage.setItem('clinic_tab_role', 'staff');
        return { token: staffToken, user: JSON.parse(staffUser), role: 'staff' };
      }
    }

    // Check persistent Admin session
    const adminToken = localStorage.getItem('admin_token');
    const adminUser = localStorage.getItem('admin_user');
    if (adminToken && adminUser) {
      sessionStorage.setItem('clinic_tab_token', adminToken);
      sessionStorage.setItem('clinic_tab_user', adminUser);
      sessionStorage.setItem('clinic_tab_role', 'admin');
      return { token: adminToken, user: JSON.parse(adminUser), role: 'admin' };
    }

    // Fallback to staff session
    const staffToken = localStorage.getItem('staff_token');
    const staffUser = localStorage.getItem('staff_user');
    if (staffToken && staffUser) {
      sessionStorage.setItem('clinic_tab_token', staffToken);
      sessionStorage.setItem('clinic_tab_user', staffUser);
      sessionStorage.setItem('clinic_tab_role', 'staff');
      return { token: staffToken, user: JSON.parse(staffUser), role: 'staff' };
    }

    return { token: null, user: null, role: null };
  } catch {
    return { token: null, user: null, role: null };
  }
};

export function AdminAuthProvider({ children }) {
  const initial = getInitialAuth();
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  const [role, setRole] = useState(initial.role);
  const [isLoading, setIsLoading] = useState(() => {
    const path = window.location.pathname;
    const isGuestPath =
      path === '/' ||
      path === '/admin' ||
      path === '/admin/login' ||
      path === '/admin/forgot-password' ||
      path === '/admin/reset-password';
    if (isGuestPath && !initial.token) {
      return false;
    }
    return Boolean(initial.token);
  });

  const checkAuth = useCallback(async () => {
    const tabToken = sessionStorage.getItem('clinic_tab_token');
    const tabRole = sessionStorage.getItem('clinic_tab_role');
    const path = window.location.pathname;
    const isGuestPath =
      path === '/' ||
      path === '/admin' ||
      path === '/admin/login' ||
      path === '/admin/forgot-password' ||
      path === '/admin/reset-password';

    if (isGuestPath && !tabToken) {
      setUser(null);
      setToken(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    const currentToken =
      tabToken ||
      (tabRole === 'staff' ? localStorage.getItem('staff_token') : localStorage.getItem('admin_token')) ||
      localStorage.getItem('admin_token') ||
      localStorage.getItem('staff_token');

    if (!currentToken) {
      setUser(null);
      setToken(null);
      setRole(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await adminAuthService.getMe();
      const updatedUser = data.user;
      const isStaff =
        updatedUser?.role === 'staff' ||
        updatedUser?.user_type === 'staff' ||
        Boolean(updatedUser?.staff_code);
      const detectedRole = isStaff ? 'staff' : 'admin';

      setUser(updatedUser);
      setToken(currentToken);
      setRole(detectedRole);

      sessionStorage.setItem('clinic_tab_token', currentToken);
      sessionStorage.setItem('clinic_tab_user', JSON.stringify(updatedUser));
      sessionStorage.setItem('clinic_tab_role', detectedRole);

      if (detectedRole === 'staff') {
        localStorage.setItem('staff_token', currentToken);
        localStorage.setItem('staff_user', JSON.stringify(updatedUser));
      } else {
        localStorage.setItem('admin_token', currentToken);
        localStorage.setItem('admin_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.warn('Clinic session invalid or expired:', err);
      sessionStorage.removeItem('clinic_tab_token');
      sessionStorage.removeItem('clinic_tab_user');
      sessionStorage.removeItem('clinic_tab_role');
      if (tabRole === 'staff') {
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');
      } else {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
      setUser(null);
      setToken(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const data = await adminAuthService.login(credentials);
    const isStaff =
      credentials?.account_type === 'staff' ||
      data.user?.role === 'staff' ||
      data.user?.user_type === 'staff' ||
      Boolean(data.user?.staff_code);
    const activeRole = isStaff ? 'staff' : 'admin';

    // 1. Isolate in current tab's sessionStorage
    sessionStorage.setItem('clinic_tab_token', data.token);
    sessionStorage.setItem('clinic_tab_user', JSON.stringify(data.user));
    sessionStorage.setItem('clinic_tab_role', activeRole);

    // 2. Save in dedicated role-specific localStorage key
    if (activeRole === 'staff') {
      localStorage.setItem('staff_token', data.token);
      localStorage.setItem('staff_user', JSON.stringify(data.user));
    } else {
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
    }
    localStorage.setItem('clinic_active_role', activeRole);

    setToken(data.token);
    setUser(data.user);
    setRole(activeRole);
    return data;
  };

  const logout = async () => {
    const currentRole =
      sessionStorage.getItem('clinic_tab_role') ||
      role ||
      (user?.role === 'staff' ? 'staff' : 'admin');

    try {
      await adminAuthService.logout();
    } catch (err) {
      console.warn('Clinic logout notice:', err);
    } finally {
      sessionStorage.removeItem('clinic_tab_token');
      sessionStorage.removeItem('clinic_tab_user');
      sessionStorage.removeItem('clinic_tab_role');

      if (currentRole === 'staff') {
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');
      } else {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }

      setUser(null);
      setToken(null);
      setRole(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('clinic_tab_user', JSON.stringify(updatedUser));
    const isStaff =
      updatedUser?.role === 'staff' ||
      updatedUser?.user_type === 'staff' ||
      Boolean(updatedUser?.staff_code);
    if (isStaff) {
      localStorage.setItem('staff_user', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
    }
  };

  const setSession = (newToken, newUser) => {
    const isStaff =
      newUser?.role === 'staff' ||
      newUser?.user_type === 'staff' ||
      Boolean(newUser?.staff_code);
    const activeRole = isStaff ? 'staff' : 'admin';

    setToken(newToken);
    setUser(newUser);
    setRole(activeRole);

    sessionStorage.setItem('clinic_tab_token', newToken);
    sessionStorage.setItem('clinic_tab_user', JSON.stringify(newUser));
    sessionStorage.setItem('clinic_tab_role', activeRole);

    if (activeRole === 'staff') {
      localStorage.setItem('staff_token', newToken);
      localStorage.setItem('staff_user', JSON.stringify(newUser));
    } else {
      localStorage.setItem('admin_token', newToken);
      localStorage.setItem('admin_user', JSON.stringify(newUser));
    }
    localStorage.setItem('clinic_active_role', activeRole);
  };

  const value = {
    user,
    token,
    role,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    checkAuth,
    updateUser,
    setSession,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
