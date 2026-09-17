import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { PaymentOrder } from '../../types.js';
import { api } from '../../services/api.js';
import { formatUsd } from '../../utils/money.js';
import { useManager } from '../ManagerContext.js';

export const ManagerDepositsView: React.FC = () => {
  const { hasPermission, showToast } = useManager();
  const [deposits, setDeposits] = useState<PaymentOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const list = await api.getManagerDeposits(statusFilter);
      setDeposits(list);
    } catch (err) {
      console.error('Failed to load deposits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter]);

  const handleApprove = async (orderId: string) => {
    if (!hasPermission('deposits.manage')) {
      showToast('Permission denied: Missing deposits.manage privilege');
      return;
    }
    const reason = prompt('Enter deposit approval verification note (optional):', 'Manual banking proof verified by Manager');
    if (reason === null) return;

    try {
      setApprovingId(orderId);
      const res = await api.approveDeposit(orderId, reason);
      showToast(res.message);
      fetchDeposits();
    } catch (err: any) {
      showToast(err?.message || 'Failed to approve deposit');
    } finally {
      setApprovingId(null);
    }
  };

  const filteredDeposits = deposits.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.id.toLowerCase().includes(s) ||
      d.userId.toLowerCase().includes(s) ||
      (d.gatewayReference && d.gatewayReference.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            <ArrowDownLeft className="w-5 h-5 mr-2.5 text-emerald-400" />
            DEPOSIT & RECHARGE ORDERS (USD)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor incoming USD payments, verify payment gateways, and manually review pending orders
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
              placeholder="Search Order ID, UID..."
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
            <option value="COMPLETED">Completed Only</option>
            <option value="FAILED">Failed</option>
          </select>

          <button
            onClick={fetchDeposits}
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
                <th className="py-3.5 px-4">Order ID / Date</th>
                <th className="py-3.5 px-4">User UID</th>
                <th className="py-3.5 px-4 text-right">Amount (USD)</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Gateway Reference</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading deposits...
                  </td>
                </tr>
              ) : filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No deposit orders found.
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white">{order.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                      {order.userId}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatUsd(order.amount)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300">
                        {order.method.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {order.gatewayReference || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : order.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {order.status === 'PENDING' && hasPermission('deposits.manage') ? (
                        <button
                          onClick={() => handleApprove(order.id)}
                          disabled={approvingId === order.id}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors text-[11px] flex items-center justify-center mx-auto space-x-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Approve & Credit</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          {order.verifiedBy ? `Verified: ${order.verifiedBy}` : 'Completed'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
