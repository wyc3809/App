import { describe, expect, it } from "vitest";
import {
  buildLedgerCalendarDays,
  buildMonthlyCalendarDays,
  buildMonthlyCashflowBars,
} from "./graph-series";
import type { Currency, Transaction } from "./types";

const currencies: Currency[] = [
  { code: "HKD", symbol: "HK$", name: "HKD", exchangeRateToBase: 1 },
];

function tx(
  partial: Partial<Transaction> & Pick<Transaction, "type" | "amount" | "date">,
): Transaction {
  return {
    id: partial.id ?? `t-${partial.date}-${partial.type}`,
    currency: "HKD",
    title: "t",
    category: partial.type === "income" ? "salary" : "food",
    createdAt: `${partial.date}T12:00:00.000Z`,
    ...partial,
  };
}

describe("graph-series", () => {
  it("builds monthly income/expense bars", () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const day = `${ym}-15`;
    const bars = buildMonthlyCashflowBars(
      [
        tx({ type: "income", amount: 1000, date: day }),
        tx({ type: "expense", amount: 250, date: day }),
      ],
      currencies,
      3,
    );
    expect(bars).toHaveLength(3);
    const current = bars[bars.length - 1];
    expect(current.month).toBe(ym);
    expect(current.income).toBe(1000);
    expect(current.expense).toBe(250);
    expect(current.net).toBe(750);
  });

  it("builds calendar cells with intensity", () => {
    const today = new Date().toISOString().slice(0, 10);
    const cells = buildLedgerCalendarDays(
      [
        tx({ type: "expense", amount: 100, date: today }),
        tx({ type: "expense", amount: 50, date: today }),
      ],
      currencies,
      4,
    );
    expect(cells.length).toBeGreaterThanOrEqual(28);
    const hit = cells.find((c) => c.date === today);
    expect(hit?.expense).toBe(150);
    expect(hit?.intensity).toBe(1);
  });

  it("builds a monthly calendar grid", () => {
    const cells = buildMonthlyCalendarDays(
      [tx({ type: "expense", amount: 80, date: "2026-08-04" })],
      currencies,
      2026,
      7,
    );
    expect(cells.length % 7).toBe(0);
    const hit = cells.find((c) => c.date === "2026-08-04");
    expect(hit?.inMonth).toBe(true);
    expect(hit?.expense).toBe(80);
    expect(hit?.intensity).toBe(1);
  });
});
