import { describe, expect, it } from "vitest";
import {
  buildLedgerCategoryBreakdown,
  categoryBarsForChart,
} from "./ledger-category-breakdown";
import type { Currency, Transaction } from "./types";

const HKD: Currency = {
  code: "HKD",
  symbol: "HK$",
  name: "Hong Kong Dollar",
  exchangeRateToBase: 1,
};

function tx(
  partial: Omit<Transaction, "id" | "createdAt" | "currency" | "title"> & {
    title?: string;
  },
): Transaction {
  return {
    id: crypto.randomUUID(),
    createdAt: "2026-08-01T00:00:00.000Z",
    currency: "HKD",
    title: partial.title ?? partial.category,
    ...partial,
  };
}

describe("buildLedgerCategoryBreakdown", () => {
  it("sums expense and income by category for the month", () => {
    const transactions = [
      tx({
        type: "expense",
        category: "food",
        amount: 100,
        date: "2026-08-02",
      }),
      tx({
        type: "expense",
        category: "food",
        amount: 50,
        date: "2026-08-05",
      }),
      tx({
        type: "expense",
        category: "transport",
        amount: 30,
        date: "2026-08-03",
      }),
      tx({
        type: "income",
        category: "salary",
        amount: 1000,
        date: "2026-08-01",
      }),
      // Outside month window
      tx({
        type: "expense",
        category: "food",
        amount: 999,
        date: "2026-07-31",
      }),
    ];

    const breakdown = buildLedgerCategoryBreakdown(
      transactions,
      [HKD],
      "month",
      "2026-08-06",
    );

    expect(breakdown.expenseTotal).toBe(180);
    expect(breakdown.incomeTotal).toBe(1000);

    const food = breakdown.expense.find((r) => r.category === "food");
    expect(food?.amount).toBe(150);
    expect(food?.percent).toBeCloseTo((150 / 180) * 100, 5);
    expect(food?.count).toBe(2);

    const bars = categoryBarsForChart(breakdown, "expense");
    expect(bars.map((b) => b.key)).toEqual(["food", "transport"]);
  });

  it("includes zero categories but sorts spend first", () => {
    const breakdown = buildLedgerCategoryBreakdown(
      [
        tx({
          type: "expense",
          category: "health",
          amount: 20,
          date: "2026-08-06",
        }),
      ],
      [HKD],
      "day",
      "2026-08-06",
    );
    expect(breakdown.expense[0].category).toBe("health");
    expect(breakdown.expense.some((r) => r.amount === 0)).toBe(true);
  });
});
