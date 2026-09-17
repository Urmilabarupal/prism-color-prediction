import React, { useState } from 'react';
import {
  Check,
  Coins,
  Building2,
  AlertCircle,
  CheckCircle2,
  History,
  DollarSign,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import { PageId, WithdrawalMethod } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { TopHeader } from '../components/TopHeader.js';
import { formatUsd } from '../utils/money.js';

interface WithdrawPageProps {
  onNavigate: (page: PageId) => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({ onNavigate }) => {
  const { user, refreshUser, updateUserBalance } = useAuth();

  const [method, setMethod] = useState<WithdrawalMethod>('USDT_TRC20');
  const [amount, setAmount] = useState<string>('50');
  const [walletOrAccount, setWalletOrAccount] = useState<string>(
    user?.bankDetails?.usdtTrc20Address || ''
  );
  const [accountName, setAccountName] = useState<string>(
    user?.bankDetails?.accountHolder || user?.bankDetails?.accountName || ''
  );
  const [bankName, setBankName] = useState<string>(user?.bankDetails?.bankName || '');
  const [routingNumber, setRoutingNumber] = useState<string>(
    user?.bankDetails?.routingNumber || ''
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableBalance = user ? user.balance : 0;
  const lockedBalance = user ? user.lockedBalance || 0 : 0;

  const handleMethodChange = (m: WithdrawalMethod) => {
    setMethod(m);
    if (m === 'USDT_TRC20' || m === 'USDT_BEP20') {
      setWalletOrAccount(user?.bankDetails?.usdtTrc20Address || '');
    } else {
      setWalletOrAccount(user?.bankDetails?.accountNumber || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 20 || numAmount > 10000) {
      setError('Withdrawal amount must be between $20.00 and $10,000.00 USD');
      return;
    }
    if (numAmount > availableBalance) {
      setError(`Insufficient available balance ($${availableBalance.toFixed(2)} USD). You cannot withdraw locked or reserved funds.`);
      return;
    }
    if (!walletOrAccount || walletOrAccount.trim().length < 6) {
      setError(
        method === 'USDT_TRC20' || method === 'USDT_BEP20'
          ? 'Please enter a valid USDT destination wallet address'
          : 'Please enter a valid bank account number or IBAN'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.withdraw({
        userId: user!.id,
        amount: numAmount,
        method,
        destination: {
          accountName,
          accountNumber: walletOrAccount,
          bankName,
          routingNumber,
          walletAddress: walletOrAccount,
        },
      });

      if (res.success) {
        updateUserBalance(res.availableBalance);
        refreshUser();
        setSuccess(res.message);
        setAmount('50');
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Withdrawal request submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="withdraw-page" className="min-h-screen w-full bg-[#F6F7FB] pb-20 flex flex-col">
      <TopHeader
        variant="red"
        showBack={true}
        onBack={() => onNavigate('wallet')}
        title="Withdraw USD Funds"
        rightAction="history"
        onRightAction={() => onNavigate('wallet')}
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Available Balance Box */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Available to Withdraw (USD)
            </span>
            <div className="text-2xl font-black text-slate-800 mt-0.5 tracking-tight font-mono">
              {formatUsd(availableBalance)}
            </div>
            {lockedBalance > 0 && (
              <div className="text-[11px] text-amber-600 font-medium mt-0.5 flex items-center">
                <Lock className="w-3 h-3 mr-1" />
                {formatUsd(lockedBalance)} locked in active reviews
              </div>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              USD Currency
            </span>
          </div>
        </div>

        {/* Withdrawal Method Selection */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            1. Select USD Payout Channel
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleMethodChange('USDT_TRC20')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                method === 'USDT_TRC20'
                  ? 'border-[#FA3534] bg-red-50/30 ring-1 ring-[#FA3534]/20'
                  : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Coins className="w-5 h-5 text-emerald-500" />
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    method === 'USDT_TRC20' ? 'border-[#FA3534] bg-[#FA3534]' : 'border-slate-300'
                  }`}
                >
                  {method === 'USDT_TRC20' && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>
              </div>
              <div className="text-xs font-bold text-slate-800">USDT (TRC20)</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Instant Crypto Payout</div>
            </button>

            <button
              type="button"
              onClick={() => handleMethodChange('BANK_WIRE')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                method === 'BANK_WIRE'
                  ? 'border-[#FA3534] bg-red-50/30 ring-1 ring-[#FA3534]/20'
                  : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Building2 className="w-5 h-5 text-blue-500" />
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    method === 'BANK_WIRE' ? 'border-[#FA3534] bg-[#FA3534]' : 'border-slate-300'
                  }`}
                >
                  {method === 'BANK_WIRE' && <div className="w-1 h-1 rounded-full bg-white" />}
                </div>
              </div>
              <div className="text-xs font-bold text-slate-800">Bank Wire Transfer</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Direct ACH / Wire (USD)</div>
            </button>
          </div>
        </div>

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            2. Beneficiary Details & Amount
          </h3>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Request Submitted!</span>
                <p className="mt-0.5 text-[11px]">{success}</p>
              </div>
            </div>
          )}

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Withdrawal Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-700 font-mono">
                $
              </span>
              <input
                type="number"
                min="20"
                max="10000"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-16 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FA3534] font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setAmount(String(Math.floor(availableBalance)))}
                className="absolute right-3 top-2.5 text-xs font-bold text-[#FA3534] hover:underline"
              >
                All
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>Minimum: $20.00 USD</span>
              <span>Maximum: $10,000.00 USD (0% Fee)</span>
            </p>
          </div>

          {/* Destination inputs */}
          {method === 'USDT_TRC20' || method === 'USDT_BEP20' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                USDT (TRC20) Destination Address
              </label>
              <input
                type="text"
                value={walletOrAccount}
                onChange={(e) => setWalletOrAccount(e.target.value)}
                placeholder="e.g. T..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#FA3534]"
                required
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Beneficiary Full Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#FA3534]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Account Number / IBAN
                </label>
                <input
                  type="text"
                  value={walletOrAccount}
                  onChange={(e) => setWalletOrAccount(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#FA3534]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. JPMorgan Chase"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#FA3534]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Routing / SWIFT
                  </label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="e.g. 021000021"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#FA3534]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-800 flex items-start space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Funds are reserved into your Locked Balance immediately upon submission to prevent double spending. Our finance desk audits and disburses payments 24/7.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || availableBalance < 20}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FA3534] to-[#E02424] text-white font-bold text-sm shadow-lg shadow-red-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>Submit USD Withdrawal Request</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
