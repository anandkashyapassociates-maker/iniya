import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import superAdminAuthService from './superAdminAuthService';

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

  // Validate session on app initialization
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem('superadmin_token');
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await superAdminAuthService.getMe();
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('superadmin_user', JSON.stringify(data.user));
      } else {
        throw new Error('Invalid user payload');
      }
    } catch (err) {
      console.warn('Super Admin session verification failed:', err);
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
    if (data?.token && data?.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('superadmin_token', data.token);
      localStorage.setItem('superadmin_user', JSON.stringify(data.user));
    }
    return data;
  };

  const logout = async () => {
    try {
      await superAdminAuthService.logout();
    } catch (err) {
      console.warn('Super Admin logout API warning:', err);
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

export default SuperAdminAuthContext;

