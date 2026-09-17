import React, { useEffect, useState } from 'react';
import {
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Gamepad2,
  Trophy,
  TrendingUp,
  Clock,
  RefreshCw,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DashboardStats } from '../../types.js';
import { api } from '../../services/api.js';
import { formatUsd } from '../../utils/money.js';
import { useManager } from '../ManagerContext.js';

export const ManagerDashboardView: React.FC = () => {
  const { setCurrentPage } = useManager();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getManagerDashboardStats(timeFilter);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000); // 3s real-time live sync for active rounds & bets
    return () => clearInterval(interval);
  }, [timeFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            FINANCIAL & GAMEPLAY DASHBOARD
            <span className="ml-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              USD PRIMARY
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-dimensional game wagering, ledger metrics, and user analytics
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
            {(['all', 'today', 'yesterday', '7days', '30days'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all capitalize ${
                  timeFilter === filter
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter === '7days' ? '7 Days' : filter === '30days' ? '30 Days' : filter}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Players</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats ? stats.totalUsers.toLocaleString() : '—'}
          </div>
          <div className="text-xs text-emerald-400 font-medium mt-1.5 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            {stats ? `${stats.activeUsers} active accounts` : 'Loading...'}
          </div>
        </div>

        {/* Total Deposits */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Deposits (USD)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats ? formatUsd(stats.totalDeposits) : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Pending:</span>
            <span
              onClick={() => setCurrentPage('deposits')}
              className={`cursor-pointer font-bold ${
                stats && stats.pendingDeposits > 0
                  ? 'text-amber-400 underline underline-offset-2'
                  : 'text-slate-400'
              }`}
            >
              {stats ? formatUsd(stats.pendingDeposits) : '—'}
            </span>
          </div>
        </div>

        {/* Total Withdrawals */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Withdrawals (USD)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-300">
            {stats ? formatUsd(stats.totalWithdrawals) : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Pending Review:</span>
            <span
              onClick={() => setCurrentPage('withdrawals')}
              className={`cursor-pointer font-bold ${
                stats && stats.pendingWithdrawals > 0
                  ? 'text-rose-400 underline underline-offset-2 animate-pulse'
                  : 'text-slate-400'
              }`}
            >
              {stats ? formatUsd(stats.pendingWithdrawals) : '—'}
            </span>
          </div>
        </div>

        {/* Gross Gaming Revenue (GGR) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net GGR Revenue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black ${
              stats && stats.grossGamingRevenue >= 0 ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {stats ? formatUsd(stats.grossGamingRevenue) : '—'}
          </div>
          <div className="text-xs text-slate-400 mt-1.5 flex items-center justify-between">
            <span>Total Bets:</span>
            <span className="font-semibold text-slate-300">{stats ? formatUsd(stats.totalBets) : '—'}</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wagering Volume Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-amber-400" />
            Game Wager & Payout Ratio
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">Cumulative Player Wagers:</span>
              <span className="font-bold text-white">{stats ? formatUsd(stats.totalBets) : '—'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">Cumulative Player Winnings:</span>
              <span className="font-bold text-emerald-400">{stats ? formatUsd(stats.totalWinningAmount) : '—'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/60 rounded-xl">
              <span className="text-slate-400">House Edge / Retained Margin:</span>
              <span className="font-bold text-amber-400">
                {stats && stats.totalBets > 0
                  ? `${(((stats.totalBets - stats.totalWinningAmount) / stats.totalBets) * 100).toFixed(2)}%`
                  : '2.00%'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Active Game Monitor Header */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
              <Gamepad2 className="w-4 h-4 mr-2 text-emerald-400" />
              Live Active Rounds & Real-time Wagering
            </h2>
            <button
              onClick={() => setCurrentPage('games')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              Full Monitor →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {stats?.activeGameRounds.map((round) => (
              <div
                key={round.mode}
                className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white uppercase flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping" />
                    Win Go {round.mode}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      round.isBettingOpen
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {round.isBettingOpen ? 'BETTING OPEN' : 'LOCKED (5S)'}
                  </span>
                </div>

                <div className="my-2.5 flex items-baseline justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">Period: {round.periodId}</span>
                  <span className="text-lg font-black font-mono text-amber-400">
                    {String(Math.floor(round.timeLeft / 60)).padStart(2, '0')}:
                    {String(round.timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Live Bets: {round.totalBetsCount}</span>
                  <span className="font-bold text-emerald-400">{formatUsd(round.totalBetVolumeUsd)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
