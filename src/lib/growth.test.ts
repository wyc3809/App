import { describe, expect, it } from "vitest";
import {
  buildMonthlyGrowthSeries,
  computeMonthlyGrowth,
} from "./growth";
import { parseWorthBackup } from "./import-backup";
import type { HistoricalSnapshot } from "./types";

function snap(
  date: string,
  netWorth: number,
  assets = netWorth + 100,
  liabilities = 100,
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

describe("monthly growth", () => {
  it("computes MoM absolute and percent", () => {
    const snapshots = [
      snap("2026-06-15", 1000),
      snap("2026-07-15", 1100),
      snap("2026-08-01", 1210),
    ];
    const growth = computeMonthlyGrowth(snapshots);
    expect(growth).not.toBeNull();
    expect(growth!.fromDate).toBe("2026-07-15");
    expect(growth!.toDate).toBe("2026-08-01");
    expect(growth!.absolute).toBeCloseTo(110);
    expect(growth!.percent).toBeCloseTo(10);
  });

  it("builds one point per calendar month with MoM deltas", () => {
    const series = buildMonthlyGrowthSeries([
      snap("2026-05-10", 800),
      snap("2026-05-28", 850),
      snap("2026-06-20", 900),
      snap("2026-07-05", 1000),
    ]);
    expect(series).toHaveLength(3);
    expect(series[0].month).toBe("2026-05");
    expect(series[0].netWorth).toBe(850);
    expect(series[0].absoluteChange).toBeNull();
    expect(series[1].absoluteChange).toBe(50);
    expect(series[2].percentChange).toBeCloseTo((100 / 900) * 100);
  });
});

describe("import backup", () => {
  it("accepts a valid export payload", () => {
    const result = parseWorthBackup({
      exportedAt: "2026-08-02T00:00:00.000Z",
      settings: {
        baseCurrency: "HKD",
        isPrivacyMode: false,
        isBiometricEnabled: false,
        theme: "system",
      },
      currencies: [
        {
          code: "HKD",
          symbol: "HK$",
          name: "Hong Kong Dollar",
          exchangeRateToBase: 1,
        },
      ],
      accounts: [
        {
          id: "a1",
          name: "Cash",
          category: "cash",
          isLiability: false,
          currency: "HKD",
          currentValue: 100,
          updatedAt: "2026-08-01T00:00:00.000Z",
          createdAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      snapshots: [snap("2026-08-01", 100, 100, 0)],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.accounts).toHaveLength(1);
      expect(result.data.snapshots).toHaveLength(1);
    }
  });

  it("rejects invalid JSON shapes", () => {
    expect(parseWorthBackup(null).ok).toBe(false);
    expect(parseWorthBackup({ settings: {} }).ok).toBe(false);
    expect(
      parseWorthBackup({
        settings: {
          baseCurrency: "HKD",
          isPrivacyMode: false,
          isBiometricEnabled: false,
          theme: "system",
        },
        accounts: "nope",
        snapshots: [],
      }).ok,
    ).toBe(false);
  });
});
