import { toBaseCurrency } from "./currencies";
import { balanceOnDate } from "./ledger";
import type {
  Account,
  AccountValueEntry,
  Currency,
  HistoricalSnapshot,
  TimeRange,
} from "./types";

export type ChartRange = TimeRange | "YTD" | "2Y" | "4Y" | "5Y" | "8Y";

export interface NetWorthPoint {
  date: string;
  netWorth: number;
}

/** Inclusive start date (YYYY-MM-DD) for a chart range, or null for ALL. */
export function rangeCutoffISO(range: ChartRange, now = new Date()): string | null {
  if (range === "ALL") return null;
  const iso = now.toISOString().slice(0, 10);
  const [y, m, d] = iso.split("-").map(Number);
  if (range === "YTD") return `${y}-01-01`;

  const pad = (n: number) => String(n).padStart(2, "0");
  if (range === "1Y") return `${y - 1}-${pad(m)}-${pad(d)}`;
  if (range === "2Y") return `${y - 2}-${pad(m)}-${pad(d)}`;
  if (range === "4Y") return `${y - 4}-${pad(m)}-${pad(d)}`;
  if (range === "5Y") return `${y - 5}-${pad(m)}-${pad(d)}`;
  if (range === "8Y") return `${y - 8}-${pad(m)}-${pad(d)}`;

  const days =
    range === "1M" ? 30 : range === "3M" ? 90 : range === "6M" ? 180 : 365;
  const cutoff = new Date(Date.UTC(y, m - 1, d));
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString().slice(0, 10);
}

/**
 * Rebuild portfolio net worth on every date that appears in value history
 * (carry-forward per account). Falls back to snapshots when no entries exist.
 */
export function buildNetWorthSeries(
  accounts: Account[],
  valueEntries: AccountValueEntry[],
  currencies: Currency[],
  snapshots: HistoricalSnapshot[] = [],
): NetWorthPoint[] {
  const dates = new Set<string>();
  for (const e of valueEntries) dates.add(e.date);
  for (const s of snapshots) dates.add(s.date);

  if (dates.size === 0) return [];

  const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));
  const points: NetWorthPoint[] = [];

  for (const date of sortedDates) {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let any = false;

    for (const account of accounts) {
      const hasHistory = valueEntries.some(
        (e) => e.accountId === account.id && e.date <= date,
      );
      if (!hasHistory) continue;
      any = true;
      const bal = balanceOnDate(valueEntries, account.id, date, account.currentValue);
      const base = toBaseCurrency(bal, account.currency, currencies);
      if (account.isLiability) totalLiabilities += base;
      else totalAssets += base;
    }

    if (any) {
      points.push({
        date,
        netWorth: Number((totalAssets - totalLiabilities).toFixed(2)),
      });
      continue;
    }

    const snap = snapshots.find((s) => s.date === date);
    if (snap) {
      points.push({ date, netWorth: snap.netWorthBaseCurrency });
    }
  }

  return points;
}

export function filterNetWorthSeries(
  points: NetWorthPoint[],
  range: ChartRange,
  now = new Date(),
): NetWorthPoint[] {
  if (points.length === 0) return [];
  const cutoff = rangeCutoffISO(range, now);
  if (!cutoff) return points;
  const filtered = points.filter((p) => p.date >= cutoff);
  return filtered.length > 0 ? filtered : points.slice(-1);
}

/** Domain for the chart X axis so year ranges keep a truthful time scale. */
export function chartDomainForRange(
  range: ChartRange,
  points: NetWorthPoint[],
  now = new Date(),
): [string, string] | ["dataMin", "dataMax"] {
  const today = now.toISOString().slice(0, 10);
  const cutoff = rangeCutoffISO(range, now);
  if (!cutoff || points.length === 0) return ["dataMin", "dataMax"];
  const first = points[0]?.date ?? cutoff;
  const start = first < cutoff ? cutoff : first;
  // If we have history before the window, still start at cutoff so empty years show.
  const oldest = points[0].date;
  if (oldest <= cutoff) return [cutoff, today];
  return [start, today];
}
