import React, { useState } from 'react';
import {
  Lock,
  Globe,
  ShieldCheck,
  Bell,
  Info,
  ChevronRight,
  LogOut,
  Check,
  AlertCircle,
} from 'lucide-react';
import { PageId } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { TopHeader } from '../components/TopHeader.js';

interface SettingsPageProps {
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, onLogout }) => {
  const { user } = useAuth();

  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Change password modal
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // About modal
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    setLoading(true);
    setPwdMsg(null);
    try {
      const res = await api.changePassword(user.id, oldPassword, newPassword);
      if (res.success) {
        setPwdMsg({ type: 'success', text: res.message });
        setTimeout(() => {
          setShowPwdModal(false);
          setOldPassword('');
          setNewPassword('');
          setPwdMsg(null);
        }, 1200);
      } else {
        setPwdMsg({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="settings-page" className="min-h-screen w-full bg-[#F6F7FB] pb-24 flex flex-col">
      <TopHeader
        variant="red"
        showBack={true}
        onBack={() => onNavigate('profile')}
        title="Settings"
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Settings List matching Screen 12 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {/* Change Password */}
          <button
            onClick={() => setShowPwdModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group active:bg-slate-100"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-[#FA3534] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Change Password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Language */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">Language</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'English' ? 'Hindi' : 'English')}
                className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 active:scale-95"
              >
                {language}
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 block">Security Protection</span>
                <span className="text-[10px] text-emerald-600 font-semibold">256-Bit SSL Encrypted</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Active
            </span>
          </div>

          {/* Notification toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 block">Push Notifications</span>
                <span className="text-[10px] text-slate-400">Round results & payout alerts</span>
              </div>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                notificationsEnabled ? 'bg-[#FA3534]' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* About Us */}
          <button
            onClick={() => setShowAboutModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group active:bg-slate-100"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700">About Us</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* App Version */}
          <div className="p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">App Version</span>
            <span className="text-xs font-mono font-bold text-slate-400">v1.0.0 (Build 2026.09)</span>
          </div>
        </div>

        {/* Logout Button matching reference */}
        <button
          onClick={onLogout}
          className="w-full py-4 bg-white border border-red-200 text-[#FA3534] font-extrabold text-xs rounded-2xl shadow-xs hover:bg-red-50/50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>

      {/* Change Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-extrabold text-slate-900 pb-2 border-b border-slate-100">
              Change Login Password
            </h3>

            {pwdMsg && (
              <div
                className={`mt-3 p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  pwdMsg.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {pwdMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 mt-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#FA3534] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#FA3534] outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPwdModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-[#FA3534] text-white rounded-xl text-xs font-extrabold shadow-md shadow-red-500/20 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl animate-scaleUp text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5252] to-[#FA3534] text-white font-black text-xl flex items-center justify-center mx-auto shadow-md shadow-red-500/30">
              P
            </div>
            <h3 className="text-base font-black text-slate-900 mt-2">Prism Gaming Platform</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Prism is a licensed, provably-fair mobile prediction entertainment platform offering real-time Win Go rounds, instant settlement, and encrypted financial gateways.
            </p>
            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 text-left space-y-1">
              <div>• Provably Fair Certified Engine</div>
              <div>• 24/7 Fast Automated Withdrawals</div>
              <div>• 30% Multi-tier Affiliate Rewards</div>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
