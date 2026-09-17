import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { formatUsd } from '../../utils/money.js';

export const ManagerReportsView: React.FC = () => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await api.getManagerFinancialReport();
      setReport(data);
    } catch (err) {
      console.error('Failed to load financial report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            <BarChart3 className="w-5 h-5 mr-2.5 text-blue-400" />
            FINANCIAL AUDIT & GGR REVENUE REPORT
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Consolidated platform cashflow, wagering margin, gross gaming revenue, and player payout statistics
          </p>
        </div>

        <button
          onClick={fetchReport}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          title="Refresh Report"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Net Cashflow */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>NET DEPOSIT CASHFLOW</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {report ? formatUsd(report.netCashflow) : '—'}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <span>Deposits: <strong className="text-emerald-400">{report ? formatUsd(report.totalDeposits) : '—'}</strong></span>
            <span>Withdrawals: <strong className="text-purple-300">{report ? formatUsd(report.totalWithdrawals) : '—'}</strong></span>
          </div>
        </div>

        {/* Gross Gaming Revenue (GGR) */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>GROSS GAMING REVENUE (GGR)</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">
            {report ? formatUsd(report.grossGamingRevenue) : '—'}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <span>Wagers: <strong className="text-white">{report ? formatUsd(report.totalWagersUsd) : '—'}</strong></span>
            <span>Payouts: <strong className="text-emerald-400">{report ? formatUsd(report.totalPayoutsUsd) : '—'}</strong></span>
          </div>
        </div>

        {/* RTP & Retention Ratio */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
            <span>RETURN TO PLAYER (RTP)</span>
            <PieChart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-blue-400">
            {report ? `${report.returnToPlayerPercent}%` : '—'}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
            <span>Target House Commission: <strong className="text-amber-400">2.00%</strong></span>
            <span>Risk Index: <strong className="text-emerald-400">Low (Stable)</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
