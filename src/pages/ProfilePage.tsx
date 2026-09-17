import React, { useState } from 'react';
import {
  Copy,
  Check,
  Crown,
  History,
  FileText,
  UserPlus,
  Award,
  CheckSquare,
  Settings,
  Headphones,
  LogOut,
  ChevronRight,
  Shield,
  LayoutDashboard,
} from 'lucide-react';
import { PageId } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { TopHeader } from '../components/TopHeader.js';
import { formatUsd } from '../utils/money.js';

interface ProfilePageProps {
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, onLogout }) => {
  const { user } = useAuth();
  const [copiedId, setCopiedId] = useState(false);

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const menuItems = [
    {
      id: 'my-record',
      label: 'My Record',
      icon: <History className="w-5 h-5 text-indigo-500" />,
      action: () => onNavigate('result'),
    },
    {
      id: 'transaction',
      label: 'Transaction',
      icon: <FileText className="w-5 h-5 text-emerald-500" />,
      action: () => onNavigate('wallet'),
    },
    {
      id: 'invite-friends',
      label: 'Invite Friends',
      icon: <UserPlus className="w-5 h-5 text-amber-500" />,
      action: () => onNavigate('invite'),
    },
    {
      id: 'vip-center',
      label: 'VIP Center',
      icon: <Crown className="w-5 h-5 text-rose-500" />,
      action: () => onNavigate('vip'),
    },
    {
      id: 'task-center',
      label: 'Task Center',
      icon: <CheckSquare className="w-5 h-5 text-teal-500" />,
      action: () => onNavigate('tasks'),
    },
    {
      id: 'manager-portal',
      label: 'Manager & Admin Portal',
      icon: <LayoutDashboard className="w-5 h-5 text-amber-500" />,
      action: () => onNavigate('manager'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5 text-slate-500" />,
      action: () => onNavigate('settings'),
    },
    {
      id: 'customer-service',
      label: 'Customer Service',
      icon: <Headphones className="w-5 h-5 text-purple-500" />,
      action: () => onNavigate('support'),
    },
  ];

  return (
    <div id="profile-page" className="min-h-screen w-full bg-[#F6F7FB] pb-24 flex flex-col">
      <TopHeader variant="red" title="Profile" />

      {/* Red Curved User Profile Header matching Screen 9 */}
      <div className="bg-[#FA3534] px-5 pt-4 pb-12 text-white relative">
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-white/80 overflow-hidden bg-white/20 shadow-md">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-amber-950 rounded-full">
              <Shield className="w-3 h-3 fill-amber-950" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black tracking-wide truncate">
              {user?.username || 'Guest User'}
            </h2>

            {/* ID with copy */}
            <div className="flex items-center gap-1.5 text-xs text-white/90 mt-0.5">
              <span className="font-points">ID: {user?.id || '123456'}</span>
              <button
                onClick={copyUserId}
                className="p-1 hover:bg-white/10 rounded active:scale-95 transition-all"
                title="Copy ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* VIP badge & Upgrade button */}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-black text-amber-300 flex items-center gap-1">
                <Crown className="w-3 h-3 fill-amber-300" />
                VIP {user?.vipLevel || 1}
              </span>
              <button
                onClick={() => onNavigate('vip')}
                className="text-[10px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md hover:brightness-105 active:scale-95"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Balance Card matching Screen 9 */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl p-4 shadow-md border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold block">Total Available Balance</span>
            <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">
              {formatUsd(user ? user.balance : 0)}
            </div>
          </div>
          <button
            id="profile-recharge-btn"
            onClick={() => onNavigate('recharge')}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FF5252] to-[#FA3534] text-white font-black text-xs rounded-xl shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer"
          >
            Recharge
          </button>
        </div>
      </div>

      {/* Menu Options List matching Screen 9 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group active:bg-slate-100"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-1.5 rounded-xl bg-slate-50 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-slate-700">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <div className="px-4 mt-5">
        <button
          id="profile-logout-btn"
          onClick={onLogout}
          className="w-full py-3.5 bg-white border border-red-200 text-red-600 font-bold text-xs rounded-2xl shadow-xs hover:bg-red-50/50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};
