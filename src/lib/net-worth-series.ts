import { toBaseCurrency } from "./currencies";
import { balanceOnDate, liabilityStateOnDate } from "./ledger";
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

/** Portfolio net worth on a calendar date (carry-forward). 0 if nothing existed yet. */
export function netWorthOnDate(
  accounts: Account[],
  valueEntries: AccountValueEntry[],
  currencies: Currency[],
  date: string,
  snapshots: HistoricalSnapshot[] = [],
): number {
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
    const isLiability = liabilityStateOnDate(
      valueEntries,
      account.id,
      date,
      account.isLiability,
    );
    const magnitude = isLiability ? Math.abs(bal) : bal;
    const base = toBaseCurrency(magnitude, account.currency, currencies);
    if (isLiability) totalLiabilities += base;
    else totalAssets += base;
  }

  if (any) {
    return Number((totalAssets - totalLiabilities).toFixed(2));
  }

  const onOrBefore = snapshots
    .filter((s) => s.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (onOrBefore[0]) return onOrBefore[0].netWorthBaseCurrency;
  return 0;
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
    const hasEntryHistory = accounts.some((account) =>
      valueEntries.some((e) => e.accountId === account.id && e.date <= date),
    );
    if (hasEntryHistory || snapshots.some((s) => s.date === date)) {
      points.push({
        date,
        netWorth: netWorthOnDate(
          accounts,
          valueEntries,
          currencies,
          date,
          snapshots,
        ),
      });
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

/**
 * With only one history point the home chart used to stay empty.
 * Anchor against calendar YTD (Jan 1 → today) so a single update still draws a line.
 */
export function withYtdComparisonAnchor(
  points: NetWorthPoint[],
  accounts: Account[],
  valueEntries: AccountValueEntry[],
  currencies: Currency[],
  snapshots: HistoricalSnapshot[] = [],
  now = new Date(),
): NetWorthPoint[] {
  if (points.length !== 1) return points;

  const alone = points[0];
  const ytdStart = rangeCutoffISO("YTD", now);
  const today = now.toISOString().slice(0, 10);
  if (!ytdStart) return points;

  if (alone.date > ytdStart) {
    const baseline = netWorthOnDate(
      accounts,
      valueEntries,
      currencies,
      ytdStart,
      snapshots,
    );
    return [{ date: ytdStart, netWorth: baseline }, alone];
  }

  // Only point is on/before Jan 1 — stretch forward to today for a comparable line.
  if (alone.date < today) {
    return [alone, { date: today, netWorth: alone.netWorth }];
  }

  return points;
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
