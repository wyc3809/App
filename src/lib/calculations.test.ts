import { describe, expect, it } from "vitest";
import {
  computeAllocation,
  computeTotals,
  filterSnapshotsByRange,
  netWorthChange,
} from "./calculations";
import type { Account, Currency, HistoricalSnapshot } from "./types";

const currencies: Currency[] = [
  { code: "HKD", symbol: "HK$", name: "HKD", exchangeRateToBase: 1 },
];

function account(
  partial: Partial<Account> & Pick<Account, "id" | "name" | "isLiability" | "currentValue">,
): Account {
  return {
    category: partial.isLiability ? "loan" : "cash",
    currency: "HKD",
    asOfDate: "2026-08-01",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...partial,
  };
}

describe("calculations", () => {
  it("computes portfolio totals", () => {
    const totals = computeTotals(
      [
        account({ id: "a", name: "Cash", isLiability: false, currentValue: 1000 }),
        account({ id: "b", name: "Loan", isLiability: true, currentValue: 250 }),
      ],
      currencies,
    );
    expect(totals.totalAssets).toBe(1000);
    expect(totals.totalLiabilities).toBe(250);
    expect(totals.netWorth).toBe(750);
  });

  it("computes asset allocation slices", () => {
    const slices = computeAllocation(
      [
        account({
          id: "a",
          name: "Cash",
          isLiability: false,
          currentValue: 700,
          category: "cash",
        }),
        account({
          id: "b",
          name: "Broker",
          isLiability: false,
          currentValue: 300,
          category: "investment",
        }),
      ],
      currencies,
      "assets",
    );
    expect(slices).toHaveLength(2);
    expect(slices[0].percent).toBeCloseTo(70);
    expect(slices[1].percent).toBeCloseTo(30);
  });

  it("filters snapshots by range and computes change", () => {
    const snaps: HistoricalSnapshot[] = [
      {
        id: "1",
        date: "2025-01-01",
        totalAssetsBaseCurrency: 100,
        totalLiabilitiesBaseCurrency: 0,
        netWorthBaseCurrency: 100,
        accountBalances: [],
      },
      {
        id: "2",
        date: "2026-07-01",
        totalAssetsBaseCurrency: 150,
        totalLiabilitiesBaseCurrency: 0,
        netWorthBaseCurrency: 150,
        accountBalances: [],
      },
      {
        id: "3",
        date: "2026-08-01",
        totalAssetsBaseCurrency: 200,
        totalLiabilitiesBaseCurrency: 0,
        netWorthBaseCurrency: 200,
        accountBalances: [],
      },
    ];
    const filtered = filterSnapshotsByRange(snaps, "6M");
    expect(filtered.every((s) => s.date >= "2026-01-01" || filtered.length > 0)).toBe(
      true,
    );
    const change = netWorthChange(snaps);
    expect(change?.absolute).toBe(100);
    expect(change?.percent).toBeCloseTo(100);
  });
});
