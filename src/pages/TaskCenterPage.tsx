import React, { useState } from 'react';
import { CheckSquare, Gift, Check, Award } from 'lucide-react';
import { PageId } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { TopHeader } from '../components/TopHeader.js';

interface TaskCenterPageProps {
  onNavigate: (page: PageId) => void;
}

export const TaskCenterPage: React.FC<TaskCenterPageProps> = ({ onNavigate }) => {
  const { user, updateUserBalance } = useAuth();
  const [claimedTasks, setClaimedTasks] = useState<number[]>([]);

  const tasks = [
    {
      id: 1,
      title: 'Daily Login Reward',
      reward: 1,
      description: 'Check in every day to claim bonus rewards',
      completed: true,
    },
    {
      id: 2,
      title: 'First Recharge of the Day',
      reward: 5,
      description: 'Deposit $25.00 or more today',
      completed: false,
    },
    {
      id: 3,
      title: 'Win Go 10 Rounds Challenge',
      reward: 2,
      description: 'Place 10 bets in any Win Go room',
      completed: true,
    },
    {
      id: 4,
      title: 'Invite 1 Active Friend',
      reward: 10,
      description: 'Your friend registers and makes their first deposit',
      completed: false,
    },
  ];

  const handleClaim = (taskId: number, amount: number) => {
    if (claimedTasks.includes(taskId) || !user) return;
    setClaimedTasks((prev) => [...prev, taskId]);
    updateUserBalance(user.balance + amount);
    alert(`Claimed $${amount.toFixed(2)} USD bonus! Added to your balance.`);
  };

  return (
    <div id="task-center-page" className="min-h-screen w-full bg-[#F6F7FB] pb-24 flex flex-col">
      <TopHeader
        variant="red"
        showBack={true}
        onBack={() => onNavigate('profile')}
        title="Task Center"
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Banner */}
        <div className="rounded-2xl p-5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-teal-100 uppercase tracking-wider block">Daily Missions</span>
            <h2 className="text-xl font-black mt-0.5">Complete & Earn</h2>
            <p className="text-[11px] text-teal-100 mt-1">Free bonuses reset every midnight</p>
          </div>
          <Award className="w-12 h-12 text-teal-200" />
        </div>

        {/* Task list */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <div className="divide-y divide-slate-100">
            {tasks.map((t) => {
              const isClaimed = claimedTasks.includes(t.id);
              return (
                <div key={t.id} className="py-3.5 flex items-center justify-between">
                  <div className="pr-3">
                    <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t.description}</p>
                    <span className="text-[11px] font-bold text-emerald-600 mt-1 block font-mono">
                      +${t.reward}.00 USD Bonus
                    </span>
                  </div>

                  <div>
                    {isClaimed ? (
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <Check className="w-3.5 h-3.5" /> Claimed
                      </span>
                    ) : t.completed ? (
                      <button
                        onClick={() => handleClaim(t.id, t.reward)}
                        className="px-4 py-1.5 bg-[#FA3534] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
                      >
                        Claim
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigate('game')}
                        className="px-3.5 py-1.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50"
                      >
                        Go To
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
