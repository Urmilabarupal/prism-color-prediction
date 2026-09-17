import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Gift,
  Award,
  Sparkles,
  History,
  ChevronRight,
} from 'lucide-react';
import { PageId, WalletTransaction } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { TopHeader } from '../components/TopHeader.js';
import { formatUsd } from '../utils/money.js';

interface WalletPageProps {
  onNavigate: (page: PageId) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    refreshUser();
    if (user) {
      api
        .getTransactions(user.id)
        .then((txs) => setTransactions(txs))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user?.id]);

  const totalBalance = user
    ? user.balance + user.bonus + user.promotion + user.gift
    : 0;

  return (
    <div id="wallet-page" className="min-h-screen w-full bg-[#F6F7FB] pb-20 flex flex-col">
      <TopHeader
        variant="red"
        showBack={true}
        onBack={() => onNavigate('home')}
        title="Wallet"
        rightAction="history"
        onRightAction={() => {}}
      />

      {/* Blue Gradient Total Balance Card matching Screen 6 */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-[#2F80ED] to-[#0052CC] text-white shadow-md shadow-blue-500/20 text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider block">
            Total USD Balance
          </span>
          <div className="text-3xl font-black tracking-tight mt-1 mb-4 font-mono font-points">
            {formatUsd(totalBalance)}
          </div>

          {/* Action Buttons: Recharge & Withdraw */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              id="wallet-recharge-btn"
              onClick={() => onNavigate('recharge')}
              className="py-3 bg-gradient-to-r from-[#FF5252] to-[#FA3534] text-white font-extrabold rounded-xl text-xs shadow-md shadow-red-500/30 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowDownCircle className="w-4 h-4" />
              Recharge
            </button>
            <button
              id="wallet-withdraw-btn"
              onClick={() => onNavigate('withdraw')}
              className="py-3 bg-white text-slate-800 font-extrabold rounded-xl text-xs shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowUpCircle className="w-4 h-4 text-amber-500" />
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Balance Breakdown list matching reference */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
          {/* Main Balance */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700">Balance</span>
            </div>
            <span className="font-extrabold text-slate-900 text-sm font-mono font-points">
              {formatUsd(user ? user.balance : 0)}
            </span>
          </div>

          {/* Bonus */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700">Bonus</span>
            </div>
            <span className="font-extrabold text-slate-900 text-sm font-mono font-points">
              {formatUsd(user ? user.bonus : 0)}
            </span>
          </div>

          {/* Promotion */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700">Promotion</span>
            </div>
            <span className="font-extrabold text-slate-900 text-sm font-mono font-points">
              {formatUsd(user ? user.promotion : 0)}
            </span>
          </div>

          {/* Gift */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700">Gift</span>
            </div>
            <span className="font-extrabold text-slate-900 text-sm font-mono font-points">
              {formatUsd(user ? user.gift : 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="font-extrabold text-slate-900 text-xs">Recent USD Transactions</h3>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs font-medium">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 mt-1">
              {transactions.slice(0, 10).map((tx) => {
                const isCredit = tx.type === 'DEPOSIT' || tx.type === 'WIN_PAYOUT' || tx.type === 'BONUS' || tx.type === 'COMMISSION' || tx.type === 'REFUND';

                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{tx.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(tx.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {tx.method && ` · ${tx.method}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-mono font-black text-sm ${
                          isCredit ? 'text-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        {isCredit ? `+${formatUsd(tx.amount)}` : `-${formatUsd(tx.amount)}`}
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                          tx.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
