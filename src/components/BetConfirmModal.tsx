import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { BetSelection, BetType, GameMode } from '../types.js';
import { sound } from '../services/sound.js';

interface BetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (finalAmount: number) => Promise<void>;
  type: BetType;
  selection: BetSelection;
  baseAmount: number;
  multiplier: number;
  periodId: string;
  userBalance: number;
  mode: GameMode;
  loading: boolean;
}

export const BetConfirmModal: React.FC<BetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  selection,
  baseAmount,
  multiplier,
  periodId,
  userBalance,
  mode,
  loading,
}) => {
  const [agreeTerms, setAgreeTerms] = useState(true);

  const handleModalClose = () => {
    sound.playChipSelect();
    onClose();
  };

  if (!isOpen) return null;

  const totalAmount = baseAmount * multiplier;
  const isInsufficient = userBalance < totalAmount;

  const getSelectionTitle = () => {
    if (type === 'color') return `Color: ${String(selection).toUpperCase()}`;
    if (type === 'number') return `Number: ${selection}`;
    if (type === 'bigSmall') return `${String(selection).toUpperCase()} (0-4 Small, 5-9 Big)`;
    return String(selection);
  };

  const getMultiplierRate = () => {
    if (type === 'number') return '9x';
    if (type === 'color') {
      if (selection === 'violet') return '4.5x';
      return '2x (1.5x on split)';
    }
    return '2x';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Confirm Your Bet</h3>
            <p className="text-[11px] text-slate-400 font-points">Period: {periodId} ({mode})</p>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bet Details Card */}
        <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Selected Option:</span>
            <span className="font-extrabold text-slate-900">{getSelectionTitle()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Potential Payout Rate:</span>
            <span className="font-bold text-emerald-600">{getMultiplierRate()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Base Amount:</span>
            <span className="font-bold text-slate-800 font-mono">${baseAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Multiplier:</span>
            <span className="font-bold text-slate-800 font-mono">{multiplier}x</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
            <span className="font-bold text-slate-700">Total Bet Amount:</span>
            <span className="font-extrabold text-[#FA3534] font-mono">${totalAmount.toFixed(2)} USD</span>
          </div>
        </div>

        {/* Balance Status */}
        <div className="flex items-center justify-between text-xs px-1 mb-4">
          <span className="text-slate-500">Available Balance:</span>
          <span className={`font-bold font-mono ${isInsufficient ? 'text-red-500' : 'text-slate-800'}`}>
            ${userBalance.toFixed(2)} USD
          </span>
        </div>

        {isInsufficient && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold">
            Insufficient balance! Please recharge or decrease the bet amount.
          </div>
        )}

        {/* Terms checkbox */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 rounded text-[#FA3534] accent-[#FA3534]"
          />
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
            I agree to the Win Go presale prediction rules
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleModalClose}
            className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isInsufficient || !agreeTerms || loading}
            onClick={() => onConfirm(totalAmount)}
            className="flex-1 py-3 bg-gradient-to-r from-[#FF5252] to-[#FA3534] text-white font-extrabold rounded-xl text-xs shadow-md shadow-red-500/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>
                Confirm (<span className="font-mono">${totalAmount.toFixed(2)}</span>)
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
