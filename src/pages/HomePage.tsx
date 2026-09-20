import React from 'react';
import {
  Volume2,
  Crown,
  CheckSquare,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  Flame,
  Gamepad2,
  Dice5,
  Coins,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GameMode, PageId } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { useGame } from '../context/GameContext.js';
import { TopHeader } from '../components/TopHeader.js';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
  onSelectGameMode?: (mode: GameMode) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectGameMode }) => {
  const { user } = useAuth();
  const { currentRound, timeLeft, history, setMode } = useGame();

  const handleGameSelect = (m: GameMode) => {
    if (setMode) {
      setMode(m);
    }
    if (typeof onSelectGameMode === 'function') {
      onSelectGameMode(m);
    }
    onNavigate('game');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div id="home-page" className="min-h-screen w-full bg-[#F6F7FB] pb-20 flex flex-col">
      {/* Top Header matching reference */}
      <TopHeader
        variant="red"
        rightAction="support_notification"
        onSupportClick={() => onNavigate('support')}
        onNotificationClick={() => alert('Notifications: All withdrawal systems operating at 100% speed. Happy gaming!')}
      />

      {/* Promotional Banner with gradient background */}
      <div className="w-full bg-gradient-to-b from-red-500 to-red-400 px-4 pt-4 pb-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 p-6 text-white shadow-lg">
          {/* Decorative elements */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-lg font-black text-white mb-1">Thanks to all members!</h2>
            <p className="text-xs text-white/90 leading-relaxed mb-4">
              Because of your support, we have become the most reputable gaming group in India. We provide bonuses, membership discounts, member betting rebates and will continue to launch exciting bonuses!
            </p>
            <p className="text-[11px] text-yellow-300 font-bold">💰 1% to 5%</p>
          </div>
        </div>
      </div>

      {/* Quick Balance Card */}
      <div className="px-4 mt-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 to-red-600 p-6 text-white shadow-md">
          {user && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 mb-1">Total Balance</p>
                <p className="text-2xl font-black font-points">
                  ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <button
                onClick={() => onNavigate('recharge')}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full text-sm shadow-lg transition-all active:scale-95"
              >
                + Recharge
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Quick Action Buttons matching reference screen 3 */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-4 gap-2 border border-slate-100">
          {/* Recharge */}
          <button
            id="home-action-recharge"
            onClick={() => onNavigate('recharge')}
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">Recharge</span>
          </button>

          {/* Withdraw */}
          <button
            id="home-action-withdraw"
            onClick={() => onNavigate('withdraw')}
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">Withdraw</span>
          </button>

          {/* VIP */}
          <button
            id="home-action-vip"
            onClick={() => onNavigate('vip')}
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <Crown className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">VIP</span>
          </button>

          {/* Task */}
          <button
            id="home-action-task"
            onClick={() => onNavigate('tasks')}
            className="flex flex-col items-center group active:scale-95 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 mt-2">Task</span>
          </button>
        </div>
      </div>

      {/* Marquee Ticker Notification */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2 border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-1 rounded-md bg-amber-50 text-amber-600 flex-shrink-0">
            <Volume2 className="w-4 h-4 animate-pulse" />
          </div>
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div className="inline-block animate-marquee text-xs font-medium text-slate-600">
              Welcome to Prism! Play responsibly and enjoy instant payouts · Round settlement is 100% server verified · Invite friends to earn 30% lifetime commission!
            </div>
          </div>
        </div>
      </div>

      {/* Game Categories Bar */}
      <div className="px-4 mt-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Win Go Active */}
          <button
            onClick={() => handleGameSelect('1min')}
            className="flex-1 min-w-[76px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FA3534] to-[#E02424] text-white flex flex-col items-center shadow-sm shadow-red-500/20 active:scale-95 transition-all"
          >
            <Zap className="w-5 h-5 mb-1" />
            <span className="text-xs font-black">Win Go</span>
          </button>

          {/* K3 */}
          <button
            onClick={() => handleGameSelect('3min')}
            className="flex-1 min-w-[76px] py-2.5 px-3 rounded-xl bg-white text-slate-700 hover:bg-slate-50 flex flex-col items-center border border-slate-100 shadow-sm active:scale-95 transition-all"
          >
            <Dice5 className="w-5 h-5 text-amber-500 mb-1" />
            <span className="text-xs font-bold">K3 Dice</span>
          </button>

          {/* 5D */}
          <button
            onClick={() => handleGameSelect('5min')}
            className="flex-1 min-w-[76px] py-2.5 px-3 rounded-xl bg-white text-slate-700 hover:bg-slate-50 flex flex-col items-center border border-slate-100 shadow-sm active:scale-95 transition-all"
          >
            <Coins className="w-5 h-5 text-emerald-500 mb-1" />
            <span className="text-xs font-bold">5D Ball</span>
          </button>

          {/* Trx Win */}
          <button
            onClick={() => handleGameSelect('10min')}
            className="flex-1 min-w-[76px] py-2.5 px-3 rounded-xl bg-white text-slate-700 hover:bg-slate-50 flex flex-col items-center border border-slate-100 shadow-sm active:scale-95 transition-all"
          >
            <Gamepad2 className="w-5 h-5 text-indigo-500 mb-1" />
            <span className="text-xs font-bold">Trx Win</span>
          </button>
        </div>
      </div>

      {/* Win Go Main Section Card */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FA3534]" />
              <h3 className="font-extrabold text-slate-900 text-sm tracking-wide">Win Go Modes</h3>
            </div>
            <button
              onClick={() => handleGameSelect('1min')}
              className="text-xs font-bold text-[#FA3534] flex items-center hover:underline"
            >
              Play Now <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {/* Sub-timers grid chips matching reference Screen 3 */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {(
              [
                { mode: '1min' as GameMode, label: '1 Min', desc: 'Fast' },
                { mode: '3min' as GameMode, label: '3 Min', desc: 'Popular' },
                { mode: '5min' as GameMode, label: '5 Min', desc: 'Classic' },
                { mode: '10min' as GameMode, label: '10 Min', desc: 'Strategy' },
              ] as const
            ).map((item) => (
              <button
                key={item.mode}
                onClick={() => handleGameSelect(item.mode)}
                className="py-2 px-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 flex flex-col items-center active:scale-95 transition-all"
              >
                <span className="text-xs font-black text-slate-800">{item.label}</span>
                <span className="text-[10px] font-semibold text-slate-400">{item.desc}</span>
              </button>
            ))}
          </div>

          {/* Live Current Period Info Box */}
          <div
            onClick={() => handleGameSelect('1min')}
            className="mt-3 p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50/50 border border-red-100 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
          >
            <div>
              <span className="text-[11px] font-medium text-slate-500">Live Period</span>
              <p className="text-xs font-points font-black text-slate-800 tracking-wider">
                {currentRound?.periodId || 'Loading...'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500">Time Left</span>
              <p className={`text-base font-points font-black ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-[#FA3534]'}`}>
                {formatTimer(timeLeft)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Winning Results Preview */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-sm tracking-wide">Recent Results</h3>
            <button
              onClick={() => onNavigate('result')}
              className="text-xs font-bold text-slate-500 hover:text-[#FA3534] flex items-center"
            >
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {/* List of recent 5 winning results */}
          <div className="divide-y divide-slate-100 mt-1">
            {history.slice(0, 5).map((r) => {
              const isGreen = r.colors.includes('green');
              const isRed = r.colors.includes('red');
              const isViolet = r.colors.includes('violet');

              return (
                <div key={r.periodId} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-points font-bold text-slate-700">{r.periodId}</span>
                    <span className="text-slate-400 text-[10px] ml-2 font-points">{r.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold uppercase text-[11px] ${
                        r.bigSmall === 'big' ? 'text-amber-500' : 'text-blue-500'
                      }`}
                    >
                      {r.bigSmall}
                    </span>

                    {/* Result Number Circle */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-sm font-points ${
                        r.number === 0
                          ? 'bg-gradient-to-r from-[#FA3534] to-[#8B5CF6]'
                          : r.number === 5
                          ? 'bg-gradient-to-r from-[#10B981] to-[#8B5CF6]'
                          : isRed
                          ? 'bg-[#FA3534]'
                          : 'bg-[#10B981]'
                      }`}
                    >
                      {r.number}
                    </div>

                    {/* Color Dots */}
                    <div className="flex items-center gap-1 w-6 justify-end">
                      {isGreen && <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />}
                      {isViolet && <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />}
                      {isRed && <span className="w-2.5 h-2.5 rounded-full bg-[#FA3534]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
