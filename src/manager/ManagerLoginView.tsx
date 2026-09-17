import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowLeft, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useManager } from './ManagerContext.js';

interface ManagerLoginViewProps {
  onBackToApp?: () => void;
  onBackToUserApp?: () => void;
}

export const ManagerLoginView: React.FC<ManagerLoginViewProps> = ({ onBackToApp, onBackToUserApp }) => {
  const handleBack = onBackToUserApp || onBackToApp || (() => {});
  const { loginManager } = useManager();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuickRole, setActiveQuickRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your Manager UID or Email and Password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await loginManager(identifier, password);
    } catch (err: any) {
      setError(err?.message || 'Access Denied: Invalid manager credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (id: string, pass: string, roleName: string) => {
    setActiveQuickRole(roleName);
    setIdentifier(id);
    setPassword(pass);
    setError(null);
    setLoading(true);
    try {
      await loginManager(id, pass);
    } catch (err: any) {
      setError(err?.message || 'Access Denied: Invalid manager credentials');
    } finally {
      setLoading(false);
      setActiveQuickRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Subtle geometric background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <button
          onClick={handleBack}
          className="flex items-center text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Player App
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">PRISM MANAGER PORTAL</h1>
            <p className="text-xs text-slate-400">Restricted Operations & Risk Management</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start space-x-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Manager UID / Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. MGR-888999 or admin@prismgame.com"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading && !activeQuickRole ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Authorize & Enter Portal</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-xs font-medium text-slate-400 mb-3 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
            Quick 1-Click Login:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="super-admin-quick-login-btn"
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('MGR-888999', 'Manager@2026', 'super_admin')}
              className="text-left p-3 bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/40 rounded-xl transition-all cursor-pointer relative active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-amber-300">Super Admin</div>
                {loading && activeQuickRole === 'super_admin' && (
                  <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="text-[11px] text-slate-300 font-mono mt-0.5">MGR-888999</div>
              <div className="text-[10px] text-amber-400/90 font-semibold mt-1">
                {loading && activeQuickRole === 'super_admin' ? 'Logging in...' : 'Click to Login →'}
              </div>
            </button>
            <button
              id="ops-manager-quick-login-btn"
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('MGR-100200', 'Manager@2026', 'ops_manager')}
              className="text-left p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-sky-400">Ops Manager</div>
                {loading && activeQuickRole === 'ops_manager' && (
                  <span className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">MGR-100200</div>
              <div className="text-[10px] text-sky-400/90 font-semibold mt-1">
                {loading && activeQuickRole === 'ops_manager' ? 'Logging in...' : 'Click to Login →'}
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-[11px] text-slate-500">
          Protected by Server-Side Role-Based Access Control (RBAC) & Audit Engine.
        </div>
      </div>
    </div>
  );
};
