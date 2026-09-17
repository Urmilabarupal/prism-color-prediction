/**
 * High-precision USD currency & money math utilities
 * Uses cent integers under the hood to completely avoid IEEE-754 floating point rounding bugs.
 */

export function toCents(usd: number): number {
  return Math.round((Number(usd) || 0) * 100);
}

export function fromCents(cents: number): number {
  return (Math.round(cents) || 0) / 100;
}

export function roundUsd(amount: number): number {
  return fromCents(toCents(amount));
}

export function addUsd(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

export function subtractUsd(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

export function multiplyUsd(amount: number, factor: number): number {
  return fromCents(Math.round(toCents(amount) * factor));
}

/**
 * Standard USD formatter: e.g. "$125.50" or "$1,250.00"
 */
export function formatUsd(amount: number | undefined | null, includeSign: boolean = false): string {
  const safeVal = roundUsd(Number(amount) || 0);
  const formatted = Math.abs(safeVal).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (includeSign && safeVal > 0) {
    return `+$${formatted}`;
  } else if (safeVal < 0) {
    return `-$${formatted}`;
  }
  return `$${formatted}`;
}
