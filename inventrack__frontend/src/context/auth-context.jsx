import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '../utils/api-client';

const AuthContext = createContext(undefined);

const STORAGE_KEYS = {
  accessToken: 'inventrack_access_token',
  refreshToken: 'inventrack_refresh_token',
  user: 'inventrack_user',
};

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.accessToken) || null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = Boolean(token && user);

  const persistSession = useCallback((accessToken, refreshToken, userData) => {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/v1/auth/login', { email, password });
      const { accessToken, refreshToken, user: userData } = response.data;
      persistSession(accessToken, refreshToken, userData);
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message, status: error.status };
      }
      return { success: false, error: 'Failed to sign in. Check your connection and try again.', status: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [persistSession]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    try {
      if (refreshToken) {
        await apiClient.post('/api/v1/auth/logout', { refreshToken });
      }
    } catch {
      // Logout should succeed locally even if server call fails
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
