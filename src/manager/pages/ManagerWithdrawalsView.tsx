import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  PlayCircle,
  CheckCheck,
  RefreshCw,
  History,
  ShieldCheck,
  X,
} from 'lucide-react';
import { WithdrawalRequest } from '../../types.js';
import { api } from '../../services/api.js';
import { formatUsd } from '../../utils/money.js';
import { useManager } from '../ManagerContext.js';

export const ManagerWithdrawalsView: React.FC = () => {
  const { hasPermission, showToast } = useManager();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // History / Destination Details Modal
  const [inspectWd, setInspectWd] = useState<WithdrawalRequest | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const list = await api.getManagerWithdrawals(statusFilter);
      setWithdrawals(list);
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const handleAction = async (
    id: string,
    action: 'APPROVE' | 'PROCESS' | 'COMPLETE' | 'REJECT'
  ) => {
    if (!hasPermission('withdrawals.manage')) {
      showToast('Permission denied: Missing withdrawals.manage privilege');
      return;
    }

    let reason = '';
    if (action === 'REJECT') {
      const inputReason = prompt(
        'Mandatory Rejection Reason (Funds will be refunded back to the user balance):',
        'Incorrect beneficiary bank details / KYC document required'
      );
      if (!inputReason || inputReason.trim().length < 3) {
        showToast('Rejection cancelled: Reason is mandatory');
        return;
      }
      reason = inputReason;
    } else {
      const confirmAction = confirm(`Are you sure you want to change this withdrawal to ${action}?`);
      if (!confirmAction) return;
      reason = `Manager marked as ${action}`;
    }

    try {
      setActioningId(id);
      const res = await api.actOnWithdrawal(id, action, reason);
      showToast(res.message);
      fetchWithdrawals();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update withdrawal');
    } finally {
      setActioningId(null);
    }
  };

  const filtered = withdrawals.filter((w) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      w.id.toLowerCase().includes(s) ||
      w.userId.toLowerCase().includes(s) ||
      (w.destination?.accountNumber && w.destination.accountNumber.includes(s)) ||
      (w.destination?.walletAddress && w.destination.walletAddress.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            <ArrowUpRight className="w-5 h-5 mr-2.5 text-purple-400" />
            WITHDRAWAL REQUESTS & PAYOUTS (USD)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Review user payouts, verify beneficiary destinations, approve batches, and audit disbursement records
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, UID, Account..."
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48 sm:w-60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={fetchWithdrawals}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">Withdrawal ID / Date</th>
                <th className="py-3.5 px-4">User UID</th>
                <th className="py-3.5 px-4 text-right">Amount (USD)</th>
                <th className="py-3.5 px-4 text-right">Fee (USD)</th>
                <th className="py-3.5 px-4 text-right">Net Payout</th>
                <th className="py-3.5 px-4">Method & Destination</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading withdrawals queue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((wd) => (
                  <tr key={wd.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white flex items-center">
                        {wd.id}
                        <button
                          onClick={() => setInspectWd(wd)}
                          className="ml-2 text-slate-500 hover:text-amber-400"
                          title="View Audit Log & Bank Details"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(wd.requestedAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                      {wd.userId}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {formatUsd(wd.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {formatUsd(wd.fee || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-black text-purple-300">
                      {formatUsd(wd.netAmount || wd.amount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{wd.method.replace('_', ' ')}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                        {wd.destination?.accountNumber
                          ? `A/C: ${wd.destination.accountNumber}`
                          : wd.destination?.walletAddress
                          ? `Wallet: ${wd.destination.walletAddress.slice(0, 10)}...`
                          : wd.destination?.paypalEmail || 'Standard Wire'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          wd.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : wd.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                            : wd.status === 'APPROVED' || wd.status === 'PROCESSING'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {wd.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {hasPermission('withdrawals.manage') ? (
                        <div className="flex items-center justify-center space-x-1.5">
                          {wd.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleAction(wd.id, 'APPROVE')}
                                disabled={actioningId === wd.id}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-[11px]"
                                title="Approve Request"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleAction(wd.id, 'REJECT')}
                                disabled={actioningId === wd.id}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors text-[11px]"
                                title="Reject & Refund Funds"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {wd.status === 'APPROVED' && (
                            <button
                              onClick={() => handleAction(wd.id, 'PROCESS')}
                              disabled={actioningId === wd.id}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors text-[11px]"
                              title="Mark Processing"
                            >
                              Process
                            </button>
                          )}

                          {wd.status === 'PROCESSING' && (
                            <button
                              onClick={() => handleAction(wd.id, 'COMPLETE')}
                              disabled={actioningId === wd.id}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors text-[11px] flex items-center space-x-1"
                              title="Mark Disbursed & Completed"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>Disburse</span>
                            </button>
                          )}

                          {(wd.status === 'COMPLETED' || wd.status === 'REJECTED') && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              {wd.managerUid || 'Closed'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Withdrawal Details Modal */}
      {inspectWd && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center">
                <ShieldCheck className="w-5 h-5 text-amber-400 mr-2" />
                Withdrawal Audit & Destination: {inspectWd.id}
              </h2>
              <button onClick={() => setInspectWd(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400">Total Amount:</span>
                <div className="text-sm font-bold text-white mt-0.5">{formatUsd(inspectWd.amount)}</div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl">
                <span className="text-slate-400">Status:</span>
                <div className="text-sm font-bold text-amber-400 mt-0.5">{inspectWd.status}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs space-y-2">
              <div className="font-bold text-white uppercase text-[11px]">Destination Details</div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block">Account / Holder:</span>
                  {inspectWd.destination?.accountName || '—'}
                </div>
                <div>
                  <span className="text-slate-500 block">Account Number:</span>
                  {inspectWd.destination?.accountNumber || '—'}
                </div>
                <div>
                  <span className="text-slate-500 block">Bank / Provider:</span>
                  {inspectWd.destination?.bankName || '—'}
                </div>
                <div>
                  <span className="text-slate-500 block">Routing / SWIFT (USD):</span>
                  {inspectWd.destination?.routingNumber || '—'}
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">Crypto Wallet Address:</span>
                  <span className="font-mono text-[11px] text-amber-300 break-all">
                    {inspectWd.destination?.walletAddress || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-white uppercase text-[11px] mb-2">Manager Action History</div>
              <div className="max-h-40 overflow-y-auto space-y-2 text-xs">
                {inspectWd.actionHistory.map((act, i) => (
                  <div key={i} className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/40">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-amber-400 font-bold">{act.action}</span>
                      <span className="text-slate-500">{new Date(act.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-300 mt-1">
                      Manager: <span className="font-bold text-white">{act.managerUid}</span> · Reason:{' '}
                      <span className="text-slate-400">{act.reason || 'None specified'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
