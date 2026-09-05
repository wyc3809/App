import type { Currency } from "./types";
import { getCurrencyMap } from "./currencies";

export function formatMoney(
  amount: number,
  currencyCode: string,
  currencies: Currency[],
  options?: { privacy?: boolean; compact?: boolean; showSign?: boolean },
): string {
  if (options?.privacy) return "••••••";

  const map = getCurrencyMap(currencies);
  const currency = map[currencyCode];
  const symbol = currency?.symbol ?? currencyCode;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : options?.showSign && amount > 0 ? "+" : "";

  let body: string;
  if (options?.compact && abs >= 1_000_000) {
    body = `${(abs / 1_000_000).toFixed(2)}M`;
  } else if (options?.compact && abs >= 10_000) {
    body = `${(abs / 1_000).toFixed(1)}K`;
  } else {
    body = abs.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  return `${sign}${symbol}${body}`;
}

export function formatPercent(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function todayISO(now: Date = new Date()): string {
  // Local calendar date — UTC slice breaks HTML date `max` near midnight in +TZ.
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
