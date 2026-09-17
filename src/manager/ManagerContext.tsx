import React, { createContext, useContext, useEffect, useState } from 'react';
import { ManagerPageId, ManagerPermission, User } from '../types.js';
import { api, getManagerToken, setManagerToken } from '../services/api.js';

interface ManagerContextType {
  manager: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  currentPage: ManagerPageId;
  setCurrentPage: (page: ManagerPageId) => void;
  hasPermission: (permission: ManagerPermission) => boolean;
  loginManager: (identifier: string, pass: string) => Promise<void>;
  logoutManager: () => void;
  refreshManager: () => Promise<void>;
  inspectUserUid: string | null;
  setInspectUserUid: (uid: string | null) => void;
  globalToast: string | null;
  showToast: (msg: string) => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const ManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manager, setManager] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getManagerToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<ManagerPageId>('dashboard');
  const [inspectUserUid, setInspectUserUid] = useState<string | null>(null);
  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3500);
  };

  useEffect(() => {
    const savedToken = getManagerToken();
    if (savedToken) {
      api.getMe(savedToken).then((u) => {
        if (u && (u.role === 'manager' || u.role === 'super_manager')) {
          setManager(u);
        } else {
          setManagerToken(null);
          setTokenState(null);
          setManager(null);
        }
      }).catch(() => {
        // Keep in memory if network momentarily unavailable
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const hasPermission = (permission: ManagerPermission): boolean => {
    if (!manager) return false;
    if (manager.role === 'super_manager') return true;
    return Boolean(manager.permissions && manager.permissions.includes(permission));
  };

  const loginManager = async (identifier: string, pass: string) => {
    const res = await api.managerLogin(identifier, pass);
    setManager(res.manager);
    setTokenState(res.token);
    showToast(`Welcome, ${res.manager.username}! (${res.manager.managerUid})`);
  };

  const logoutManager = () => {
    setManager(null);
    setTokenState(null);
    setManagerToken(null);
    showToast('Manager session ended.');
  };

  const refreshManager = async () => {
    if (token) {
      try {
        const u = await api.getMe(token);
        if (u && (u.role === 'manager' || u.role === 'super_manager')) {
          setManager(u);
        }
      } catch {}
    }
  };

  return (
    <ManagerContext.Provider
      value={{
        manager,
        token,
        isAuthenticated: Boolean(manager && token),
        loading,
        currentPage,
        setCurrentPage,
        hasPermission,
        loginManager,
        logoutManager,
        refreshManager,
        inspectUserUid,
        setInspectUserUid,
        globalToast,
        showToast,
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
};

export const useManager = (): ManagerContextType => {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error('useManager must be used within a ManagerProvider');
  }
  return context;
};
