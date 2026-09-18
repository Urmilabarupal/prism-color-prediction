import React, { useState } from 'react';
import { Check, Copy, QrCode, ShieldCheck } from 'lucide-react';
import { PageId } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { TopHeader } from '../components/TopHeader.js';
import { formatUsd } from '../utils/money.js';

export const RechargePage: React.FC<{ onNavigate: (page: PageId) => void }> = ({ onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('50');
  const [address] = useState('TNv9k2p8zY4e87M9sX2w1qL3jK5hG8rD4f');
  const [order, setOrder] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const copyAddress = async () => { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const createDeposit = async () => {
    if (!user) return onNavigate('login');
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 10) return setMessage('Minimum deposit is $10 USDT.');
    setLoading(true); setMessage('');
    try { const result = await api.createPaymentOrder({ userId: user.id, amount: value, method: 'CRYPTO_USDT' }); setOrder(result.order); setMessage('Deposit created. Send the exact amount, then verify it server-side.'); }
    catch (error: any) { setMessage(error.message || 'Deposit could not be created.'); } finally { setLoading(false); }
  };
  const verifyDeposit = async () => {
    if (!order) return;
    setLoading(true);
    try { await api.verifyPayment({ orderId: order.id, verificationToken: `vtoken_${order.id}_${order.gatewayReference}` }); await refreshUser(); setMessage('Deposit verified and credited to Funding Wallet.'); }
    catch (error: any) { setMessage(error.message || 'Deposit is still pending verification.'); } finally { setLoading(false); }
  };
  return <div className="min-h-screen bg-[#F6F7FB] pb-20"><TopHeader variant="gold" showBack onBack={() => onNavigate('wallet')} title="Deposit USDT" rightAction="history" onRightAction={() => onNavigate('wallet')} /><main className="p-4 space-y-4">
    <div className="rounded-2xl bg-slate-900 text-white p-5"><div className="text-[11px] uppercase tracking-wider text-slate-400">Server-verified deposit</div><div className="text-2xl font-black mt-1">USD / USDT</div><p className="text-xs text-slate-300 mt-2">Verified funds go directly to your Funding Wallet. Bonus funds remain restricted.</p></div>
    <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3"><h2 className="text-xs font-black uppercase tracking-wider text-slate-800">Deposit address</h2><div className="flex justify-center"><div className="w-28 h-28 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center"><QrCode className="w-20 h-20 text-slate-700" /></div></div><div className="font-mono text-[11px] break-all bg-slate-50 rounded-xl p-3 text-slate-700">{address}</div><button onClick={copyAddress} className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-2">{copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}{copied ? 'Address copied' : 'Copy address'}</button></section>
    <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3"><label className="text-xs font-bold text-slate-700">USDT amount</label><input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="10" step="0.01" className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 font-mono text-sm" /><button onClick={createDeposit} disabled={loading} className="w-full py-3 rounded-xl bg-[#FA3534] text-white text-sm font-bold disabled:opacity-50">{loading ? 'Processing...' : `Create deposit ${formatUsd(Number(amount) || 0)}`}</button>{order && <button onClick={verifyDeposit} disabled={loading} className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50"><ShieldCheck className="w-4 h-4 inline mr-2" />Verify deposit</button>}{message && <p className="text-xs text-slate-600">{message}</p>}</section>
  </main></div>;
};
export default RechargePage;
