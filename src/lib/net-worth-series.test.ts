import { describe, expect, it } from "vitest";
import { DEFAULT_CURRENCIES } from "./currencies";
import {
  buildNetWorthSeries,
  chartDomainForRange,
  filterNetWorthSeries,
  rangeCutoffISO,
} from "./net-worth-series";
import type { Account, AccountValueEntry } from "./types";

function account(
  id: string,
  value: number,
  isLiability = false,
  currency = "HKD",
): Account {
  return {
    id,
    name: id,
    category: isLiability ? "loan" : "cash",
    isLiability,
    currency,
    currentValue: value,
    asOfDate: "2026-08-03",
    updatedAt: "2026-08-03T00:00:00.000Z",
    createdAt: "2020-01-01T00:00:00.000Z",
  };
}

function entry(
  accountId: string,
  date: string,
  value: number,
): AccountValueEntry {
  return {
    id: `${accountId}-${date}`,
    accountId,
    date,
    value,
    markOnGraph: true,
    createdAt: `${date}T00:00:00.000Z`,
  };
}

describe("net worth series from value history", () => {
  it("reconstructs multi-year net worth with carry-forward", () => {
    const accounts = [account("cash", 200), account("loan", 50, true)];
    const entries = [
      entry("cash", "2022-01-01", 100),
      entry("loan", "2022-01-01", 80),
      entry("cash", "2024-06-01", 180),
      entry("loan", "2025-01-01", 50),
      entry("cash", "2026-08-01", 200),
    ];
    const series = buildNetWorthSeries(accounts, entries, DEFAULT_CURRENCIES);
    expect(series[0]).toEqual({ date: "2022-01-01", netWorth: 20 });
    // 2024-06-01: cash 180, loan still 80 (carry)
    expect(series.find((p) => p.date === "2024-06-01")?.netWorth).toBe(100);
    expect(series.at(-1)?.netWorth).toBe(150);
  });

  it("filters 5Y to include old points inside the window", () => {
    const points = [
      { date: "2018-01-01", netWorth: 10 },
      { date: "2022-01-01", netWorth: 20 },
      { date: "2026-08-01", netWorth: 30 },
    ];
    const now = new Date("2026-08-03T00:00:00.000Z");
    const filtered = filterNetWorthSeries(points, "5Y", now);
    expect(filtered.map((p) => p.date)).toEqual(["2022-01-01", "2026-08-01"]);
    expect(rangeCutoffISO("5Y", now)).toBe("2021-08-03");
  });

  it("sets chart domain to the selected year window", () => {
    const now = new Date("2026-08-03T00:00:00.000Z");
    const points = [
      { date: "2020-01-01", netWorth: 1 },
      { date: "2026-08-01", netWorth: 2 },
    ];
    expect(chartDomainForRange("5Y", points, now)).toEqual([
      "2021-08-03",
      "2026-08-03",
    ]);
  });

  it("counts pre-flip balances as assets after later type flip", () => {
    const accounts = [account("cash", 50, true)];
    const entries: AccountValueEntry[] = [
      entry("cash", "2026-08-01", 100),
      {
        id: "flip",
        accountId: "cash",
        date: "2026-08-10",
        value: 50,
        markOnGraph: true,
        createdAt: "2026-08-10T00:00:00.000Z",
        transactionId: "tx1",
        delta: -150,
        typeFlip: {
          fromIsLiability: false,
          fromCategory: "cash",
          toIsLiability: true,
          toCategory: "loan",
        },
      },
    ];
    const series = buildNetWorthSeries(accounts, entries, DEFAULT_CURRENCIES);
    expect(series.find((p) => p.date === "2026-08-01")?.netWorth).toBe(100);
    expect(series.find((p) => p.date === "2026-08-10")?.netWorth).toBe(-50);
  });
});
