import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Copy, Check } from 'lucide-react';
import { BetRecord, RoundResult } from '../types.js';
import { sound } from '../services/sound.js';

export interface WinLossModalData {
  round: RoundResult;
  bet: BetRecord;
  allBets?: BetRecord[];
}

interface WinLossModalProps {
  data: WinLossModalData | null;
  onClose: () => void;
  onViewDetails?: () => void;
}

export const WinLossModal: React.FC<WinLossModalProps> = ({ data, onClose, onViewDetails }) => {
  const round = data?.round;
  const bet = data?.bet;
  const allBets = data?.allBets;
  const betsToEvaluate = allBets && allBets.length > 0 ? allBets : bet ? [bet] : [];

  // Calculate net outcome from verified backend results
  const totalAmount = betsToEvaluate.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalPayout = betsToEvaluate.reduce((sum, b) => sum + (b.payout || 0), 0);
  const isNetWon = totalPayout > totalAmount || betsToEvaluate.some((b) => b.status === 'WON');

  const [copied, setCopied] = useState(false);

  // Sound & subtle confetti effects on open
  useEffect(() => {
    if (!data || !round) return;

    if (isNetWon) {
      sound.playWin();
      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.45 },
          colors: ['#FFD700', '#10B981', '#FF3B30', '#8B5CF6', '#3B82F6', '#F59E0B'],
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    } else {
      sound.playLoss();
    }
  }, [data, round?.periodId, isNetWon]);

  if (!data || !round || betsToEvaluate.length === 0) return null;

  const handleClose = () => {
    sound.playChipSelect();
    onClose();
  };

  const handleViewDetails = () => {
    sound.playChipSelect();
    if (onViewDetails) {
      onViewDetails();
    } else {
      onClose();
    }
  };

  const handleCopyPeriod = async () => {
    try {
      await navigator.clipboard.writeText(round.periodId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Primary bet display
  const primaryBet = betsToEvaluate[0];
  const formattedPick =
    primaryBet.type === 'number'
      ? `Number ${primaryBet.selection}`
      : primaryBet.type === 'bigSmall'
      ? String(primaryBet.selection).toUpperCase()
      : String(primaryBet.selection).charAt(0).toUpperCase() + String(primaryBet.selection).slice(1);

  // Pick color dot
  const getPickDotColor = () => {
    if (primaryBet.selection === 'green') return 'bg-[#00C853]';
    if (primaryBet.selection === 'red') return 'bg-[#FF3B30]';
    if (primaryBet.selection === 'violet') return 'bg-[#7C4DFF]';
    if (primaryBet.type === 'bigSmall') {
      return primaryBet.selection === 'big' ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]';
    }
    if (typeof primaryBet.selection === 'number') {
      if (primaryBet.selection === 0 || primaryBet.selection === 5) return 'bg-[#9333EA]';
      return primaryBet.selection % 2 === 0 ? 'bg-[#FF3B30]' : 'bg-[#00C853]';
    }
    return 'bg-[#00C853]';
  };

  // Winning color display
  const winningColorDisplay = round.colors
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join(' + ');

  const getWinningDotColor = () => {
    if (round.colors.includes('green') && round.colors.includes('violet'))
      return 'bg-gradient-to-r from-[#00C853] to-[#9333EA]';
    if (round.colors.includes('red') && round.colors.includes('violet'))
      return 'bg-gradient-to-r from-[#FF3B30] to-[#9333EA]';
    if (round.colors.includes('green')) return 'bg-[#00C853]';
    if (round.colors.includes('red')) return 'bg-[#FF3B30]';
    return 'bg-[#7C4DFF]';
  };

  return (
    <div
      id="win-loss-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div
        id="win-loss-modal-card"
        className="w-full max-w-[325px] bg-white rounded-3xl overflow-hidden shadow-2xl relative text-center border border-white/20 select-none animate-daman-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            TOP BANNER (WIN or LOSS) MATCHING SCREENSHOT EXACTLY
            ========================================================= */}
        {isNetWon ? (
          /* WIN BANNER: Vivid Green Gradient + 3D Golden Crown with Gems + Confetti + Folded Ribbon */
          <div className="relative pt-7 pb-6 px-4 bg-gradient-to-b from-[#00A86B] via-[#00B074] to-[#10B981] text-white overflow-hidden">
            {/* Ambient Sparkles, Rays & Gem Polygons in background */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              {/* Confetti rectangles & stars */}
              <div className="absolute top-3 left-6 w-2 h-3.5 bg-yellow-300 rounded-xs rotate-12" />
              <div className="absolute top-5 left-16 w-2 h-2 bg-purple-300 rounded-full" />
              <div className="absolute top-2 right-12 w-2.5 h-3 bg-cyan-300 rounded-xs -rotate-45" />
              <div className="absolute top-8 right-6 w-2 h-2.5 bg-amber-200 rotate-30" />
              <div className="absolute bottom-6 left-4 w-2 h-3 bg-emerald-200 rotate-45" />
              <div className="absolute bottom-5 right-5 w-2 h-2 bg-yellow-200 rounded-full" />
            </div>

            {/* Circular Close Button (Top Right matching screenshot) */}
            <button
              id="modal-close-button"
              onClick={handleClose}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer z-30"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* 3D Golden Crown on Pedestal + Floating Gold Coins */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-32 h-24 flex items-center justify-center">
                {/* Floating 3D Gold Coins with $ symbols */}
                <div className="absolute left-1 top-4 w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-300 via-amber-200 to-amber-500 shadow-md flex items-center justify-center text-[11px] text-amber-950 font-black border border-yellow-100 rotate-[-12deg] filter drop-shadow">
                  $
                </div>
                <div className="absolute right-1 top-6 w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-200 via-amber-300 to-amber-500 shadow-md flex items-center justify-center text-[9px] text-amber-950 font-black border border-yellow-100 rotate-[15deg] filter drop-shadow">
                  $
                </div>
                {/* Floating Gem Polygon (Cyan & Purple matching screenshot) */}
                <div className="absolute left-4 -top-1 w-3.5 h-3.5 bg-gradient-to-tr from-purple-400 to-indigo-500 rounded-xs rotate-45 shadow-sm opacity-90" />
                <div className="absolute right-5 -top-0.5 w-3.5 h-3.5 bg-gradient-to-tr from-cyan-300 to-blue-500 rounded-xs rotate-12 shadow-sm opacity-90" />

                {/* 3D Gold Crown SVG */}
                <svg
                  viewBox="0 0 120 100"
                  className="w-24 h-24 filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]"
                >
                  <defs>
                    <linearGradient id="crownGold1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFF9C4" />
                      <stop offset="25%" stopColor="#FFEE58" />
                      <stop offset="55%" stopColor="#FDD835" />
                      <stop offset="85%" stopColor="#F57F17" />
                      <stop offset="100%" stopColor="#E65100" />
                    </linearGradient>
                    <linearGradient id="crownPedestal" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFE082" />
                      <stop offset="50%" stopColor="#FFB300" />
                      <stop offset="100%" stopColor="#8D6E63" />
                    </linearGradient>
                    <radialGradient id="starShine" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>

                  {/* Crown Base Pedestal Cup */}
                  <ellipse cx="60" cy="80" rx="28" ry="6" fill="#BF360C" opacity="0.4" />
                  <path d="M42 66 L78 66 L72 80 L48 80 Z" fill="url(#crownPedestal)" />
                  <ellipse cx="60" cy="80" rx="16" ry="3.5" fill="#FFE082" />

                  {/* Main Crown Body */}
                  <path
                    d="M20 38 L34 68 L86 68 L100 38 L76 54 L60 22 L44 54 Z"
                    fill="url(#crownGold1)"
                    stroke="#FFF176"
                    strokeWidth="1"
                  />

                  {/* Crown Rim Band */}
                  <rect x="32" y="64" width="56" height="8" rx="2" fill="#E65100" />
                  <rect x="34" y="65" width="52" height="6" rx="2" fill="url(#crownGold1)" />

                  {/* Jewels on Crown Rim (Red, Blue, Green, Purple gems) */}
                  <circle cx="42" cy="68" r="2.5" fill="#EF4444" stroke="#FFF" strokeWidth="0.5" />
                  <circle cx="51" cy="68" r="2.5" fill="#3B82F6" stroke="#FFF" strokeWidth="0.5" />
                  <circle cx="60" cy="68" r="3" fill="#10B981" stroke="#FFF" strokeWidth="0.5" />
                  <circle cx="69" cy="68" r="2.5" fill="#8B5CF6" stroke="#FFF" strokeWidth="0.5" />
                  <circle cx="78" cy="68" r="2.5" fill="#EF4444" stroke="#FFF" strokeWidth="0.5" />

                  {/* Crown Pearl Tips */}
                  <circle cx="20" cy="38" r="4.5" fill="#FFFDE7" stroke="#FFD54F" strokeWidth="1" />
                  <circle cx="60" cy="22" r="5.5" fill="#FFFDE7" stroke="#FFD54F" strokeWidth="1" />
                  <circle cx="100" cy="38" r="4.5" fill="#FFFDE7" stroke="#FFD54F" strokeWidth="1" />

                  {/* Specular sparkle on center peak */}
                  <circle cx="60" cy="22" r="8" fill="url(#starShine)" />
                </svg>
              </div>

              {/* 3D Folded Emerald Ribbon: "Congratulations!" */}
              <div className="relative mt-1">
                {/* Left Ribbon Tail */}
                <div
                  className="absolute -left-3.5 top-1.5 w-6 h-6 bg-[#047857] rounded-xs -rotate-12 -z-10 shadow-md"
                  style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 35% 50%)' }}
                />
                {/* Right Ribbon Tail */}
                <div
                  className="absolute -right-3.5 top-1.5 w-6 h-6 bg-[#047857] rounded-xs rotate-12 -z-10 shadow-md"
                  style={{ clipPath: 'polygon(0% 0%, 100% 0%, 65% 50%, 100% 100%, 0% 100%)' }}
                />

                {/* Central Arch Ribbon */}
                <div className="px-7 py-1.5 bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg border border-emerald-300/50 flex items-center justify-center">
                  Congratulations!
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LOSS BANNER: Coral Red Gradient + White Clouds + 3D Crying Face + Broken Hearts + Folded Ribbon */
          <div className="relative pt-7 pb-6 px-4 bg-gradient-to-b from-[#FB7185] via-[#F43F5E] to-[#E11D48] text-white overflow-hidden">
            {/* Fluffy White Clouds at the bottom/sides */}
            <div className="absolute -bottom-2 left-2 w-20 h-10 bg-white/25 rounded-full blur-xs pointer-events-none" />
            <div className="absolute -bottom-1 right-2 w-24 h-12 bg-white/25 rounded-full blur-xs pointer-events-none" />
            <div className="absolute top-2 left-4 w-12 h-6 bg-white/15 rounded-full blur-xs pointer-events-none" />

            {/* Circular Close Button (Top Right matching screenshot) */}
            <button
              id="modal-close-button"
              onClick={handleClose}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/35 hover:bg-black/50 text-white flex items-center justify-center transition-all cursor-pointer z-30"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>

            {/* 3D Sad Face Emoji + Floating Broken Hearts 💔 */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-32 h-24 flex items-center justify-center">
                {/* Floating Broken Hearts on sides matching screenshot */}
                <span className="absolute left-0 top-5 text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] select-none rotate-[-8deg]">
                  💔
                </span>
                <span className="absolute right-0 top-5 text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] select-none rotate-[8deg]">
                  💔
                </span>

                {/* 3D Yellow Crying Face Emoji with glossy tear */}
                <div className="w-18 h-18 rounded-full bg-gradient-to-b from-[#FFF59D] via-[#FDD835] to-[#F57F17] shadow-[0_8px_16px_rgba(0,0,0,0.25)] flex flex-col items-center justify-center relative border-2 border-yellow-200">
                  {/* Sad downturned eyebrows */}
                  <div className="flex items-center gap-4 -mt-2">
                    <div className="w-3.5 h-1 bg-[#4E342E] rounded-full rotate-[-20deg]" />
                    <div className="w-3.5 h-1 bg-[#4E342E] rounded-full rotate-[20deg]" />
                  </div>

                  {/* Dark Oval Eyes */}
                  <div className="flex items-center gap-4 mt-1">
                    <div className="w-3 h-4 bg-[#3E2723] rounded-full relative">
                      <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 right-0.5" />
                    </div>
                    <div className="w-3 h-4 bg-[#3E2723] rounded-full relative">
                      <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 right-0.5" />
                      {/* Teardrop streaming down */}
                      <div className="absolute top-2.5 -right-2 w-2.5 h-4 bg-[#38BDF8] rounded-b-full shadow-xs filter drop-shadow" />
                    </div>
                  </div>

                  {/* Sad Downward Mouth */}
                  <div className="w-6 h-3 border-t-3 border-[#3E2723] rounded-t-full mt-2.5" />
                </div>
              </div>

              {/* 3D Folded Ruby Ribbon: "Better Luck Next Time" */}
              <div className="relative mt-1">
                {/* Left Ribbon Tail */}
                <div
                  className="absolute -left-3.5 top-1.5 w-6 h-6 bg-[#881337] rounded-xs -rotate-12 -z-10 shadow-md"
                  style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 35% 50%)' }}
                />
                {/* Right Ribbon Tail */}
                <div
                  className="absolute -right-3.5 top-1.5 w-6 h-6 bg-[#881337] rounded-xs rotate-12 -z-10 shadow-md"
                  style={{ clipPath: 'polygon(0% 0%, 100% 0%, 65% 50%, 100% 100%, 0% 100%)' }}
                />

                {/* Central Arch Ribbon */}
                <div className="px-6 py-1.5 bg-gradient-to-r from-[#BE123C] via-[#E11D48] to-[#BE123C] text-white font-black text-xs tracking-wide rounded-full shadow-lg border border-red-300/40 flex items-center justify-center">
                  Better Luck Next Time
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            MODAL BODY CONTENT MATCHING SCREENSHOT EXACTLY
            ========================================================= */}
        <div className="p-4 bg-white text-slate-800">
          {/* Subtitle: "You Won" or "You Lost" */}
          <div className="text-sm font-bold text-slate-700 tracking-tight">
            {isNetWon ? 'You Won' : 'You Lost'}
          </div>

          {/* Large Bold Amount Display */}
          <div
            className={`font-points font-black text-3xl tracking-tight my-1 ${
              isNetWon ? 'text-[#00A859]' : 'text-[#E53935]'
            }`}
          >
            {isNetWon
              ? `+$${(totalPayout || 0).toFixed(2)}`
              : `-$${(totalAmount || 0).toFixed(2)}`}
          </div>

          {/* Details Card */}
          <div className="bg-[#F8FAFC] rounded-2xl p-3.5 my-3 text-xs border border-slate-100 space-y-2.5 text-left">
            {/* Period with Copy button */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Period</span>
              <div className="flex items-center gap-1.5">
                <span className="font-points font-black text-slate-900 tracking-wider">
                  {round.periodId}
                </span>
                <button
                  onClick={handleCopyPeriod}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                  title="Copy Period Number"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Your Pick */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Your Pick</span>
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className={`w-2.5 h-2.5 rounded-full ${getPickDotColor()}`} />
                <span>{formattedPick}</span>
              </div>
            </div>

            {/* Winning Color */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Winning Color</span>
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <span className={`w-2.5 h-2.5 rounded-full ${getWinningDotColor()}`} />
                <span>{winningColorDisplay}</span>
              </div>
            </div>

            {/* Bet Amount */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Bet Amount</span>
              <span className="font-points font-bold text-slate-800">
                ${totalAmount.toFixed(2)}
              </span>
            </div>

            {/* Payout */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Payout</span>
              <span
                className={`font-points font-black ${
                  isNetWon ? 'text-[#00A859]' : 'text-slate-800'
                }`}
              >
                ${totalPayout.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons: [View Details] [Continue] matching screenshot */}
          <div className="flex items-center gap-2.5 mt-4">
            <button
              id="modal-view-details-btn"
              type="button"
              onClick={handleViewDetails}
              className="flex-1 py-2.5 rounded-xl border-2 border-[#E53935] text-[#E53935] font-bold text-xs tracking-wide hover:bg-red-50 active:scale-95 transition-all cursor-pointer text-center"
            >
              View Details
            </button>
            <button
              id="modal-continue-btn"
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#F03046] to-[#E02438] text-white font-bold text-xs tracking-wide shadow-md shadow-red-500/25 hover:brightness-105 active:scale-95 transition-all cursor-pointer text-center"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
