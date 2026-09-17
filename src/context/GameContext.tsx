import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { BetRecord, BetSelection, BetType, GameMode, GameRound, RoundResult } from '../types.js';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';
import { sound } from '../services/sound.js';
import { calculateClientRound } from '../utils/gameRules.js';

export interface WinResultData {
  round: RoundResult;
  bet: BetRecord;
  allBets?: BetRecord[];
}

interface GameContextType {
  mode: GameMode;
  setMode: (mode: GameMode) => void;
  currentRound: GameRound | null;
  timeLeft: number;
  isBettingOpen: boolean;
  history: RoundResult[];
  myBets: BetRecord[];
  refreshGameData: () => Promise<void>;
  placeBet: (params: { type: BetType; selection: BetSelection; amount: number }) => Promise<{ success: boolean; message: string }>;
  lastWinResult: WinResultData | null;
  setLastWinResult: (data: WinResultData | null) => void;
  clearLastWinResult: () => void;
  soundEnabled: boolean;
  toggleSound: () => boolean;
  loading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser, updateUserBalance } = useAuth();
  const [mode, setMode] = useState<GameMode>('1min');
  const [currentRound, setCurrentRound] = useState<GameRound>(() => calculateClientRound('1min'));
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isBettingOpen, setIsBettingOpen] = useState<boolean>(true);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [myBets, setMyBets] = useState<BetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastWinResult, setLastWinResult] = useState<WinResultData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.isEnabled());

  const prevPeriodIdRef = useRef<string | null>(null);
  const serverOffsetRef = useRef<number>(0);
  const lastBeepedSecondRef = useRef<number | null>(null);
  const seenResolvedBetIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef<boolean>(true);
  const isSyncingRef = useRef<boolean>(false);
  const lastExpiredSyncPeriodRef = useRef<string | null>(null);

  // Sync sound setting changes
  useEffect(() => {
    const unsub = sound.subscribe((enabled) => {
      setSoundEnabled(enabled);
    });
    return unsub;
  }, []);

  const toggleSound = () => {
    return sound.toggle();
  };

  const syncWithServer = async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      const data = await api.getCurrentRound(mode);
      if (data && data.round) {
        const clientNow = Date.now();
        if (typeof data.round.serverTime === 'number') {
          serverOffsetRef.current = data.round.serverTime - clientNow;
        }

        setCurrentRound(data.round);
        if (data.history && data.history.length > 0) {
          setHistory(data.history);
        }

        if (user) {
          const updatedBets = await api.getMyBets(user.id, mode);
          if (Array.isArray(updatedBets)) {
            setMyBets(updatedBets);

            // If this is the initial load, record existing completed bets so we don't spam popups on launch
            if (isFirstLoadRef.current) {
              updatedBets.forEach((b) => {
                if (b.status === 'WON' || b.status === 'LOST') {
                  seenResolvedBetIdsRef.current.add(b.id);
                }
              });
              isFirstLoadRef.current = false;
            } else {
              // Check for newly completed bets that have not been shown in popup yet
              const newlyResolved = updatedBets.filter(
                (b) => (b.status === 'WON' || b.status === 'LOST') && !seenResolvedBetIdsRef.current.has(b.id)
              );

              if (newlyResolved.length > 0) {
                // Group by the period of the first unresolved bet
                const targetPeriodId = newlyResolved[0].periodId;
                const periodBets = newlyResolved.filter((b) => b.periodId === targetPeriodId);

                // Mark all of these as processed so popup only fires once per bet
                periodBets.forEach((b) => seenResolvedBetIdsRef.current.add(b.id));

                // Find matching round result in history or reconstruct from bet result details
                let matchedRound = (data.history || []).find((h) => h.periodId === targetPeriodId);
                if (!matchedRound) {
                  const b = periodBets[0];
                  matchedRound = {
                    periodId: targetPeriodId,
                    mode: b.mode,
                    number: b.resultNumber ?? 0,
                    colors: b.resultColors ?? ['green'],
                    bigSmall: b.resultBigSmall ?? 'small',
                    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    timestamp: Date.now(),
                  };
                }

                refreshUser();
                setLastWinResult({
                  round: matchedRound,
                  bet: periodBets[0],
                  allBets: periodBets,
                });
              }
            }
          }
        }

        prevPeriodIdRef.current = data.round.periodId;
      }
    } catch {
      // Graceful fallback to client calculation without uncaught console noise
      setCurrentRound((prev) => prev || calculateClientRound(mode, serverOffsetRef.current));
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Sync on mode change
  useEffect(() => {
    setLoading(true);
    // Immediately calculate client round for instant feedback while server syncs
    setCurrentRound(calculateClientRound(mode, serverOffsetRef.current));
    syncWithServer().finally(() => setLoading(false));
  }, [mode]);

  // Load user's bets when user or mode changes
  useEffect(() => {
    if (user) {
      api.getMyBets(user.id, mode).then((bets) => {
        if (Array.isArray(bets)) {
          setMyBets(bets);
          if (isFirstLoadRef.current) {
            bets.forEach((b) => {
              if (b.status === 'WON' || b.status === 'LOST') {
                seenResolvedBetIdsRef.current.add(b.id);
              }
            });
            isFirstLoadRef.current = false;
          }
        }
      }).catch(() => {});
    } else {
      setMyBets([]);
    }
  }, [user?.id, mode]);

  // High-precision server synchronized countdown with audio ticks & beeps
  useEffect(() => {
    const timer = setInterval(() => {
      const activeRound = currentRound || calculateClientRound(mode, serverOffsetRef.current);
      const correctedNow = Date.now() + serverOffsetRef.current;
      const remainingMs = activeRound.endTime - correctedNow;
      const secondsLeft = Math.max(0, Math.floor(remainingMs / 1000));

      setTimeLeft(secondsLeft);
      setIsBettingOpen(secondsLeft > 5);

      // Play timer sounds when seconds transition
      if (lastBeepedSecondRef.current !== secondsLeft) {
        lastBeepedSecondRef.current = secondsLeft;

        // Final 5 seconds countdown beeps (5, 4, 3, 2, 1) and 0 (locking chime)
        if (secondsLeft <= 5 && secondsLeft >= 0) {
          sound.playCountdownBeep(secondsLeft);
        } else if (secondsLeft <= 10 && secondsLeft > 5) {
          // Subtle tick for final 10 seconds
          sound.playTick();
        }
      }

      // When round expires (secondsLeft <= 0), trigger sync ONCE for this period
      if (secondsLeft <= 0) {
        if (lastExpiredSyncPeriodRef.current !== activeRound.periodId) {
          lastExpiredSyncPeriodRef.current = activeRound.periodId;
          syncWithServer();
        }
        // If more than 2 seconds past expiration without a new server round, roll over locally
        if (remainingMs < -2000) {
          setCurrentRound(calculateClientRound(mode, serverOffsetRef.current));
        }
      }
    }, 400); // 400ms interval guarantees no skipped second

    return () => clearInterval(timer);
  }, [currentRound, user?.id, mode]);

  // Periodic heartbeat sync every 3 seconds to guarantee prompt resolution
  useEffect(() => {
    const heartbeat = setInterval(() => {
      syncWithServer();
    }, 3000);
    return () => clearInterval(heartbeat);
  }, [mode, user?.id]);

  const placeBet = async (params: { type: BetType; selection: BetSelection; amount: number }) => {
    if (!user) {
      return { success: false, message: 'Please login to place a bet' };
    }
    if (!currentRound) {
      return { success: false, message: 'Current round not available' };
    }

    try {
      const res = await api.placeBet({
        userId: user.id,
        mode,
        periodId: currentRound.periodId,
        type: params.type,
        selection: params.selection,
        amount: params.amount,
      });

      if (res.success && res.bet) {
        sound.playBetPlaced();
        setMyBets((prev) => [res.bet!, ...prev]);
        if (res.newBalance !== undefined) {
          updateUserBalance(res.newBalance);
        }
        return { success: true, message: res.message || 'Bet placed successfully!' };
      } else {
        return { success: false, message: res.message || 'Failed to place bet' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Error placing bet' };
    }
  };

  const clearLastWinResult = () => {
    setLastWinResult(null);
  };

  return (
    <GameContext.Provider
      value={{
        mode,
        setMode,
        currentRound,
        timeLeft,
        isBettingOpen,
        history,
        myBets,
        refreshGameData: syncWithServer,
        placeBet,
        lastWinResult,
        setLastWinResult,
        clearLastWinResult,
        soundEnabled,
        toggleSound,
        loading,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
