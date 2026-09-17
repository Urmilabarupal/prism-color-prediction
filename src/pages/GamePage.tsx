import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Bell,
  Copy,
  Check,
  HelpCircle,
  Lock,
  Send,
  Loader2,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { BetSelection, BetType, GameMode, PageId } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { useGame } from '../context/GameContext.js';
import { sound } from '../services/sound.js';

interface GamePageProps {
  onNavigate: (page: PageId) => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const {
    mode,
    setMode,
    currentRound,
    timeLeft,
    isBettingOpen,
    history,
    myBets,
    placeBet,
    setLastWinResult,
    soundEnabled,
    toggleSound,
  } = useGame();

  // Selected betting state
  const [selectedType, setSelectedType] = useState<BetType>('color');
  const [selectedOption, setSelectedOption] = useState<BetSelection>('green');

  // Bet amount state (USD presets + custom) - $10 default selected matching screenshot
  const [betAmount, setBetAmount] = useState<number>(10);
  const [customInput, setCustomInput] = useState<string>('10');

  // Interactive feedback states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'gameRecord' | 'myRecord' | 'chart'>('gameRecord');
  const [copiedPeriod, setCopiedPeriod] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showModeDropdown, setShowModeDropdown] = useState<boolean>(false);

  // Listen for external navigation event (e.g. from WinLossModal "View Details")
  useEffect(() => {
    const handleOpenMyRecords = () => {
      setActiveTab('myRecord');
    };
    window.addEventListener('open-my-records', handleOpenMyRecords);
    return () => window.removeEventListener('open-my-records', handleOpenMyRecords);
  }, []);

  // Preset amounts in USD matching screenshot
  const presetAmounts = [1, 5, 10, 50, 100];

  // Mode durations for progress calculation
  const getModeTotalSeconds = (m: GameMode): number => {
    switch (m) {
      case '1min':
        return 60;
      case '3min':
        return 180;
      case '5min':
        return 300;
      case '10min':
        return 600;
      default:
        return 60;
    }
  };

  const totalDuration = getModeTotalSeconds(mode);
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));

  // Format timer into mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
  };

  // Color selection handlers
  const handleSelectColor = (color: 'green' | 'violet' | 'red') => {
    if (!isBettingOpen) return;
    sound.playChipSelect();
    setSelectedType('color');
    setSelectedOption(color);
  };

  const handleSelectNumber = (num: number) => {
    if (!isBettingOpen) return;
    sound.playChipSelect();
    setSelectedType('number');
    setSelectedOption(num);
  };

  const handleSelectBigSmall = (bs: 'big' | 'small') => {
    if (!isBettingOpen) return;
    sound.playChipSelect();
    setSelectedType('bigSmall');
    setSelectedOption(bs);
  };

  const handlePresetSelect = (amt: number) => {
    sound.playChipSelect();
    setBetAmount(amt);
    setCustomInput(String(amt));
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setBetAmount(parsed);
    }
  };

  // Copy period handler
  const handleCopyPeriod = async () => {
    if (!currentRound?.periodId) return;
    try {
      await navigator.clipboard.writeText(currentRound.periodId);
      setCopiedPeriod(true);
      setTimeout(() => setCopiedPeriod(false), 2000);
    } catch {
      setCopiedPeriod(true);
      setTimeout(() => setCopiedPeriod(false), 2000);
    }
  };

  // Submit bet
  const handlePlaceBet = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    if (!isBettingOpen) {
      setFeedback({ type: 'error', message: 'Betting is locked for current round settlement.' });
      return;
    }

    if (betAmount <= 0 || isNaN(betAmount)) {
      setFeedback({ type: 'error', message: 'Please enter a valid bet amount (min $1).' });
      return;
    }

    if (betAmount < 1) {
      setFeedback({ type: 'error', message: 'Minimum bet amount is $1.00 USD.' });
      return;
    }

    if (user.balance < betAmount) {
      setFeedback({ type: 'error', message: `Insufficient balance ($${user.balance.toFixed(2)}). Please recharge.` });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await placeBet({
        type: selectedType,
        selection: selectedOption,
        amount: betAmount,
      });

      if (res.success) {
        sound.playWin();
        const formattedSelection =
          selectedType === 'number'
            ? `Number ${selectedOption}`
            : selectedType === 'bigSmall'
            ? String(selectedOption).toUpperCase()
            : String(selectedOption).toUpperCase();

        setFeedback({
          type: 'success',
          message: `Bet placed: ${formattedSelection} for $${betAmount.toFixed(2)} USD!`,
        });
      } else {
        setFeedback({ type: 'error', message: res.message || 'Failed to place bet.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error processing bet submission.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Number button styling helper matching screenshot pastel colors
  const getNumberButtonStyles = (num: number, isSelected: boolean) => {
    if (isSelected) {
      if (num === 0) return 'bg-gradient-to-tr from-[#FF3B30] to-[#9333EA] text-white ring-3 ring-purple-300 scale-105 shadow-md font-black';
      if (num === 5) return 'bg-gradient-to-tr from-[#00C853] to-[#9333EA] text-white ring-3 ring-emerald-300 scale-105 shadow-md font-black';
      if (num % 2 === 0) return 'bg-gradient-to-tr from-[#FF3B30] to-[#E02438] text-white ring-3 ring-red-300 scale-105 shadow-md font-black';
      return 'bg-gradient-to-tr from-[#00C853] to-[#009624] text-white ring-3 ring-emerald-300 scale-105 shadow-md font-black';
    }

    // Default pastel state matching screenshot exactly
    if (num === 0 || num === 5) {
      return 'bg-[#FAF5FF] border border-[#E9D5FF] text-[#9333EA] hover:bg-[#F3E8FF]';
    }
    if (num % 2 === 0) {
      return 'bg-[#FEF2F2] border border-[#FECACA] text-[#FF3B30] hover:bg-[#FEE2E2]';
    }
    return 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#00C853] hover:bg-[#D1FAE5]';
  };

  return (
    <div id="game-page-container" className="min-h-screen w-full bg-[#F6F8FC] pb-24 flex flex-col select-none">
      {/* ==================================================
          1. COMPACT TOP HEADER MATCHING SCREENSHOT
          ================================================== */}
      <header className="bg-gradient-to-r from-[#F03046] via-[#E8263D] to-[#DC143C] text-white px-4 pt-3 pb-3.5 shadow-sm sticky top-0 z-30">
        <div className="flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs border border-white/30">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-base tracking-tight text-white block">
                ColorWin
              </span>
              <span className="text-[10px] text-white/85 font-medium tracking-wide">
                Play Smart · Win Big
              </span>
            </div>
          </div>

          {/* Right Actions: Wallet Chip + Notifications */}
          <div className="flex items-center gap-2">
            {/* Wallet Balance Pill */}
            <button
              onClick={() => onNavigate('wallet')}
              className="bg-black/25 hover:bg-black/35 border border-white/20 text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="View Wallet"
            >
              <Wallet className="w-3.5 h-3.5 text-white/90" />
              <span className="font-points font-black text-xs text-white">
                ${user ? user.balance.toFixed(2) : '0.00'}
              </span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => onNavigate('tasks')}
              className="w-8 h-8 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white relative transition-all active:scale-95 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-300 border border-[#F03046]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-3.5 pt-3 space-y-3 flex-1">
        {/* ==================================================
            PROMO / HERO BANNER MATCHING SCREENSHOT
            ================================================== */}
        <div className="relative rounded-2xl p-4 bg-gradient-to-r from-[#0C162D] via-[#112040] to-[#162752] text-white shadow-md overflow-hidden flex items-center justify-between border border-slate-800">
          {/* Subtle Ambient Stars */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-2 left-8 w-1 h-1 bg-white rounded-full animate-ping" />
            <div className="absolute top-6 left-32 w-1.5 h-1.5 bg-yellow-300 rounded-full" />
            <div className="absolute bottom-3 left-20 w-1 h-1 bg-blue-300 rounded-full" />
          </div>

          {/* Left Text */}
          <div className="relative z-10 space-y-0.5">
            <h4 className="text-xs font-semibold text-white/90">Play Smart</h4>
            <h2 className="text-2xl font-black text-amber-400 tracking-tight leading-tight">
              Win Big
            </h2>
            <p className="text-[10px] text-slate-300 font-medium tracking-wide pt-0.5">
              Fast | Secure | Fair
            </p>
          </div>

          {/* Right 3D Golden Crown with Gems and Floating Gold Coins */}
          <div className="relative z-10 w-28 h-18 flex items-center justify-center">
            {/* Scattering Gold Coins */}
            <div className="absolute -left-1 top-2 w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-300 via-amber-200 to-amber-500 shadow-md flex items-center justify-center text-[9px] text-amber-950 font-black border border-yellow-100 rotate-[-15deg]">
              $
            </div>
            <div className="absolute -right-1 bottom-1 w-4 h-4 rounded-full bg-gradient-to-tr from-yellow-200 via-amber-300 to-amber-500 shadow-md flex items-center justify-center text-[8px] text-amber-950 font-black border border-yellow-100 rotate-[12deg]">
              $
            </div>
            <Sparkles className="absolute top-0 right-2 w-3.5 h-3.5 text-yellow-300 animate-pulse" />

            {/* 3D Crown SVG */}
            <svg viewBox="0 0 100 80" className="w-20 h-18 filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
              <defs>
                <linearGradient id="bannerCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFF9C4" />
                  <stop offset="30%" stopColor="#FDD835" />
                  <stop offset="70%" stopColor="#F57F17" />
                  <stop offset="100%" stopColor="#E65100" />
                </linearGradient>
              </defs>
              <ellipse cx="50" cy="62" rx="30" ry="7" fill="#E65100" />
              <ellipse cx="50" cy="60" rx="28" ry="6" fill="#FFF9C4" />
              {/* Crown peaks */}
              <path
                d="M18 32 L30 58 L70 58 L82 32 L64 46 L50 20 L36 46 Z"
                fill="url(#bannerCrownGrad)"
                stroke="#FFE082"
                strokeWidth="1"
              />
              {/* Pearl Tips */}
              <circle cx="18" cy="32" r="3" fill="#FFFDE7" />
              <circle cx="50" cy="20" r="4" fill="#FFFDE7" />
              <circle cx="82" cy="32" r="3" fill="#FFFDE7" />
              {/* Jewels on Band */}
              <rect x="26" y="56" width="48" height="6" rx="2" fill="#E65100" />
              <rect x="28" y="57" width="44" height="4" rx="1.5" fill="url(#bannerCrownGrad)" />
              <circle cx="36" cy="59" r="1.8" fill="#EF4444" />
              <circle cx="50" cy="59" r="2.2" fill="#3B82F6" />
              <circle cx="64" cy="59" r="1.8" fill="#10B981" />
            </svg>
          </div>
        </div>

        {/* ==================================================
            CURRENT ROUND CARD: PERIOD & TIME LEFT (MATCHING SCREENSHOT)
            ================================================== */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            {/* Period Section */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Period</span>
                {/* Discreet mode selector button */}
                <div className="relative">
                  <button
                    onClick={() => setShowModeDropdown(!showModeDropdown)}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 cursor-pointer transition-colors"
                    title="Change duration mode"
                  >
                    <span>{mode.toUpperCase()}</span>
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                  {showModeDropdown && (
                    <div className="absolute top-6 left-0 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-30 w-24 space-y-0.5">
                      {(['1min', '3min', '5min', '10min'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setMode(m);
                            setShowModeDropdown(false);
                            sound.playChipSelect();
                          }}
                          className={`w-full text-left px-2 py-1 text-xs rounded-lg font-bold ${
                            mode === m ? 'bg-[#F03046] text-white' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-points font-black text-base text-slate-900 tracking-wide">
                  {currentRound?.periodId || '2025091701234'}
                </span>
                <button
                  onClick={handleCopyPeriod}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                  title="Copy Period Number"
                >
                  {copiedPeriod ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Time Left Section */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Time Left</span>
                {/* Sound toggle button */}
                <button
                  onClick={toggleSound}
                  className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                  title={soundEnabled ? 'Mute' : 'Unmute'}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>
              <div
                className={`font-points font-black text-2xl tracking-wider mt-0.5 text-right ${
                  timeLeft <= 5 ? 'text-[#DC2626] animate-pulse' : 'text-[#F03046]'
                }`}
              >
                {formatTimer(timeLeft)}
              </div>
            </div>
          </div>

          {/* Progress Indicator Bar */}
          <div className="mt-3">
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F03046] rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Settling Notice in Last 5 Seconds */}
          {!isBettingOpen && (
            <div className="mt-2.5 py-1 px-2.5 bg-amber-50 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-700 border border-amber-200">
              <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Round settling in {timeLeft}s. Betting locked.</span>
            </div>
          )}
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold px-1 hover:opacity-75 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ==================================================
            COLOR SELECTION (GREEN, VIOLET, RED)
            ================================================== */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* GREEN */}
          <button
            id="bet-color-green"
            type="button"
            disabled={!isBettingOpen}
            onClick={() => handleSelectColor('green')}
            className={`py-3 px-2 rounded-2xl text-white shadow-sm transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
              selectedType === 'color' && selectedOption === 'green'
                ? 'ring-3 ring-emerald-300 ring-offset-1 scale-[1.02] shadow-md shadow-emerald-500/30'
                : 'hover:brightness-105'
            } ${
              !isBettingOpen ? 'opacity-60 cursor-not-allowed' : ''
            } bg-gradient-to-b from-[#00C853] to-[#009624]`}
          >
            <span className="font-black text-sm tracking-wide">Green</span>
            <span className="text-[11px] font-semibold text-white/95 mt-0.5">1.95x</span>
          </button>

          {/* VIOLET */}
          <button
            id="bet-color-violet"
            type="button"
            disabled={!isBettingOpen}
            onClick={() => handleSelectColor('violet')}
            className={`py-3 px-2 rounded-2xl text-white shadow-sm transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
              selectedType === 'color' && selectedOption === 'violet'
                ? 'ring-3 ring-purple-300 ring-offset-1 scale-[1.02] shadow-md shadow-purple-500/30'
                : 'hover:brightness-105'
            } ${
              !isBettingOpen ? 'opacity-60 cursor-not-allowed' : ''
            } bg-gradient-to-b from-[#7C4DFF] to-[#651FFF]`}
          >
            <span className="font-black text-sm tracking-wide">Violet</span>
            <span className="text-[11px] font-semibold text-white/95 mt-0.5">4.50x</span>
          </button>

          {/* RED */}
          <button
            id="bet-color-red"
            type="button"
            disabled={!isBettingOpen}
            onClick={() => handleSelectColor('red')}
            className={`py-3 px-2 rounded-2xl text-white shadow-sm transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
              selectedType === 'color' && selectedOption === 'red'
                ? 'ring-3 ring-red-300 ring-offset-1 scale-[1.02] shadow-md shadow-red-500/30'
                : 'hover:brightness-105'
            } ${
              !isBettingOpen ? 'opacity-60 cursor-not-allowed' : ''
            } bg-gradient-to-b from-[#FF3B30] to-[#E02438]`}
          >
            <span className="font-black text-sm tracking-wide">Red</span>
            <span className="text-[11px] font-semibold text-white/95 mt-0.5">1.95x</span>
          </button>
        </div>

        {/* ==================================================
            NUMBER SELECTION (0 TO 9 GRID IN 2 ROWS OF 5)
            ================================================== */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="grid grid-cols-5 gap-2.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const isSelected = selectedType === 'number' && selectedOption === num;
              return (
                <button
                  key={num}
                  id={`bet-num-${num}`}
                  type="button"
                  disabled={!isBettingOpen}
                  onClick={() => handleSelectNumber(num)}
                  className={`w-11 h-11 md:w-12 md:h-12 mx-auto rounded-full flex items-center justify-center font-black text-base transition-all active:scale-90 cursor-pointer shadow-xs ${getNumberButtonStyles(
                    num,
                    isSelected
                  )} ${!isBettingOpen ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================
            BIG / SMALL SELECTION (ORANGE & BLUE)
            ================================================== */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* BIG (5 - 9) */}
          <button
            id="bet-big"
            type="button"
            disabled={!isBettingOpen}
            onClick={() => handleSelectBigSmall('big')}
            className={`py-3 px-3 rounded-xl text-white shadow-sm transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
              selectedType === 'bigSmall' && selectedOption === 'big'
                ? 'ring-3 ring-amber-300 ring-offset-1 scale-[1.02] shadow-md shadow-amber-500/25'
                : 'hover:brightness-105'
            } ${
              !isBettingOpen ? 'opacity-60 cursor-not-allowed' : ''
            } bg-gradient-to-r from-[#F59E0B] to-[#EA580C]`}
          >
            <span className="font-black text-sm tracking-wide">Big</span>
            <span className="text-[11px] font-semibold text-white/95 mt-0.5">1.95x</span>
          </button>

          {/* SMALL (0 - 4) */}
          <button
            id="bet-small"
            type="button"
            disabled={!isBettingOpen}
            onClick={() => handleSelectBigSmall('small')}
            className={`py-3 px-3 rounded-xl text-white shadow-sm transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
              selectedType === 'bigSmall' && selectedOption === 'small'
                ? 'ring-3 ring-blue-300 ring-offset-1 scale-[1.02] shadow-md shadow-blue-500/25'
                : 'hover:brightness-105'
            } ${
              !isBettingOpen ? 'opacity-60 cursor-not-allowed' : ''
            } bg-gradient-to-r from-[#3B82F6] to-[#2563EB]`}
          >
            <span className="font-black text-sm tracking-wide">Small</span>
            <span className="text-[11px] font-semibold text-white/95 mt-0.5">1.95x</span>
          </button>
        </div>

        {/* ==================================================
            BET AMOUNT (USD): PRESETS + CUSTOM INPUT
            ================================================== */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-800 tracking-tight">
                Bet Amount (USD)
              </span>
              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="View Odds & Rules"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400">Balance: </span>
              <span className="text-xs font-bold text-slate-800 font-points">
                ${user ? user.balance.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Preset Buttons: 1, 5, 10 (selected!), 50, 100 */}
          <div className="grid grid-cols-5 gap-1.5">
            {presetAmounts.map((amt) => {
              const isSelected = betAmount === amt && customInput === String(amt);
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetSelect(amt)}
                  className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer font-points ${
                    isSelected
                      ? 'bg-[#F03046] text-white shadow-xs scale-[1.02]'
                      : 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {amt}
                </button>
              );
            })}
          </div>

          {/* Custom Amount Input */}
          <div className="relative flex items-center">
            <div className="absolute left-3 font-bold text-slate-400 text-sm font-points select-none">
              $
            </div>
            <input
              id="bet-custom-amount-input"
              type="number"
              min="1"
              max="5000"
              step="1"
              value={customInput}
              onChange={handleCustomInputChange}
              placeholder="Enter amount"
              className="w-full pl-8 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#F03046] focus:bg-white transition-all font-points"
            />
          </div>
        </div>

        {/* ==================================================
            PLACE BET BUTTON MATCHING SCREENSHOT
            ================================================== */}
        <button
          id="btn-place-bet"
          type="button"
          disabled={!isBettingOpen || submitting}
          onClick={handlePlaceBet}
          className={`w-full py-3.5 rounded-xl font-black text-sm text-white shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
            !isBettingOpen
              ? 'bg-slate-400 opacity-60 cursor-not-allowed shadow-none'
              : submitting
              ? 'bg-[#F03046]/80 cursor-wait'
              : 'bg-gradient-to-r from-[#F03046] via-[#E8263D] to-[#DC143C] shadow-red-500/25 hover:brightness-105'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Submitting...</span>
            </>
          ) : !isBettingOpen ? (
            <>
              <Lock className="w-4 h-4 text-white" />
              <span>Betting Closed (Settling...)</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 fill-white rotate-45 -mt-0.5" />
              <span>Place Bet</span>
            </>
          )}
        </button>

        {/* ==================================================
            GAME RECORD SECTION: TABS & TABLES MATCHING SCREENSHOT
            ================================================== */}
        <div className="pt-1">
          {/* Tab Navigation Pills */}
          <div className="grid grid-cols-3 gap-1 bg-[#EEF2F6] p-1 rounded-xl">
            <button
              id="tab-game-record"
              type="button"
              onClick={() => setActiveTab('gameRecord')}
              className={`py-2 text-xs font-black rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'gameRecord'
                  ? 'bg-[#F03046] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Game Record
            </button>
            <button
              id="tab-my-record"
              type="button"
              onClick={() => setActiveTab('myRecord')}
              className={`py-2 text-xs font-black rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'myRecord'
                  ? 'bg-[#F03046] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Record
            </button>
            <button
              id="tab-chart"
              type="button"
              onClick={() => setActiveTab('chart')}
              className={`py-2 text-xs font-black rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-[#F03046] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chart
            </button>
          </div>

          {/* Tab Content Box */}
          <div className="mt-2.5 bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
            {/* TAB 1: GAME RECORD */}
            {activeTab === 'gameRecord' && (
              <div className="divide-y divide-slate-100 text-xs">
                {/* Table Header matching screenshot */}
                <div className="grid grid-cols-5 pb-2 text-[11px] font-semibold text-slate-400 text-center">
                  <span className="text-left">Period</span>
                  <span>Number</span>
                  <span>Color</span>
                  <span>Big/Small</span>
                  <span className="text-right">Time</span>
                </div>

                {/* Table Rows matching screenshot */}
                {history.slice(0, 15).map((r) => {
                  const isRed = r.colors.includes('red');

                  return (
                    <div key={r.periodId} className="grid grid-cols-5 py-2.5 items-center text-center">
                      {/* Period */}
                      <span className="text-left font-points font-semibold text-slate-800 text-xs">
                        {r.periodId}
                      </span>

                      {/* Number */}
                      <div className="flex justify-center">
                        <span
                          className={`font-points font-black text-sm ${
                            r.number === 0 || r.number === 5
                              ? 'text-purple-600'
                              : isRed
                              ? 'text-[#FF3B30]'
                              : 'text-[#00C853]'
                          }`}
                        >
                          {r.number}
                        </span>
                      </div>

                      {/* Color Dot matching screenshot ● */}
                      <div className="flex items-center justify-center">
                        {r.number === 0 ? (
                          <div
                            className="w-3 h-3 rounded-full shadow-xs"
                            style={{ background: 'linear-gradient(135deg, #FF3B30 50%, #9333EA 50%)' }}
                          />
                        ) : r.number === 5 ? (
                          <div
                            className="w-3 h-3 rounded-full shadow-xs"
                            style={{ background: 'linear-gradient(135deg, #00C853 50%, #9333EA 50%)' }}
                          />
                        ) : (
                          <span
                            className={`w-3 h-3 rounded-full shadow-xs ${
                              isRed ? 'bg-[#FF3B30]' : 'bg-[#00C853]'
                            }`}
                          />
                        )}
                      </div>

                      {/* Big / Small */}
                      <span className="font-bold text-slate-800 text-xs capitalize">
                        {r.bigSmall === 'big' ? 'Big' : 'Small'}
                      </span>

                      {/* Time */}
                      <span className="text-right text-slate-400 font-points text-[11px]">
                        {r.time ? r.time.slice(0, 5) : '09:41'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: MY RECORD */}
            {activeTab === 'myRecord' && (
              <div>
                {myBets.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No bets recorded for this session yet. Place your prediction above!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {myBets.slice(0, 15).map((bet) => (
                      <div key={bet.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-points font-bold text-slate-800">
                              {bet.periodId}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase">
                              {String(bet.selection)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Amount: <span className="font-points font-bold text-slate-700">${bet.amount.toFixed(2)}</span>
                          </span>
                        </div>

                        <div className="text-right">
                          {bet.status === 'WON' && (
                            <span className="text-emerald-600 font-black font-points text-sm">
                              +${bet.payout.toFixed(2)}
                            </span>
                          )}
                          {bet.status === 'LOST' && (
                            <span className="text-slate-500 font-bold font-points text-sm">
                              -${bet.amount.toFixed(2)}
                            </span>
                          )}
                          {bet.status === 'PENDING' && (
                            <span className="text-amber-500 font-bold text-xs animate-pulse">
                              Pending...
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CHART / TRENDS */}
            {activeTab === 'chart' && (
              <div className="space-y-4 text-xs">
                {/* Number Frequencies */}
                <div>
                  <span className="font-bold text-slate-700 block mb-2 text-xs">
                    Number Frequencies (Last {history.length} Rounds)
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                      const count = history.filter((h) => h.number === n).length;
                      const pct = Math.round((count / Math.max(1, history.length)) * 100);
                      return (
                        <div key={n} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
                          <span className="font-points font-black text-sm text-slate-800">{n}</span>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-points">
                            {count}x ({pct}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Big vs Small Split */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-center">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Big (5-9)</span>
                    <span className="font-black text-amber-500 text-base font-points">
                      {Math.round(
                        (history.filter((h) => h.bigSmall === 'big').length / Math.max(1, history.length)) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Small (0-4)</span>
                    <span className="font-black text-blue-500 text-base font-points">
                      {Math.round(
                        (history.filter((h) => h.bigSmall === 'small').length / Math.max(1, history.length)) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ==================================================
          RULES & ODDS MODAL
          ================================================== */}
      {showRulesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setShowRulesModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Game Rules & Odds</h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2.5 mt-3">
              <div>
                <span className="font-bold text-emerald-600 block">Green (1.95x / 1.45x)</span>
                <span>Numbers 1, 3, 7, 9 pay 1.95x. Number 5 (split with violet) pays 1.45x.</span>
              </div>
              <div>
                <span className="font-bold text-red-600 block">Red (1.95x / 1.45x)</span>
                <span>Numbers 2, 4, 6, 8 pay 1.95x. Number 0 (split with violet) pays 1.45x.</span>
              </div>
              <div>
                <span className="font-bold text-purple-600 block">Violet (4.50x)</span>
                <span>If the result contains violet (numbers 0 or 5), payout is 4.50x.</span>
              </div>
              <div>
                <span className="font-bold text-amber-600 block">Numbers 0–9 (9x)</span>
                <span>Exact number match pays 9x your bet amount.</span>
              </div>
              <div>
                <span className="font-bold text-blue-600 block">Big / Small (1.95x)</span>
                <span>Small: 0, 1, 2, 3, 4. Big: 5, 6, 7, 8, 9. Payout is 1.95x.</span>
              </div>
            </div>

            {/* Direct Visual Preview for Testing Win/Loss Modals */}
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Modal Visual Preview
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRulesModal(false);
                    setLastWinResult({
                      round: {
                        periodId: currentRound?.periodId || '2025091701234',
                        mode: mode,
                        number: 7,
                        colors: ['green'],
                        bigSmall: 'big',
                        time: '09:41',
                        timestamp: Date.now(),
                      },
                      bet: {
                        id: 'demo-win',
                        userId: user?.id || 'demo',
                        periodId: currentRound?.periodId || '2025091701234',
                        mode: mode,
                        type: 'color',
                        selection: 'green',
                        amount: 10,
                        status: 'WON',
                        payout: 25.0,
                        createdAt: Date.now(),
                      },
                    });
                  }}
                  className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer text-center"
                >
                  🏆 Preview Win
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRulesModal(false);
                    setLastWinResult({
                      round: {
                        periodId: currentRound?.periodId || '2025091701234',
                        mode: mode,
                        number: 7,
                        colors: ['green'],
                        bigSmall: 'big',
                        time: '09:41',
                        timestamp: Date.now(),
                      },
                      bet: {
                        id: 'demo-loss',
                        userId: user?.id || 'demo',
                        periodId: currentRound?.periodId || '2025091701234',
                        mode: mode,
                        type: 'color',
                        selection: 'red',
                        amount: 10,
                        status: 'LOST',
                        payout: 0,
                        createdAt: Date.now(),
                      },
                    });
                  }}
                  className="py-2 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer text-center"
                >
                  💔 Preview Loss
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-3.5 py-2.5 rounded-xl bg-[#F03046] text-white font-bold text-xs cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
