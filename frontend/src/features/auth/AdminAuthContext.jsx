import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import adminAuthService from '../../services/adminAuthService';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('admin_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await adminAuthService.getMe();
      setUser(data.user);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
    } catch (err) {
      console.warn('Admin session invalid or expired:', err);
      setUser(null);
      setToken(null);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const data = await adminAuthService.login(credentials);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    return data;
  };

  const logout = async () => {
    try {
      await adminAuthService.logout();
    } catch (err) {
      console.warn('Admin logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('admin_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    checkAuth,
    updateUser,
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

