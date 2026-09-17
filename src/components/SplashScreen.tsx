import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PrismLogo } from './PrismLogo.js';

interface SplashScreenProps {
  onComplete?: () => void;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete, onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);

  // Store the latest callbacks in a ref to decouple effect execution from prop re-renders
  const callbackRef = useRef({ onComplete, onFinish });
  callbackRef.current = { onComplete, onFinish };

  const hasFinishedRef = useRef(false);

  const dismissSplash = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsExiting(true);

    // Allow 200ms for smooth sober fade-out before calling parent completion
    setTimeout(() => {
      const { onFinish: finish, onComplete: complete } = callbackRef.current;
      if (typeof finish === 'function') {
        finish();
      } else if (typeof complete === 'function') {
        complete();
      }
    }, 200);
  }, []);

  useEffect(() => {
    // Elegant sober splash display duration (1.1s)
    const timer = setTimeout(() => {
      dismissSplash();
    }, 1100);

    return () => clearTimeout(timer);
  }, [dismissSplash]);

  return (
    <div
      id="splash-screen"
      onClick={dismissSplash}
      className={`fixed inset-0 z-50 w-full max-w-[440px] mx-auto min-h-screen bg-gradient-to-b from-white via-slate-50 to-[#FFF5F5] flex flex-col justify-between items-center py-12 px-6 overflow-hidden select-none cursor-pointer transition-opacity duration-300 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top bar: Version badge & sober Skip button */}
      <div className="w-full flex items-center justify-between z-10">
        <span className="text-[11px] font-mono font-medium text-slate-400 tracking-wider">
          v2.4.0
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            dismissSplash();
          }}
          className="px-3 py-1 rounded-full text-xs font-semibold text-slate-500 bg-slate-100/90 hover:bg-slate-200 active:scale-95 transition-all shadow-xs border border-slate-200/60 cursor-pointer"
        >
          Skip
        </button>
      </div>

      {/* Main Center Branding (Sober & Elegant) */}
      <div className="flex flex-col items-center justify-center my-auto">
        <div className="transition-transform duration-500 transform scale-100">
          <PrismLogo size="xl" showText={true} />
        </div>

        <div className="mt-7 text-center">
          <p className="text-base font-bold text-slate-800 tracking-wide font-sans">
            Play Smart <span className="text-[#FF5252] mx-1">•</span> Win Big
          </p>
          <p className="text-xs font-medium text-slate-400 tracking-wider mt-1">
            Fair & Transparent Color Prediction
          </p>
        </div>
      </div>

      {/* Bottom Loading Progress & Status */}
      <div className="w-full flex flex-col items-center z-10 max-w-xs">
        <div className="w-40 h-1.5 bg-slate-200/80 rounded-full overflow-hidden mb-3 shadow-inner">
          <div className="h-full w-full bg-gradient-to-r from-[#FF7875] via-[#FA3534] to-[#D91E18] rounded-full animate-pulse" />
        </div>
        <p className="text-[11px] text-slate-400 font-medium tracking-wide">
          Connecting to secure server...
        </p>
        <span className="text-[10px] text-slate-400/80 mt-2">
          Tap anywhere to continue
        </span>
      </div>

      {/* Subtle bottom wave decoration */}
      <div className="absolute -bottom-12 left-0 right-0 h-32 pointer-events-none overflow-hidden opacity-30">
        <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0.00,49.98 C150.00,150.00 349.20,-49.00 500.00,49.98 L500.00,150.00 L0.00,150.00 Z"
            fill="#FA3534"
          />
        </svg>
      </div>
    </div>
  );
};
