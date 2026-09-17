import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { User, BetRecord, WalletTransaction, WithdrawalRequest, PaymentOrder } from '../../types.js';
import { api } from '../../services/api.js';
import { formatUsd } from '../../utils/money.js';
import { useManager } from '../ManagerContext.js';

export const ManagerUsersView: React.FC = () => {
  const { hasPermission, showToast } = useManager();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Inspect Modal state
  const [selectedUser, setSelectedUser] = useState<{
    user: User;
    bets: BetRecord[];
    transactions: WalletTransaction[];
    withdrawals: WithdrawalRequest[];
    deposits: PaymentOrder[];
  } | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Adjust Balance Modal state
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // Suspend Modal state
  const [suspendingUser, setSuspendingUser] = useState<User | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const list = await api.getManagerUsers(search, statusFilter);
      setUsers(list);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleInspect = async (uid: string) => {
    try {
      setInspectLoading(true);
      const data = await api.getManagerUserDetail(uid);
      setSelectedUser(data);
    } catch (err: any) {
      showToast(err?.message || 'Failed to inspect user');
    } finally {
      setInspectLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!suspendingUser) return;
    const newStatus = suspendingUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.updateUserStatus(suspendingUser.id, newStatus, suspendReason || 'Manager action');
      showToast(`User ${suspendingUser.id} is now ${newStatus}`);
      setSuspendingUser(null);
      setSuspendReason('');
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update user status');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num) || num <= 0) {
      showToast('Please enter a valid positive adjustment amount');
      return;
    }
    if (!adjustReason || adjustReason.trim().length < 5) {
      showToast('Mandatory reason (min 5 characters) required for audit logging');
      return;
    }

    setAdjustSubmitting(true);
    try {
      const res = await api.adjustUserBalance(adjustingUser.id, {
        amount: num,
        type: adjustType,
        reason: adjustReason,
      });
      showToast(res.message);
      setAdjustingUser(null);
      setAdjustAmount('');
      setAdjustReason('');
      fetchUsers();
    } catch (err: any) {
      showToast(err?.message || 'Failed to adjust balance');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            <Users className="w-5 h-5 mr-2.5 text-blue-400" />
            USER MANAGEMENT
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor player account balances, wagers, deposits, withdrawals, and security statuses
          </p>
        </div>

        {/* Search & Filter bar */}
        <div className="flex items-center space-x-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search UID, Name, Email..."
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
              <tr>
                <th className="py-3.5 px-4">User UID / Info</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 text-right">Available USD</th>
                <th className="py-3.5 px-4 text-right">Locked USD</th>
                <th className="py-3.5 px-4 text-right">Total Deposits</th>
                <th className="py-3.5 px-4 text-right">Total Withdrawals</th>
                <th className="py-3.5 px-4 text-right">Total Bets</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                          alt=""
                          className="w-8 h-8 rounded-full border border-slate-700 object-cover"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center">
                            {u.username}
                            {u.managerUid && (
                              <span className="ml-2 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                {u.managerUid}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">UID: {u.id}</div>
                          <div className="text-[10px] text-slate-500">{u.email || u.phone || 'No Contact'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          u.role === 'super_manager'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : u.role === 'manager'
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {formatUsd(u.balance)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {u.lockedBalance > 0 ? (
                        <span className="text-amber-400 font-bold">{formatUsd(u.lockedBalance)}</span>
                      ) : (
                        formatUsd(0)
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-medium">
                      {formatUsd(u.totalDeposited || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-purple-300 font-medium">
                      {formatUsd(u.totalWithdrawn || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {formatUsd(u.totalBets || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleInspect(u.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-white transition-colors"
                          title="Inspect User Details & Ledger"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {hasPermission('users.manage') && u.role === 'user' && (
                          <>
                            <button
                              onClick={() => setAdjustingUser(u)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white transition-colors"
                              title="Controlled Balance Adjustment"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSuspendingUser(u)}
                              className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors ${
                                u.status === 'ACTIVE'
                                  ? 'text-rose-400 hover:text-white'
                                  : 'text-emerald-400 hover:text-white'
                              }`}
                              title={u.status === 'ACTIVE' ? 'Suspend User' : 'Unsuspend User'}
                            >
                              {u.status === 'ACTIVE' ? (
                                <Ban className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedUser.user.avatar}
                  alt=""
                  className="w-12 h-12 rounded-full border border-slate-700"
                />
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center">
                    {selectedUser.user.username}
                    <span className="ml-2 font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      UID: {selectedUser.user.id}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Registered: {new Date(selectedUser.user.createdAt).toLocaleDateString()} · Status:{' '}
                    <span className="text-emerald-400 font-bold">{selectedUser.user.status}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wallet Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400">Available USD:</span>
                <div className="text-base font-bold text-white mt-1">
                  {formatUsd(selectedUser.user.balance)}
                </div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400">Locked In Withdrawals:</span>
                <div className="text-base font-bold text-amber-400 mt-1">
                  {formatUsd(selectedUser.user.lockedBalance || 0)}
                </div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400">Total Deposited:</span>
                <div className="text-base font-bold text-emerald-400 mt-1">
                  {formatUsd(selectedUser.user.totalDeposited || 0)}
                </div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400">Total Winnings:</span>
                <div className="text-base font-bold text-purple-400 mt-1">
                  {formatUsd(selectedUser.user.totalWinnings || 0)}
                </div>
              </div>
            </div>

            {/* Recent Ledger Transactions */}
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
                Recent Ledger Transactions
              </h3>
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 divide-y divide-slate-800/60 text-xs">
                {selectedUser.transactions.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No transaction records</div>
                ) : (
                  selectedUser.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{tx.description}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: {tx.id} · {new Date(tx.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400">
                          {formatUsd(tx.amount)}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Bets */}
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">
                Recent Game Bets
              </h3>
              <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 divide-y divide-slate-800/60 text-xs">
                {selectedUser.bets.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">No bets placed yet</div>
                ) : (
                  selectedUser.bets.map((bet) => (
                    <div key={bet.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">
                          Win Go {bet.mode} · Period {bet.periodId}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Selection: {String(bet.selection).toUpperCase()} ({bet.type})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-white">Wager: {formatUsd(bet.amount)}</div>
                        <div
                          className={`font-mono text-[11px] font-bold ${
                            bet.status === 'WON'
                              ? 'text-emerald-400'
                              : bet.status === 'LOST'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {bet.status === 'WON' ? `WON +${formatUsd(bet.payout)}` : bet.status}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center">
                <DollarSign className="w-5 h-5 text-amber-400 mr-2" />
                Controlled Balance Adjustment
              </h2>
              <button onClick={() => setAdjustingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-800/60 rounded-xl text-xs space-y-1">
              <div className="text-slate-400">
                User: <span className="text-white font-bold">{adjustingUser.username}</span> (UID: {adjustingUser.id})
              </div>
              <div className="text-slate-400">
                Current Balance: <span className="text-emerald-400 font-bold">{formatUsd(adjustingUser.balance)}</span>
              </div>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('CREDIT')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                    adjustType === 'CREDIT'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" /> Credit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('DEBIT')}
                  className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                    adjustType === 'DEBIT'
                      ? 'bg-rose-500 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <MinusCircle className="w-4 h-4 mr-1.5" /> Debit (-)
                </button>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Adjustment Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 50.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Mandatory Audit Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Explain why this balance adjustment is being executed (e.g. Compensation for resolved bank deposit ticket #8921)"
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 flex items-start">
                <ShieldAlert className="w-4 h-4 text-amber-400 mr-2 flex-shrink-0 mt-0.5" />
                This action is permanently logged to the Manager Audit Log with your Manager UID and timestamp.
              </div>

              <button
                type="submit"
                disabled={adjustSubmitting}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all"
              >
                {adjustSubmitting ? 'Recording Adjustment...' : 'Confirm & Execute Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Suspend / Unsuspend Confirmation Modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-400 mr-2" />
                Confirm Status Modification
              </h2>
              <button onClick={() => setSuspendingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to change user{' '}
              <span className="font-bold text-white">{suspendingUser.username}</span> (UID: {suspendingUser.id}) to{' '}
              <span className="font-bold text-amber-400">
                {suspendingUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}
              </span>
              ?
            </p>

            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Reason for Action</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Multi-accounting suspicion / KYC verification pending"
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`flex-1 py-2 font-bold rounded-xl text-xs ${
                  suspendingUser.status === 'ACTIVE'
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                }`}
              >
                Confirm {suspendingUser.status === 'ACTIVE' ? 'Suspend' : 'Unsuspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
