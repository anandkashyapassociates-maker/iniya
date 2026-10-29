import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import superAdminAuthService from '../../services/superAdminAuthService';

const SuperAdminAuthContext = createContext(null);

export function SuperAdminAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('superadmin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('superadmin_token'));
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('superadmin_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await superAdminAuthService.getMe();
      setUser(data.user);
      localStorage.setItem('superadmin_user', JSON.stringify(data.user));
    } catch (err) {
      console.warn('Super Admin session invalid or expired:', err);
      setUser(null);
      setToken(null);
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const data = await superAdminAuthService.login(credentials);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('superadmin_token', data.token);
    localStorage.setItem('superadmin_user', JSON.stringify(data.user));
    return data;
  };

  const logout = async () => {
    try {
      await superAdminAuthService.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('superadmin_user', JSON.stringify(updatedUser));
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
    <SuperAdminAuthContext.Provider value={value}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
}

export function useSuperAdminAuth() {
  const context = useContext(SuperAdminAuthContext);
  if (!context) {
    throw new Error('useSuperAdminAuth must be used within SuperAdminAuthProvider');
  }
  return context;
}

