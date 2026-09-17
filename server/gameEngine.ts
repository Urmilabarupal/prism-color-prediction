import { BetRecord, BetSelection, BetType, GameMode, GameRound, RoundResult } from '../src/types.js';
import { addLedgerTransaction, getDb, saveDb } from './db.js';

const MODE_DURATIONS: Record<GameMode, number> = {
  '1min': 60,
  '3min': 180,
  '5min': 300,
  '10min': 600,
};

// Track resolved periods to prevent duplicate resolution
const resolvedPeriods = new Set<string>();

export function getPeriodInfo(mode: GameMode, timestamp: number = Date.now()): {
  periodId: string;
  timeLeft: number;
  totalDuration: number;
  isBettingOpen: boolean;
  startTime: number;
  endTime: number;
  bettingEndTime: number;
} {
  const duration = MODE_DURATIONS[mode];
  const date = new Date(timestamp);

  // Midnight timestamp
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const secondsSinceMidnight = Math.floor((timestamp - midnight) / 1000);

  const roundIndex = Math.floor(secondsSinceMidnight / duration);
  const secondsIntoRound = secondsSinceMidnight % duration;
  const timeLeft = duration - secondsIntoRound;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(roundIndex + 1).padStart(4, '0');
  const periodId = `${yyyy}${mm}${dd}${seq}`;

  const startTime = midnight + roundIndex * duration * 1000;
  const endTime = startTime + duration * 1000;
  const bettingEndTime = endTime - 5000; // 5 seconds before end

  const isBettingOpen = timeLeft > 5;

  return {
    periodId,
    timeLeft,
    totalDuration: duration,
    isBettingOpen,
    startTime,
    endTime,
    bettingEndTime,
  };
}

export function getCurrentRound(mode: GameMode): GameRound {
  const info = getPeriodInfo(mode);
  return {
    periodId: info.periodId,
    mode,
    startTime: info.startTime,
    endTime: info.endTime,
    bettingEndTime: info.bettingEndTime,
    timeLeft: info.timeLeft,
    isBettingOpen: info.isBettingOpen,
    serverTime: Date.now(),
  };
}

// Check and resolve any round that just finished
export function checkAndResolveRounds(): void {
  const modes: GameMode[] = ['1min', '3min', '5min', '10min'];
  const now = Date.now();

  for (const mode of modes) {
    const info = getPeriodInfo(mode, now);
    const prevTimestamp = now - 5000; // 5 seconds ago was previous round
    const prevInfo = getPeriodInfo(mode, prevTimestamp);

    if (prevInfo.periodId !== info.periodId && !resolvedPeriods.has(prevInfo.periodId)) {
      resolveRound(mode, prevInfo.periodId, prevTimestamp);
    }
  }
}

function resolveRound(mode: GameMode, periodId: string, timestamp: number): void {
  if (resolvedPeriods.has(periodId)) return;
  resolvedPeriods.add(periodId);

  const db = getDb();

  // Winning result generation: backend trusted pseudo-random logic
  const number = Math.floor(Math.random() * 10);
  const colors: ('green' | 'violet' | 'red')[] = [];
  if (number === 0) {
    colors.push('red', 'violet');
  } else if (number === 5) {
    colors.push('green', 'violet');
  } else if (number % 2 === 0) {
    colors.push('red');
  } else {
    colors.push('green');
  }

  const bigSmall: 'big' | 'small' = number >= 5 ? 'big' : 'small';

  const roundResult: RoundResult = {
    periodId,
    mode,
    number,
    colors,
    bigSmall,
    time: new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestamp,
  };

  // Add to history
  if (!db.roundsHistory[mode]) {
    db.roundsHistory[mode] = [];
  }
  if (!db.roundsHistory[mode].some((r) => r.periodId === periodId)) {
    db.roundsHistory[mode].unshift(roundResult);
    if (db.roundsHistory[mode].length > 100) {
      db.roundsHistory[mode].pop();
    }
  }

  // Settle all pending bets for this period & mode
  const pendingBets = db.bets.filter((b) => b.periodId === periodId && b.mode === mode && b.status === 'PENDING');
  const commissionPercent = db.systemSettings?.houseCommissionPercent ?? 2.0;
  const commissionMultiplier = (100 - commissionPercent) / 100;

  for (const bet of pendingBets) {
    let won = false;
    let multiplier = 0;

    if (bet.type === 'color') {
      const col = bet.selection as string;
      if (col === 'violet' && colors.includes('violet')) {
        won = true;
        multiplier = 4.5;
      } else if (col === 'green' && colors.includes('green')) {
        won = true;
        multiplier = number === 5 ? 1.5 : 2.0;
      } else if (col === 'red' && colors.includes('red')) {
        won = true;
        multiplier = number === 0 ? 1.5 : 2.0;
      }
    } else if (bet.type === 'number') {
      if (Number(bet.selection) === number) {
        won = true;
        multiplier = 9.0;
      }
    } else if (bet.type === 'bigSmall') {
      if (bet.selection === bigSmall) {
        won = true;
        multiplier = 2.0;
      }
    }

    bet.resolvedAt = Date.now();
    bet.resultNumber = number;
    bet.resultColors = colors;
    bet.resultBigSmall = bigSmall;

    if (won) {
      // Payout = bet.amount * multiplier * (1 - commission)
      const payout = Math.round(bet.amount * multiplier * commissionMultiplier * 100) / 100;
      bet.status = 'WON';
      bet.payout = payout;

      // Credit user
      const user = db.users[bet.userId];
      if (user) {
        const oldBal = user.balance;
        user.balance = Math.round((user.balance + payout) * 100) / 100;
        user.totalWinnings = Math.round(((user.totalWinnings || 0) + payout) * 100) / 100;

        addLedgerTransaction({
          userId: user.id,
          type: 'WIN',
          amount: payout,
          status: 'COMPLETED',
          description: `Win Payout: Win Go ${mode} Period ${periodId} (${bet.type} ${bet.selection})`,
          roundId: periodId,
          oldBalance: oldBal,
          newBalance: user.balance,
        });
      }
    } else {
      bet.status = 'LOST';
      bet.payout = 0;
    }
  }

  saveDb();
}

// Start interval loop
setInterval(() => {
  checkAndResolveRounds();
}, 1000);

export function placeUserBet(params: {
  userId: string;
  mode: GameMode;
  periodId: string;
  type: BetType;
  selection: BetSelection;
  amount: number;
}): { success: boolean; message: string; bet?: BetRecord; newBalance?: number } {
  const { userId, mode, periodId, type, selection, amount } = params;
  const db = getDb();

  const user = db.users[userId];
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (user.status === 'SUSPENDED') {
    return { success: false, message: 'Your account is suspended. Please contact customer support.' };
  }

  const numAmount = Math.round(Number(amount) * 100) / 100;
  if (numAmount <= 0 || isNaN(numAmount)) {
    return { success: false, message: 'Invalid bet amount' };
  }

  if (user.balance < numAmount) {
    return { success: false, message: 'Insufficient USD balance. Please recharge your wallet.' };
  }

  // Validate server period & timer
  const currentInfo = getPeriodInfo(mode);
  if (currentInfo.periodId !== periodId) {
    return {
      success: false,
      message: `Period ${periodId} has expired. Please bet on current period ${currentInfo.periodId}.`,
    };
  }

  if (!currentInfo.isBettingOpen) {
    return {
      success: false,
      message: 'Betting is closed for this period (final 5-second countdown). Wait for next round.',
    };
  }

  // Deduct balance atomically
  const oldBalance = user.balance;
  user.balance = Math.round((user.balance - numAmount) * 100) / 100;
  user.totalBets = Math.round(((user.totalBets || 0) + numAmount) * 100) / 100;

  const betRecord: BetRecord = {
    id: `bet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    periodId,
    mode,
    type,
    selection,
    amount: numAmount,
    payout: 0,
    status: 'PENDING',
    createdAt: Date.now(),
  };

  db.bets.unshift(betRecord);

  // Record transaction in ledger
  addLedgerTransaction({
    userId,
    type: 'BET',
    amount: numAmount,
    status: 'COMPLETED',
    description: `Bet on Win Go ${mode} Period ${periodId} (${type} ${selection})`,
    roundId: periodId,
    oldBalance,
    newBalance: user.balance,
  });

  saveDb();

  return {
    success: true,
    message: 'Bet placed successfully!',
    bet: betRecord,
    newBalance: user.balance,
  };
}

export function getActiveRoundsSummary(): {
  mode: GameMode;
  periodId: string;
  timeLeft: number;
  totalBetsCount: number;
  totalBetVolumeUsd: number;
  isBettingOpen: boolean;
  colorBreakdown: { green: number; red: number; violet: number };
  sizeBreakdown: { big: number; small: number };
}[] {
  const modes: GameMode[] = ['1min', '3min', '5min', '10min'];
  const db = getDb();

  return modes.map((m) => {
    const info = getPeriodInfo(m);
    const roundBets = db.bets.filter((b) => b.mode === m && b.periodId === info.periodId && b.status === 'PENDING');
    const totalVolume = roundBets.reduce((sum, b) => sum + b.amount, 0);

    const colorBreakdown = { green: 0, red: 0, violet: 0 };
    const sizeBreakdown = { big: 0, small: 0 };

    roundBets.forEach((b) => {
      if (b.type === 'color') {
        const col = b.selection as 'green' | 'red' | 'violet';
        if (colorBreakdown[col] !== undefined) colorBreakdown[col] += b.amount;
      } else if (b.type === 'bigSmall') {
        const sz = b.selection as 'big' | 'small';
        if (sizeBreakdown[sz] !== undefined) sizeBreakdown[sz] += b.amount;
      }
    });

    return {
      mode: m,
      periodId: info.periodId,
      timeLeft: info.timeLeft,
      totalBetsCount: roundBets.length,
      totalBetVolumeUsd: Math.round(totalVolume * 100) / 100,
      isBettingOpen: info.isBettingOpen,
      colorBreakdown,
      sizeBreakdown,
    };
  });
}
