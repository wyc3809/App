/** Helpers for amount inputs that expose an explicit +/- sign control. */

export type AmountSign = 1 | -1;

/** Split a numeric value into UI magnitude (non-negative string) + sign. */
export function splitSignedAmount(value: number): {
  magnitude: string;
  sign: AmountSign;
} {
  if (!Number.isFinite(value) || value === 0) {
    return { magnitude: String(Math.abs(value) || 0), sign: 1 };
  }
  return {
    magnitude: String(Math.abs(value)),
    sign: value < 0 ? -1 : 1,
  };
}

/**
 * Combine magnitude text + sign into a finite number.
 * Empty / invalid magnitude → null.
 */
export function combineSignedAmount(
  magnitude: string,
  sign: AmountSign,
): number | null {
  const trimmed = magnitude.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return sign * Math.abs(n);
}

export function flipAmountSign(sign: AmountSign): AmountSign {
  return sign === 1 ? -1 : 1;
}
