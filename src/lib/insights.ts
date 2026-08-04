import { buildMonthlyGrowthSeries, type MonthlyGrowthPoint } from "./growth";
import type { HistoricalSnapshot } from "./types";

export type InsightGranularity = "monthly" | "quarterly" | "yearly";

export type InsightRange = "ALL" | "ALL1" | "YTD" | "6M" | "1Y" | "2Y" | "4Y";

export const INSIGHT_RANGES: { value: InsightRange; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ALL1", label: "All+1" },
  { value: "YTD", label: "YTD" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "2Y", label: "2Y" },
  { value: "4Y", label: "4Y" },
];

export interface InsightGrowthBar {
  key: string;
  label: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  change: number;
  percent: number;
  snapshotDate: string;
}

export interface InsightSummary {
  netWorth: number;
  periodChange: number;
  periodChangePercent: number;
  averageNetWorth: number;
  sparkline: { v: number }[];
}

function monthCountForRange(range: InsightRange): number | null {
  switch (range) {
    case "6M":
      return 6;
    case "1Y":
      return 12;
    case "2Y":
      return 24;
    case "4Y":
      return 48;
    default:
      return null;
  }
}

/** Filter monthly series by Insights range chips. */
export function filterMonthlyByInsightRange(
  points: MonthlyGrowthPoint[],
  range: InsightRange,
  now = new Date(),
): MonthlyGrowthPoint[] {
  if (points.length === 0) return [];
  if (range === "ALL" || range === "ALL1") return points;

  if (range === "YTD") {
    const y = now.getFullYear();
    const filtered = points.filter((p) => p.month.startsWith(`${y}-`));
    return filtered.length > 0 ? filtered : points.slice(-1);
  }

  const months = monthCountForRange(range);
  if (months != null) return points.slice(-months);
  return points;
}

function quarterKey(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  const q = Math.ceil(m / 3);
  return `${y}-Q${q}`;
}

function quarterLabel(key: string): string {
  const [y, q] = key.split("-");
  return `${q} ${y.slice(2)}`;
}

function yearKey(yyyyMm: string): string {
  return yyyyMm.slice(0, 4);
}

type Bucket = {
  key: string;
  label: string;
  point: MonthlyGrowthPoint;
};

function toBuckets(
  monthly: MonthlyGrowthPoint[],
  granularity: InsightGranularity,
): Bucket[] {
  if (granularity === "quarterly") {
    const map = new Map<string, MonthlyGrowthPoint>();
    for (const p of monthly) map.set(quarterKey(p.month), p);
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, point]) => ({ key, label: quarterLabel(key), point }));
  }
  if (granularity === "yearly") {
    const map = new Map<string, MonthlyGrowthPoint>();
    for (const p of monthly) map.set(yearKey(p.month), p);
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, point]) => ({ key, label: key, point }));
  }
  return monthly.map((p) => {
    const [y, m] = p.month.split("-");
    return { key: p.month, label: `${Number(m)}-${y}`, point: p };
  });
}

/** Period-over-period growth bars for the Insights chart. */
export function buildInsightGrowthBars(
  snapshots: HistoricalSnapshot[],
  granularity: InsightGranularity,
  range: InsightRange,
): InsightGrowthBar[] {
  const monthly = filterMonthlyByInsightRange(
    buildMonthlyGrowthSeries(snapshots),
    range,
  );
  if (monthly.length === 0) return [];

  const buckets = toBuckets(monthly, granularity);
  const bars: InsightGrowthBar[] = [];
  for (let i = 1; i < buckets.length; i++) {
    const cur = buckets[i];
    const prev = buckets[i - 1];
    const change = cur.point.netWorth - prev.point.netWorth;
    const percent =
      prev.point.netWorth === 0
        ? 0
        : (change / Math.abs(prev.point.netWorth)) * 100;
    bars.push({
      key: cur.key,
      label: cur.label,
      netWorth: cur.point.netWorth,
      assets: cur.point.assets,
      liabilities: cur.point.liabilities,
      change: Number(change.toFixed(2)),
      percent: Number(percent.toFixed(2)),
      snapshotDate: cur.point.snapshotDate,
    });
  }
  return bars;
}

export function buildAssetsLiabilitiesTrend(
  snapshots: HistoricalSnapshot[],
  range: InsightRange,
): { label: string; assets: number; liabilities: number; date: string }[] {
  const monthly = filterMonthlyByInsightRange(
    buildMonthlyGrowthSeries(snapshots),
    range,
  );
  return monthly.map((p) => {
    const [y, m] = p.month.split("-");
    return {
      label: `${Number(m)}-${y}`,
      assets: p.assets,
      liabilities: p.liabilities,
      date: p.snapshotDate,
    };
  });
}

export function computeInsightSummary(
  snapshots: HistoricalSnapshot[],
  range: InsightRange,
): InsightSummary | null {
  const monthly = filterMonthlyByInsightRange(
    buildMonthlyGrowthSeries(snapshots),
    range,
  );
  if (monthly.length === 0) return null;

  const last = monthly[monthly.length - 1];
  const first = monthly[0];
  const periodChange = last.netWorth - first.netWorth;
  const periodChangePercent =
    first.netWorth === 0 ? 0 : (periodChange / Math.abs(first.netWorth)) * 100;
  const averageNetWorth =
    monthly.reduce((s, p) => s + p.netWorth, 0) / monthly.length;

  return {
    netWorth: last.netWorth,
    periodChange: Number(periodChange.toFixed(2)),
    periodChangePercent: Number(periodChangePercent.toFixed(2)),
    averageNetWorth: Number(averageNetWorth.toFixed(2)),
    sparkline: monthly.map((p) => ({ v: p.netWorth })),
  };
}

export function growthChartTitle(granularity: InsightGranularity): string {
  if (granularity === "quarterly") return "Quarterly Growth";
  if (granularity === "yearly") return "Yearly Growth";
  return "Monthly Growth";
}

export function rangeSubtitle(
  granularity: InsightGranularity,
  range: InsightRange,
): string {
  const g =
    granularity === "monthly"
      ? "Monthly"
      : granularity === "quarterly"
        ? "Quarterly"
        : "Yearly";
  const r =
    range === "ALL" || range === "ALL1"
      ? "all time"
      : range === "YTD"
        ? "this year"
        : `the last ${range}`;
  return `${g} growth over ${r}`;
}
