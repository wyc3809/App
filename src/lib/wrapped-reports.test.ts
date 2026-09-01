import { describe, expect, it } from "vitest";
import { DEFAULT_CURRENCIES } from "./currencies";
import { previousIsoWeekRange, previousMonthRange } from "./report-periods";
import {
  buildMonthlyNetWorthReport,
  buildWeeklyLedgerReport,
} from "./wrapped-reports";
import type { HistoricalSnapshot, Transaction } from "./types";

describe("buildWeeklyLedgerReport", () => {
  it("returns top ledger items for a week", () => {
    const range = previousIsoWeekRange("2026-09-01");
    const txs: Transaction[] = [
      {
        id: "1",
        type: "expense",
        amount: 50,
        currency: "HKD",
        date: range.start,
        title: "Lunch",
        category: "food",
        createdAt: "2026-08-25T00:00:00Z",
      },
      {
        id: "2",
        type: "expense",
        amount: 200,
        currency: "HKD",
        date: range.end,
        title: "Rent share",
        category: "housing",
        createdAt: "2026-08-31T00:00:00Z",
      },
      {
        id: "3",
        type: "income",
        amount: 1000,
        currency: "HKD",
        date: range.start,
        title: "Salary",
        category: "salary",
        createdAt: "2026-08-25T00:00:00Z",
      },
    ];

    const report = buildWeeklyLedgerReport(
      txs,
      DEFAULT_CURRENCIES,
      range.start,
      range.end,
      range.key,
      "Aug 2026",
    );

    expect(report).not.toBeNull();
    expect(report!.expense).toBe(250);
    expect(report!.income).toBe(1000);
    expect(report!.topExpenses[0].title).toBe("Rent share");
    expect(report!.topIncome[0].title).toBe("Salary");
  });
});

describe("buildMonthlyNetWorthReport", () => {
  it("computes net worth and account movers", () => {
    const month = previousMonthRange("2026-09-01");
    const snapshots: HistoricalSnapshot[] = [
      {
        id: "a",
        date: month.start,
        totalAssetsBaseCurrency: 10000,
        totalLiabilitiesBaseCurrency: 2000,
        netWorthBaseCurrency: 8000,
        accountBalances: [
          { accountId: "acc1", balance: 10000, currency: "HKD" },
          { accountId: "acc2", balance: 2000, currency: "HKD" },
        ],
      },
      {
        id: "b",
        date: month.end,
        totalAssetsBaseCurrency: 11000,
        totalLiabilitiesBaseCurrency: 1500,
        netWorthBaseCurrency: 9500,
        accountBalances: [
          { accountId: "acc1", balance: 11000, currency: "HKD" },
          { accountId: "acc2", balance: 1500, currency: "HKD" },
        ],
      },
    ];

    const report = buildMonthlyNetWorthReport(
      snapshots,
      [
        { id: "acc1", name: "Savings" },
        { id: "acc2", name: "Loan" },
      ],
      month.start,
      month.end,
      month.key,
      month.label,
    );

    expect(report).not.toBeNull();
    expect(report!.delta).toBe(1500);
    expect(report!.topGainers[0].name).toBe("Savings");
    expect(report!.topLosers[0].name).toBe("Loan");
  });
});
