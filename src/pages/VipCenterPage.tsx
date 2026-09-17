import React from 'react';
import { Crown, Check, ShieldCheck } from 'lucide-react';
import { PageId } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { TopHeader } from '../components/TopHeader.js';

interface VipCenterPageProps {
  onNavigate: (page: PageId) => void;
}

export const VipCenterPage: React.FC<VipCenterPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const currentLevel = user?.vipLevel || 1;

  const vipTiers = [
    { level: 1, exp: '$0', bonus: '$5', rebate: '0.2%', fee: '0%' },
    { level: 2, exp: '$100', bonus: '$15', rebate: '0.3%', fee: '0%' },
    { level: 3, exp: '$500', bonus: '$50', rebate: '0.4%', fee: '0%' },
    { level: 4, exp: '$2,000', bonus: '$200', rebate: '0.5%', fee: '0%' },
    { level: 5, exp: '$10,000', bonus: '$750', rebate: '0.6%', fee: '0%' },
    { level: 6, exp: '$50,000', bonus: '$2,500', rebate: '0.8%', fee: '0%' },
  ];

  return (
    <div id="vip-center-page" className="min-h-screen w-full bg-[#F6F7FB] pb-24 flex flex-col">
      <TopHeader
        variant="red"
        showBack={true}
        onBack={() => onNavigate('profile')}
        title="VIP Club Center"
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* VIP Status Card */}
        <div className="rounded-2xl p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-amber-950 shadow-lg shadow-amber-500/20 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-amber-900">
                <Crown className="w-4 h-4 fill-amber-900" />
                Current Status
              </div>
              <h2 className="text-2xl font-black text-amber-950 mt-1">VIP {currentLevel} Privileges</h2>
              <p className="text-[11px] text-amber-900 font-semibold mt-0.5">
                Keep betting to level up and unlock higher rebate rates!
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-400/50 flex items-center justify-center font-black text-2xl text-amber-950 shadow-inner">
              V{currentLevel}
            </div>
          </div>
        </div>

        {/* VIP Benefits Table */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            VIP Tier Benefits
          </h3>

          <div className="divide-y divide-slate-100 text-xs">
            {vipTiers.map((tier) => {
              const isCurrent = tier.level === currentLevel;
              return (
                <div
                  key={tier.level}
                  className={`py-3 flex items-center justify-between ${
                    isCurrent ? 'bg-amber-50/50 -mx-2 px-2 rounded-xl' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 font-extrabold flex items-center justify-center text-xs">
                      V{tier.level}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block">
                        VIP {tier.level} {isCurrent && '(Active)'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Turnover: <span className="font-points font-semibold">{tier.exp}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-[#FA3534]">
                      Level Bonus <span className="font-points">{tier.bonus}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Rebate <span className="font-points">{tier.rebate}</span>
                    </span>
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
