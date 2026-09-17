import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  ArrowLeft,
  CreditCard,
  Coins,
  Building2,
  DollarSign,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { PageId, PaymentMethod } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { TopHeader } from '../components/TopHeader.js';
import { formatUsd } from '../utils/money.js';

interface RechargePageProps {
  onNavigate: (page: PageId) => void;
}

export const RechargePage: React.FC<RechargePageProps> = ({ onNavigate }) => {
  const { user, refreshUser, updateUserBalance } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('STRIPE_CARD');
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('50');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');

  const methods: {
    id: PaymentMethod;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'STRIPE_CARD',
      label: 'Credit / Debit Card (USD)',
      sublabel: 'Visa, MasterCard, Amex via Stripe',
      icon: <CreditCard className="w-5 h-5 text-blue-500" />,
      color: 'text-blue-500',
    },
    {
      id: 'CRYPTO_USDT',
      label: 'Crypto USDT (TRC20 / BEP20)',
      sublabel: '1 USDT = $1.00 USD (Zero Network Fee)',
      icon: <Coins className="w-5 h-5 text-emerald-500" />,
      color: 'text-emerald-500',
    },
    {
      id: 'PAYPAL',
      label: 'PayPal Express (USD)',
      sublabel: 'Instant PayPal balance & checkout',
      icon: <DollarSign className="w-5 h-5 text-indigo-500" />,
      color: 'text-indigo-500',
    },
    {
      id: 'BANK_WIRE',
      label: 'USD Bank Wire / ACH',
      sublabel: 'Direct wire transfer to company escrow',
      icon: <Building2 className="w-5 h-5 text-slate-700" />,
      color: 'text-slate-700',
    },
  ];

  const presets = [10, 25, 50, 100, 250, 500, 1000];

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setCustomAmount(String(val));
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomAmount(val);
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
  };

  const handleCreateOrder = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }
    if (amount < 10 || amount > 25000) {
      alert('Recharge amount must be between $10.00 and $25,000.00 USD');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createPaymentOrder({
        userId: user.id,
        amount,
        method: paymentMethod,
      });

      if (res.success) {
        setPaymentOrder(res.order);
        setVerificationToken(res.verificationToken);
        setShowPaymentModal(true);
      } else {
        alert('Failed to initiate payment order. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndVerify = async () => {
    if (!paymentOrder) return;
    setVerifying(true);
    try {
      const res = await api.verifyPayment({
        orderId: paymentOrder.id,
        verificationToken,
      });

      if (res.success) {
        updateUserBalance(res.newBalance);
        refreshUser();
        setSuccess(true);
      } else {
        alert(res.message || 'Payment verification failed');
      }
    } catch (err: any) {
      alert(err.message || 'Payment verification error');
    } finally {
      setVerifying(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="recharge-page" className="min-h-screen w-full bg-[#F6F7FB] pb-20 flex flex-col">
      <TopHeader
        variant="gold"
        showBack={true}
        onBack={() => onNavigate('wallet')}
        title="Recharge USD Balance"
        rightAction="history"
        onRightAction={() => onNavigate('wallet')}
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* User Balance Overview */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Available USD Balance
            </span>
            <div className="text-2xl font-black text-amber-400 mt-0.5 tracking-tight font-mono">
              {formatUsd(user ? user.balance : 0)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-amber-500/30">
              100% USD Primary
            </span>
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Select USD Payment Channel
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              PCI-DSS Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {methods.map((m) => {
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex items-center p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#FA3534] bg-red-50/40 shadow-sm ring-1 ring-[#FA3534]/30'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-50 mr-3">{m.icon}</div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-800">{m.label}</div>
                    <div className="text-[10px] text-slate-500">{m.sublabel}</div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-[#FA3534] bg-[#FA3534]' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharge Amount Presets */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            2. Choose Deposit Amount (USD)
          </h3>

          <div className="grid grid-cols-4 gap-2">
            {presets.map((p) => {
              const isSelected = amount === p;
              return (
                <button
                  key={p}
                  onClick={() => handleAmountSelect(p)}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition-all font-mono ${
                    isSelected
                      ? 'bg-[#FA3534] text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  ${p}
                </button>
              );
            })}
          </div>

          {/* Custom Amount Input */}
          <div className="relative mt-2">
            <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-700 font-mono">
              $
            </span>
            <input
              type="number"
              min="10"
              max="25000"
              value={customAmount}
              onChange={handleCustomChange}
              placeholder="Enter Custom USD Amount"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-16 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FA3534] font-mono"
            />
            <span className="absolute right-3.5 top-3 text-[11px] font-bold text-slate-400">
              USD
            </span>
          </div>

          <p className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Minimum: $10.00 USD</span>
            <span>Maximum: $25,000.00 USD</span>
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleCreateOrder}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FA3534] to-[#E02424] text-white font-bold text-sm shadow-lg shadow-red-500/20 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Proceed to Secure Deposit ({formatUsd(amount)})</span>
            </>
          )}
        </button>
      </div>

      {/* Payment Gateway Checkout Simulation Modal */}
      {showPaymentModal && paymentOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 space-y-5 animate-in slide-in-from-bottom">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Deposit Successful!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatUsd(amount)} USD has been credited directly to your player wallet.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSuccess(false);
                    onNavigate('wallet');
                  }}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm"
                >
                  Return to Wallet
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      SECURE USD CHECKOUT
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Order: {paymentOrder.id}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl text-center">
                  <span className="text-xs text-slate-500 font-medium">Total Payable Amount</span>
                  <div className="text-3xl font-black text-slate-900 font-mono mt-0.5">
                    {formatUsd(amount)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Gateway Ref: {paymentOrder.gatewayReference}
                  </div>
                </div>

                {paymentOrder.method === 'CRYPTO_USDT' ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1 text-emerald-900">
                      <div className="font-bold flex items-center">
                        <Coins className="w-4 h-4 mr-1.5 text-emerald-600" />
                        USDT TRC20 Deposit Address:
                      </div>
                      <div className="font-mono text-[11px] break-all bg-white p-2 rounded-lg border border-emerald-200">
                        {paymentOrder.depositAddress || 'TXd8Hq5ZqY3bQ7M9eK12Lp90vBnM8190'}
                      </div>
                      <button
                        onClick={() =>
                          handleCopy(paymentOrder.depositAddress || 'TXd8Hq5ZqY3bQ7M9eK12Lp90vBnM8190')
                        }
                        className="text-[10px] font-bold text-emerald-700 flex items-center pt-1"
                      >
                        {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        {copied ? 'Address Copied!' : 'Copy Deposit Address'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>Card Simulator (Test Mode)</span>
                        <span className="text-[10px] text-blue-600 font-bold">Stripe Sandbox</span>
                      </div>
                      <div className="font-mono text-xs">{cardNumber}</div>
                      <div className="text-[10px] text-slate-400">Exp: 12/28 · CVC: 789</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleConfirmAndVerify}
                  disabled={verifying}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center space-x-2"
                >
                  {verifying ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorize Payment & Credit ({formatUsd(amount)})</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
