import { CATEGORY_META } from "./categories";
import { toBaseCurrency } from "./currencies";
import type {
  Account,
  AccountCategory,
  Currency,
  HistoricalSnapshot,
  TimeRange,
} from "./types";

export interface PortfolioTotals {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

export function computeTotals(
  accounts: Account[],
  currencies: Currency[],
): PortfolioTotals {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const account of accounts) {
    const base = toBaseCurrency(account.currentValue, account.currency, currencies);
    if (account.isLiability) totalLiabilities += base;
    else totalAssets += base;
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}

export interface AllocationSlice {
  category: AccountCategory;
  label: string;
  value: number;
  color: string;
  percent: number;
}

export function computeAllocation(
  accounts: Account[],
  currencies: Currency[],
  mode: "assets" | "liabilities",
): AllocationSlice[] {
  const filtered = accounts.filter((a) =>
    mode === "assets" ? !a.isLiability : a.isLiability,
  );
  const byCategory = new Map<AccountCategory, number>();

  for (const account of filtered) {
    const base = toBaseCurrency(account.currentValue, account.currency, currencies);
    byCategory.set(account.category, (byCategory.get(account.category) ?? 0) + base);
  }

  const total = [...byCategory.values()].reduce((s, v) => s + v, 0);
  if (total <= 0) return [];

  return [...byCategory.entries()]
    .map(([category, value]) => ({
      category,
      label: CATEGORY_META[category].label,
      value,
      color: CATEGORY_META[category].color,
      percent: (value / total) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}

export function filterSnapshotsByRange(
  snapshots: HistoricalSnapshot[],
  range: TimeRange,
): HistoricalSnapshot[] {
  if (range === "ALL" || snapshots.length === 0) return snapshots;

  const days =
    range === "1M" ? 30 : range === "3M" ? 90 : range === "6M" ? 180 : 365;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString().slice(0, 10);

  const filtered = snapshots.filter((s) => s.date >= cutoffISO);
  return filtered.length > 0 ? filtered : snapshots.slice(-1);
}

export function netWorthChange(
  snapshots: HistoricalSnapshot[],
): { absolute: number; percent: number } | null {
  if (snapshots.length < 2) return null;
  const first = snapshots[0].netWorthBaseCurrency;
  const last = snapshots[snapshots.length - 1].netWorthBaseCurrency;
  const absolute = last - first;
  const percent = first === 0 ? 0 : (absolute / Math.abs(first)) * 100;
  return { absolute, percent };
}
