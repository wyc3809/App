import type { HistoricalSnapshot, TimeRange } from "./types";

export interface GrowthDelta {
  absolute: number;
  percent: number;
  fromDate: string;
  toDate: string;
  fromValue: number;
  toValue: number;
}

export interface MonthlyGrowthPoint {
  /** YYYY-MM */
  month: string;
  label: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  /** Absolute change vs previous month (null for first month) */
  absoluteChange: number | null;
  /** Percent change vs previous month (null for first month) */
  percentChange: number | null;
  snapshotDate: string;
}

function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

/** Latest snapshot on or before `targetISO`, searching from newest. */
function snapshotOnOrBefore(
  sortedAsc: HistoricalSnapshot[],
  targetISO: string,
): HistoricalSnapshot | null {
  for (let i = sortedAsc.length - 1; i >= 0; i--) {
    if (sortedAsc[i].date <= targetISO) return sortedAsc[i];
  }
  return null;
}

/**
 * Month-over-month net worth growth:
 * latest snapshot vs last snapshot in the previous calendar month
 * (falls back to the nearest older snapshot ~30 days back).
 */
export function computeMonthlyGrowth(
  snapshots: HistoricalSnapshot[],
): GrowthDelta | null {
  if (snapshots.length === 0) return null;

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const older = sorted.filter((s) => s.date < latest.date);
  if (older.length === 0) return null;

  const latestMonth = monthKey(latest.date);
  const [y, m] = latestMonth.split("-").map(Number);
  const prev = new Date(y, m - 2, 1);
  const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const inPrevMonth = older.filter((s) => monthKey(s.date) === prevMonth);
  let baseline: HistoricalSnapshot | null =
    inPrevMonth.length > 0 ? inPrevMonth[inPrevMonth.length - 1] : null;

  if (!baseline) {
    const latestDate = new Date(`${latest.date}T00:00:00`);
    const prior = new Date(latestDate);
    prior.setDate(prior.getDate() - 30);
    const priorISO = prior.toISOString().slice(0, 10);
    baseline = snapshotOnOrBefore(older, priorISO) ?? older[older.length - 1];
  }

  const absolute = latest.netWorthBaseCurrency - baseline.netWorthBaseCurrency;
  const percent =
    baseline.netWorthBaseCurrency === 0
      ? 0
      : (absolute / Math.abs(baseline.netWorthBaseCurrency)) * 100;

  return {
    absolute,
    percent,
    fromDate: baseline.date,
    toDate: latest.date,
    fromValue: baseline.netWorthBaseCurrency,
    toValue: latest.netWorthBaseCurrency,
  };
}

/**
 * One point per calendar month (last snapshot in that month), with MoM deltas.
 */
export function buildMonthlyGrowthSeries(
  snapshots: HistoricalSnapshot[],
): MonthlyGrowthPoint[] {
  if (snapshots.length === 0) return [];

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const byMonth = new Map<string, HistoricalSnapshot>();

  for (const snap of sorted) {
    byMonth.set(monthKey(snap.date), snap);
  }

  const months = [...byMonth.keys()].sort();
  const points: MonthlyGrowthPoint[] = [];

  for (let i = 0; i < months.length; i++) {
    const key = months[i];
    const snap = byMonth.get(key)!;
    const prev = i > 0 ? byMonth.get(months[i - 1]) : undefined;
    const absoluteChange = prev
      ? snap.netWorthBaseCurrency - prev.netWorthBaseCurrency
      : null;
    const percentChange =
      prev == null
        ? null
        : prev.netWorthBaseCurrency === 0
          ? 0
          : ((snap.netWorthBaseCurrency - prev.netWorthBaseCurrency) /
              Math.abs(prev.netWorthBaseCurrency)) *
            100;

    points.push({
      month: key,
      label: monthLabel(key),
      netWorth: snap.netWorthBaseCurrency,
      assets: snap.totalAssetsBaseCurrency,
      liabilities: snap.totalLiabilitiesBaseCurrency,
      absoluteChange,
      percentChange,
      snapshotDate: snap.date,
    });
  }

  return points;
}

export function filterMonthlySeriesByRange(
  points: MonthlyGrowthPoint[],
  range: TimeRange,
): MonthlyGrowthPoint[] {
  if (range === "ALL" || points.length === 0) return points;
  const months =
    range === "1M" ? 1 : range === "3M" ? 3 : range === "6M" ? 6 : 12;
  return points.slice(-Math.max(months, 1));
}
