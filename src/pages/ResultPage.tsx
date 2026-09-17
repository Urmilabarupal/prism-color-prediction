import React, { useState } from 'react';
import { GameMode, PageId } from '../types.js';
import { useGame } from '../context/GameContext.js';
import { TopHeader } from '../components/TopHeader.js';

interface ResultPageProps {
  onNavigate: (page: PageId) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({ onNavigate }) => {
  const { mode, setMode, history, myBets } = useGame();
  const [subTab, setSubTab] = useState<'gameRecord' | 'myRecord' | 'chart'>('gameRecord');

  return (
    <div id="result-page" className="min-h-screen w-full bg-[#F6F7FB] pb-20 flex flex-col">
      <TopHeader
        variant="red"
        showBack={true}
        onBack={() => onNavigate('home')}
        title="Result"
      />

      {/* Mode switch */}
      <div className="bg-[#FA3534] px-3 pb-3">
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/15 rounded-xl">
          {(
            [
              { id: '1min', label: '1 Min' },
              { id: '3min', label: '3 Min' },
              { id: '5min', label: '5 Min' },
              { id: '10min', label: '10 Min' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                mode === t.id
                  ? 'bg-white text-[#FA3534] shadow-sm font-black'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Results Container matching Screen 5 */}
      <div className="flex-1 px-4 py-3 space-y-2.5">
        {history.map((item) => {
          const isGreen = item.colors.includes('green');
          const isRed = item.colors.includes('red');
          const isViolet = item.colors.includes('violet');

          // Check if user had a bet in this period
          const userBet = myBets.find((b) => b.periodId === item.periodId);

          return (
            <div
              key={item.periodId}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between"
            >
              {/* Left Details */}
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Period</span>
                <span className="font-points font-black text-sm text-slate-800 tracking-wider">
                  {item.periodId}
                </span>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400">Big Small</span>
                  <span
                    className={`font-black text-xs uppercase ${
                      item.bigSmall === 'big' ? 'text-amber-500' : 'text-blue-500'
                    }`}
                  >
                    {item.bigSmall}
                  </span>
                </div>

                {userBet && (
                  <div className="mt-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        userBet.status === 'WON'
                          ? 'bg-green-100 text-green-700'
                          : userBet.status === 'LOST'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      Your Bet: {userBet.status} (
                      <span className="font-mono">
                        {userBet.status === 'WON'
                          ? `+$${userBet.payout.toFixed(2)} USD`
                          : `-$${userBet.amount.toFixed(2)} USD`}
                      </span>
                      )
                    </span>
                  </div>
                )}
              </div>

              {/* Right Details: Number & Color Dots */}
              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] text-slate-400 block font-medium">Number</span>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-base shadow-sm mt-0.5 font-points ${
                    item.number === 0
                      ? 'bg-gradient-to-r from-[#FA3534] via-[#FA3534] to-[#8B5CF6]'
                      : item.number === 5
                      ? 'bg-gradient-to-r from-[#10B981] via-[#10B981] to-[#8B5CF6]'
                      : isRed
                      ? 'bg-[#FA3534]'
                      : 'bg-[#10B981]'
                  }`}
                >
                  {item.number}
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Color</span>
                  <div className="flex items-center gap-1">
                    {isGreen && <span className="w-3 h-3 rounded-full bg-[#10B981]" />}
                    {isViolet && <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" />}
                    {isRed && <span className="w-3 h-3 rounded-full bg-[#FA3534]" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom 3 Tabs matching reference */}
      <div className="sticky bottom-14 left-0 right-0 px-4 py-2 bg-[#F6F7FB]">
        <div className="flex bg-white rounded-xl shadow-md border border-slate-100 p-1">
          <button
            onClick={() => onNavigate('game')}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-[#FA3534] text-white text-center shadow-xs"
          >
            Game Record
          </button>
          <button
            onClick={() => onNavigate('game')}
            className="flex-1 py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 text-center"
          >
            My Record
          </button>
          <button
            onClick={() => onNavigate('game')}
            className="flex-1 py-2 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 text-center"
          >
            Chart
          </button>
        </div>
      </div>
    </div>
  );
};
