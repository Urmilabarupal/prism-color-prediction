import { GameMode, GameRound, RoundResult } from '../types.js';

export const MODE_DURATIONS: Record<GameMode, number> = {
  '1min': 60,
  '3min': 180,
  '5min': 300,
  '10min': 600,
};

export function getPeriodInfo(mode: GameMode, timestamp: number = Date.now()): {
  periodId: string;
  timeLeft: number;
  totalDuration: number;
  isBettingOpen: boolean;
  startTime: number;
  endTime: number;
  bettingEndTime: number;
} {
  const duration = MODE_DURATIONS[mode] || 60;
  const date = new Date(timestamp);

  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const secondsSinceMidnight = Math.floor((timestamp - midnight) / 1000);

  const roundIndex = Math.max(0, Math.floor(secondsSinceMidnight / duration));
  const secondsIntoRound = secondsSinceMidnight % duration;
  const timeLeft = Math.max(0, duration - secondsIntoRound);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(roundIndex + 1).padStart(4, '0');
  const periodId = `${yyyy}${mm}${dd}${seq}`;

  const startTime = midnight + roundIndex * duration * 1000;
  const endTime = startTime + duration * 1000;
  const bettingEndTime = endTime - 5000;
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

export function calculateClientRound(mode: GameMode, serverOffset: number = 0): GameRound {
  const now = Date.now() + serverOffset;
  const info = getPeriodInfo(mode, now);
  return {
    periodId: info.periodId,
    mode,
    startTime: info.startTime,
    endTime: info.endTime,
    bettingEndTime: info.bettingEndTime,
    timeLeft: info.timeLeft,
    isBettingOpen: info.isBettingOpen,
    serverTime: now,
  };
}

export function generateFallbackRoundResult(periodId: string, mode: GameMode): RoundResult {
  const num = Math.floor(Math.random() * 10);
  const colors: ('green' | 'violet' | 'red')[] = [];
  if (num === 0) colors.push('red', 'violet');
  else if (num === 5) colors.push('green', 'violet');
  else if (num % 2 === 0) colors.push('red');
  else colors.push('green');

  return {
    periodId,
    mode,
    number: num,
    colors,
    bigSmall: num >= 5 ? 'big' : 'small',
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timestamp: Date.now(),
  };
}
