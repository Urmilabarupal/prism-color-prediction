import React, { useEffect, useState } from 'react';
import {
  ListOrdered,
  Search,
  Filter,
  Trophy,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { BetRecord, GameMode } from '../../types.js';
import { api } from '../../services/api.js';
import { formatUsd } from '../../utils/money.js';

export const ManagerBetsView: React.FC = () => {
  const [bets, setBets] = useState<BetRecord[]>([]);
  const [modeFilter, setModeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBets = async () => {
    try {
      setLoading(true);
      const list = await api.getManagerBets({
        mode: (modeFilter as GameMode) || undefined,
        status: statusFilter || undefined,
      });
      setBets(list);
    } catch (err) {
      console.error('Failed to load bets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBets();
  }, [modeFilter, statusFilter]);

  const filteredBets = bets.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      b.id.toLowerCase().includes(s) ||
      b.userId.toLowerCase().includes(s) ||
      b.periodId.includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            <ListOrdered className="w-5 h-5 mr-2.5 text-amber-400" />
            REAL-TIME BET RECORDS & WAGERS (USD)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full ledger of player game wagers, selection coefficients, payout calculations, and win/loss resolution
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
              placeholder="Search Bet ID, UID, Period..."
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Modes</option>
            <option value="1min">Win Go 1m</option>
            <option value="3min">Win Go 3m</option>
            <option value="5min">Win Go 5m</option>
            <option value="10min">Win Go 10m</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
          </select>

          <button
            onClick={fetchBets}
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
                <th className="py-3.5 px-4">Bet ID / Date</th>
                <th className="py-3.5 px-4">Period ID & Mode</th>
                <th className="py-3.5 px-4">User UID</th>
                <th className="py-3.5 px-4">Type & Selection</th>
                <th className="py-3.5 px-4 text-right">Wager (USD)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Payout (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading bet records...
                  </td>
                </tr>
              ) : filteredBets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No bet records found.
                  </td>
                </tr>
              ) : (
                filteredBets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white">{bet.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center mt-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(bet.createdAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-200">#{bet.periodId}</div>
                      <span className="text-[10px] text-amber-400 font-semibold uppercase">
                        Win Go {bet.mode}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-300">
                      {bet.userId}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white capitalize">
                        {String(bet.selection)}
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-medium">
                        {bet.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {formatUsd(bet.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          bet.status === 'WON'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : bet.status === 'LOST'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {bet.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      {bet.status === 'WON' ? (
                        <span className="text-emerald-400">+{formatUsd(bet.payout)}</span>
                      ) : bet.status === 'LOST' ? (
                        <span className="text-rose-400">$0.00</span>
                      ) : (
                        <span className="text-slate-500">Pending</span>
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
