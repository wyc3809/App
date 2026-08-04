import { describe, expect, it } from "vitest";
import {
  buildInsightGrowthBars,
  computeInsightSummary,
  filterMonthlyByInsightRange,
  growthBarLabelYs,
} from "./insights";
import { buildMonthlyGrowthSeries } from "./growth";
import type { HistoricalSnapshot } from "./types";

function snap(
  date: string,
  netWorth: number,
  assets = netWorth + 50,
  liabilities = 50,
): HistoricalSnapshot {
  return {
    id: date,
    date,
    totalAssetsBaseCurrency: assets,
    totalLiabilitiesBaseCurrency: liabilities,
    netWorthBaseCurrency: netWorth,
    accountBalances: [],
  };
}

describe("insights", () => {
  const snapshots = [
    snap("2025-12-01", 1000),
    snap("2026-01-15", 1100),
    snap("2026-02-15", 1050),
    snap("2026-03-15", 1200),
    snap("2026-04-15", 1300),
  ];

  it("filters monthly series by 6M / YTD", () => {
    const monthly = buildMonthlyGrowthSeries(snapshots);
    const six = filterMonthlyByInsightRange(monthly, "6M");
    expect(six.length).toBeLessThanOrEqual(6);
    const ytd = filterMonthlyByInsightRange(
      monthly,
      "YTD",
      new Date("2026-08-01"),
    );
    expect(ytd.every((p) => p.month.startsWith("2026"))).toBe(true);
  });

  it("builds MoM growth bars skipping baseline", () => {
    const bars = buildInsightGrowthBars(snapshots, "monthly", "ALL");
    expect(bars.length).toBe(4);
    expect(bars[0].change).toBeCloseTo(100);
    expect(bars[1].change).toBeCloseTo(-50);
  });

  it("aggregates quarterly growth", () => {
    const bars = buildInsightGrowthBars(snapshots, "quarterly", "ALL");
    expect(bars.length).toBeGreaterThanOrEqual(1);
  });

  it("computes summary cards", () => {
    const summary = computeInsightSummary(snapshots, "ALL");
    expect(summary).not.toBeNull();
    expect(summary!.netWorth).toBe(1300);
    expect(summary!.periodChange).toBeCloseTo(300);
    expect(summary!.sparkline.length).toBe(5);
  });

  it("places negative growth labels below the bar tip", () => {
    // Positive bar: y is top of rect
    expect(growthBarLabelYs(100, 80, 500)).toEqual({
      amountY: 84,
      percentY: 96,
    });
    // Negative bar: y is top (near zero), height extends downward
    expect(growthBarLabelYs(120, 80, -35000)).toEqual({
      amountY: 212,
      percentY: 224,
    });
    // Negative bar: y is tip, height is negative toward zero
    expect(growthBarLabelYs(200, -80, -35000)).toEqual({
      amountY: 212,
      percentY: 224,
    });
  });
});
