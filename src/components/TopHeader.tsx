import React from 'react';
import { ArrowLeft, Headphones, Bell, Wallet, History, HelpCircle } from 'lucide-react';
import { PageId } from '../types.js';

interface TopHeaderProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightAction?: 'support_notification' | 'wallet' | 'history' | 'help' | null;
  onRightAction?: () => void;
  onSupportClick?: () => void;
  onNotificationClick?: () => void;
  variant?: 'red' | 'white';
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  onBack,
  showBack = false,
  rightAction = null,
  onRightAction,
  onSupportClick,
  onNotificationClick,
  variant = 'red',
}) => {
  const isRed = variant === 'red';

  return (
    <header
      id="top-header"
      className={`sticky top-0 z-30 w-full px-4 h-12 flex items-center justify-between select-none ${
        isRed ? 'bg-[#FA3534] text-white shadow-sm' : 'bg-white text-slate-800 border-b border-slate-100'
      }`}
    >
      {/* Left section */}
      <div className="flex items-center min-w-[40px]">
        {showBack ? (
          <button
            id="header-back-btn"
            onClick={onBack}
            className={`p-1.5 -ml-1.5 rounded-full transition-colors active:scale-95 ${
              isRed ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 font-bold tracking-wider text-base">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-white transform -rotate-12"
            >
              <path d="M8 48L92 12L56 90L44 58L8 48Z" fill="white" />
            </svg>
            <span className="font-extrabold text-white tracking-widest text-sm uppercase">PRISM</span>
          </div>
        )}
      </div>

      {/* Middle Title */}
      <div className="flex-1 text-center font-bold text-base tracking-wide truncate px-2">
        {title}
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-end min-w-[40px] gap-2.5">
        {rightAction === 'support_notification' && (
          <>
            <button
              id="header-support-btn"
              onClick={onSupportClick}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition-all active:scale-95"
              title="Customer Support"
            >
              <Headphones className="w-5 h-5" />
            </button>
            <button
              id="header-notification-btn"
              onClick={onNotificationClick}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition-all relative active:scale-95"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-300 border border-[#FA3534]" />
            </button>
          </>
        )}

        {rightAction === 'wallet' && (
          <button
            id="header-wallet-btn"
            onClick={onRightAction}
            className={`p-1.5 rounded-full transition-all active:scale-95 ${
              isRed ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Wallet"
          >
            <Wallet className="w-5 h-5" />
          </button>
        )}

        {rightAction === 'history' && (
          <button
            id="header-history-btn"
            onClick={onRightAction}
            className={`p-1.5 rounded-full transition-all active:scale-95 ${
              isRed ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="History"
          >
            <History className="w-5 h-5" />
          </button>
        )}

        {rightAction === 'help' && (
          <button
            id="header-help-btn"
            onClick={onRightAction}
            className={`p-1.5 rounded-full transition-all active:scale-95 ${
              isRed ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Game Rules"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        )}

        {!rightAction && <div className="w-5" />}
      </div>
    </header>
  );
};
