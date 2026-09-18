import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(!user);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await userApi.getCurrentUser();
      if (response?.data) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } else {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    } catch (err) {
      // If token expired or invalid, reset
      if (err?.status === 401) {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    const res = await userApi.login(credentials);
    if (res?.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.accessToken);
    }
    if (res?.data?.user) {
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } else {
      await fetchCurrentUser();
    }
    return res;
  };

  const register = async (formData) => {
    const res = await userApi.register(formData);
    return res;
  };

  const logout = async () => {
    try {
      await userApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
