import React, { useEffect, useState } from 'react';
import {
  Gamepad2,
  Clock,
  RefreshCw,
  Trophy,
  Filter,
  CheckCircle2,
  Flame,
  PieChart,
  BarChart2,
} from 'lucide-react';
import { GameMode, RoundResult } from '../../types.js';
import { api } from '../../services/api.js';
import { formatUsd } from '../../utils/money.js';

export const ManagerGamesView: React.FC = () => {
  const [activeRounds, setActiveRounds] = useState<any[]>([]);
  const [selectedMode, setSelectedMode] = useState<GameMode>('1min');
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGameData = async () => {
    try {
      const [rounds, hist] = await Promise.all([
        api.getManagerActiveGames(),
        api.getGameHistory(selectedMode),
      ]);
      setActiveRounds(rounds);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to load game data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameData();
    const interval = setInterval(fetchGameData, 2000); // 2s live refresh for countdown
    return () => clearInterval(interval);
  }, [selectedMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center">
            <Gamepad2 className="w-5 h-5 mr-2.5 text-emerald-400" />
            GAME ENGINE & LIVE ROUND MONITOR
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time Win Go betting pools, color and size exposures, and verifiable round results
          </p>
        </div>

        {/* Game Mode Switcher */}
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
          {(['1min', '3min', '5min', '10min'] as GameMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all uppercase ${
                selectedMode === mode
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Win Go {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Active Game Pools Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeRounds.map((r) => {
          const isSelected = r.mode === selectedMode;
          return (
            <div
              key={r.mode}
              onClick={() => setSelectedMode(r.mode)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-850 border-amber-500/80 ring-1 ring-amber-500/50 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-white uppercase text-sm flex items-center">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mr-2 ${
                      r.isBettingOpen ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
                    }`}
                  />
                  Win Go {r.mode}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    r.isBettingOpen
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {r.isBettingOpen ? 'OPEN' : 'LOCKED'}
                </span>
              </div>

              <div className="my-3 flex items-baseline justify-between">
                <span className="text-xs font-mono text-slate-400">#{r.periodId}</span>
                <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                  {String(Math.floor(r.timeLeft / 60)).padStart(2, '0')}:
                  {String(r.timeLeft % 60).padStart(2, '0')}
                </span>
              </div>

              {/* Pool Volume */}
              <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Wager Volume:</span>
                  <span className="font-bold text-emerald-400">{formatUsd(r.totalBetVolumeUsd)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Active Bets:</span>
                  <span className="font-semibold text-white">{r.totalBetsCount} bets</span>
                </div>
              </div>

              {/* Color & Size breakdown meters */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
                    G: {formatUsd(r.colorBreakdown?.green || 0)}
                  </span>
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-1" />
                    V: {formatUsd(r.colorBreakdown?.violet || 0)}
                  </span>
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1" />
                    R: {formatUsd(r.colorBreakdown?.red || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Big: {formatUsd(r.sizeBreakdown?.big || 0)}</span>
                  <span>Small: {formatUsd(r.sizeBreakdown?.small || 0)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Settled Rounds Table for Selected Mode */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-amber-400" />
            Settled Rounds Archive: Win Go {selectedMode}
          </h2>
          <span className="text-xs text-slate-400">Immutable Hash & Result Record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
              <tr>
                <th className="py-3 px-4">Period ID</th>
                <th className="py-3 px-4 text-center">Winning Number</th>
                <th className="py-3 px-4 text-center">Color Combination</th>
                <th className="py-3 px-4 text-center">Size</th>
                <th className="py-3 px-4 text-right">Settled Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No round history available yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.periodId} className="hover:bg-slate-800/40 transition-colors font-mono">
                    <td className="py-3 px-4 text-white font-bold">{h.periodId}</td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-block w-7 h-7 leading-7 text-center rounded-full bg-slate-800 border border-slate-700 font-bold text-sm text-white">
                        {h.number}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {h.colors.map((c) => (
                          <span
                            key={c}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              c === 'green'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : c === 'red'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          h.size === 'big'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {h.size}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(h.timestamp).toLocaleTimeString()}
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
