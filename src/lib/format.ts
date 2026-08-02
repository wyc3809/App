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

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
