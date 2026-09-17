import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Clock,
  RefreshCw,
  User,
  Filter,
} from 'lucide-react';
import { AuditLogEntry } from '../../types.js';
import { api } from '../../services/api.js';

export const ManagerAuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getManagerAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.managerUid.toLowerCase().includes(s) ||
      log.action.toLowerCase().includes(s) ||
      (log.targetUserUid && log.targetUserUid.toLowerCase().includes(s)) ||
      (log.reason && log.reason.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2.5 text-amber-400" />
            IMMUTABLE SECURITY AUDIT LOGS
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically sealed and indexed manager administrative interventions, payouts, and balance adjustments
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
              placeholder="Search Manager UID, Action, Target..."
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Actions</option>
            <option value="BALANCE_ADJUSTMENT">Balance Adjustment</option>
            <option value="WITHDRAWAL_APPROVED">Withdrawal Approved</option>
            <option value="WITHDRAWAL_COMPLETED">Withdrawal Completed</option>
            <option value="WITHDRAWAL_REJECTED">Withdrawal Rejected</option>
            <option value="DEPOSIT_APPROVED">Deposit Approved</option>
            <option value="USER_SUSPENDED">User Suspended</option>
            <option value="SYSTEM_SETTINGS_UPDATED">Settings Updated</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh Logs"
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
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Manager UID</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Account</th>
                <th className="py-3.5 px-4">Modification (Old → New)</th>
                <th className="py-3.5 px-4">Mandatory Reason</th>
                <th className="py-3.5 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {log.managerUid}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] font-bold text-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {log.targetUserUid ? `UID: ${log.targetUserUid}` : 'System-Wide'}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {log.oldValue !== undefined && log.newValue !== undefined ? (
                        <span>
                          <span className="text-slate-500">{String(log.oldValue).slice(0, 20)}</span>
                          <span className="mx-1 text-slate-600">→</span>
                          <span className="text-emerald-400 font-bold">{String(log.newValue).slice(0, 20)}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-xs">
                      {log.reason || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500">
                      {log.ip || '127.0.0.1'}
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
