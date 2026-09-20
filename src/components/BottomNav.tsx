import React from 'react';
import { Home, Gift, Wallet, User, CircleDollarSign } from 'lucide-react';
import { PageId } from '../types.js';

interface BottomNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentPage, onNavigate }) => {
  const tabs: { id: PageId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'game',
      label: 'Get ₹500',
      icon: <CircleDollarSign className="w-5 h-5" />,
    },
    {
      id: 'wallet',
      label: 'Promotion',
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      id: 'tasks',
      label: 'Activity',
      icon: <Gift className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-white border-t border-slate-100 px-3 py-1.5 flex items-center justify-around z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]"
    >
      {tabs.map((tab) => {
        const isActive =
          currentPage === tab.id ||
          (tab.id === 'game' && currentPage === 'result') ||
          (tab.id === 'wallet' && (currentPage === 'recharge' || currentPage === 'withdraw'));

        return (
          <button
            key={tab.id}
            id={`nav-btn-${tab.id}`}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center w-14 py-1 transition-all relative ${
              isActive ? 'text-[#FA3534]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`transition-transform duration-200 ${isActive ? 'scale-110 font-bold' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[11px] mt-0.5 font-medium leading-none ${isActive ? 'font-bold' : ''}`}>
              {tab.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#FA3534]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
