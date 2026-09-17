import React from 'react';
import {
  LayoutDashboard,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Gamepad2,
  ListOrdered,
  BarChart3,
  ShieldCheck,
  Sliders,
  LogOut,
  ExternalLink,
  Shield,
  Bell,
} from 'lucide-react';
import { ManagerPageId } from '../types.js';
import { useManager } from './ManagerContext.js';
import { ManagerDashboardView } from './pages/ManagerDashboardView.js';
import { ManagerUsersView } from './pages/ManagerUsersView.js';
import { ManagerDepositsView } from './pages/ManagerDepositsView.js';
import { ManagerWithdrawalsView } from './pages/ManagerWithdrawalsView.js';
import { ManagerGamesView } from './pages/ManagerGamesView.js';
import { ManagerBetsView } from './pages/ManagerBetsView.js';
import { ManagerReportsView } from './pages/ManagerReportsView.js';
import { ManagerAuditLogsView } from './pages/ManagerAuditLogsView.js';
import { ManagerSettingsView } from './pages/ManagerSettingsView.js';

interface ManagerLayoutProps {
  onSwitchToUserApp: () => void;
}

export const ManagerLayout: React.FC<ManagerLayoutProps> = ({ onSwitchToUserApp }) => {
  const { manager, currentPage, setCurrentPage, logoutManager, globalToast } = useManager();

  const navItems: { id: ManagerPageId; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'deposits', label: 'Deposits', icon: <ArrowDownLeft className="w-4 h-4" /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <ArrowUpRight className="w-4 h-4" /> },
    { id: 'games', label: 'Games Monitor', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'bets', label: 'Bet Records', icon: <ListOrdered className="w-4 h-4" /> },
    { id: 'reports', label: 'Financial Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'audit-logs', label: 'Audit Logs', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'settings', label: 'System Settings', icon: <Sliders className="w-4 h-4" /> },
  ];

  const renderActivePage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <ManagerDashboardView />;
      case 'users':
        return <ManagerUsersView />;
      case 'deposits':
        return <ManagerDepositsView />;
      case 'withdrawals':
        return <ManagerWithdrawalsView />;
      case 'games':
        return <ManagerGamesView />;
      case 'bets':
        return <ManagerBetsView />;
      case 'reports':
        return <ManagerReportsView />;
      case 'audit-logs':
        return <ManagerAuditLogsView />;
      case 'settings':
        return <ManagerSettingsView />;
      default:
        return <ManagerDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Toast */}
      {globalToast && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center animate-in fade-in slide-in-from-top-2">
          <Shield className="w-4 h-4 mr-2" />
          {globalToast}
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 hidden md:flex">
        {/* Logo & Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-white flex items-center">
              PRISM MANAGER
            </div>
            <div className="text-[10px] text-amber-400 font-mono tracking-wider">
              PORTAL · USD PRIMARY
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Platform Governance
          </div>

          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Manager Profile Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <img
              src={manager?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt=""
              className="w-8 h-8 rounded-full border border-amber-500/50 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{manager?.username}</div>
              <div className="text-[10px] font-mono text-amber-400">{manager?.managerUid || manager?.id}</div>
            </div>
            <button
              onClick={logoutManager}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
              title="Sign Out Manager"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-5 flex items-center justify-between sticky top-0 z-40">
          {/* Mobile Navigation Pills */}
          <div className="flex md:hidden overflow-x-auto space-x-2 py-1 max-w-[50vw]">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                  currentPage === item.id ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <span className="text-xs text-slate-400">Environment:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              LIVE ENGINE · HOST 0.0.0.0
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-amber-400">
              UID: {manager?.managerUid || manager?.id}
            </span>

            <button
              onClick={onSwitchToUserApp}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
            >
              <span>User App</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={logoutManager}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors md:hidden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};
