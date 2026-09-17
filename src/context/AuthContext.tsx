import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string, type?: 'phone' | 'email') => Promise<void>;
  googleLogin: () => Promise<void>;
  register: (params: { phone?: string; email?: string; password: string; inviteCode?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'prism_user_id';
const AUTH_CACHE_KEY = 'prism_user_cache';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Initial load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUserId) {
          const userData = await api.getMe(storedUserId);
          setUser(userData);
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem(AUTH_CACHE_KEY);
        }
      } catch (err: any) {
        // If explicitly user not found (404), clear storage
        if (err?.message?.includes('not found') || err?.message?.includes('404')) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(AUTH_CACHE_KEY);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (identifier: string, password: string, type: 'phone' | 'email' = 'phone') => {
    setLoading(true);
    try {
      const loggedUser = await api.login(identifier, password, type);
      setUser(loggedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, loggedUser.id);
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(loggedUser));
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    try {
      const loggedUser = await api.googleLogin();
      setUser(loggedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, loggedUser.id);
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(loggedUser));
    } finally {
      setLoading(false);
    }
  };

  const register = async (params: { phone?: string; email?: string; password: string; inviteCode?: string }) => {
    setLoading(true);
    try {
      const newUser = await api.register(params);
      setUser(newUser);
      localStorage.setItem(AUTH_STORAGE_KEY, newUser.id);
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_CACHE_KEY);
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      const updated = await api.getMe(user.id);
      setUser(updated);
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(updated));
    } catch {
      // Retain existing user in memory on transient error
    }
  };

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      const updated = { ...user, balance: newBalance };
      setUser(updated);
      try {
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(updated));
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        logout,
        refreshUser,
        updateUserBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
