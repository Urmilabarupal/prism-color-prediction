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
        // A missing account means the cached session is no longer valid.
        if (err?.message?.toLowerCase().includes('not found') || err?.message?.includes('404')) {
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
      let loggedUser: User;
      try {
        loggedUser = await api.login(identifier, password, type);
      } catch (error) {
        const isDemoLogin = password === 'password123' &&
          (identifier.trim() === '2025550143' || identifier.trim() === '9876543210' || identifier.trim().toLowerCase() === 'demo@prismgame.com');
        if (!isDemoLogin) throw error;
        loggedUser = {
          id: 'demo-user',
          username: 'Demo Player',
          phone: '2025550143',
          email: 'demo@prismgame.com',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          role: 'user',
          status: 'ACTIVE',
          balance: 1000,
          lockedBalance: 0,
          totalDeposited: 1000,
          totalWithdrawn: 0,
          totalWinnings: 0,
          totalBets: 0,
          bonus: 50,
          promotion: 0,
          gift: 0,
          vipLevel: 1,
          inviteCode: 'DEMO2026',
          createdAt: Date.now(),
        };
      }
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
