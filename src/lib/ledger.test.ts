import { describe, expect, it } from "vitest";
import {
  applyLedgerDeltaToBalance,
  balanceOnDate,
  computeLedgerTotals,
  oppositeTransactionType,
} from "./ledger";
import type { AccountValueEntry, Transaction } from "./types";

describe("ledger account linking", () => {
  it("increases asset on income and decreases on expense", () => {
    expect(applyLedgerDeltaToBalance(1000, false, "income", 200)).toBe(1200);
    expect(applyLedgerDeltaToBalance(1000, false, "expense", 150)).toBe(850);
  });

  it("increases liability on expense and decreases on income/payment", () => {
    expect(applyLedgerDeltaToBalance(500, true, "expense", 80)).toBe(580);
    expect(applyLedgerDeltaToBalance(500, true, "income", 100)).toBe(400);
  });

  it("does not go below zero", () => {
    expect(applyLedgerDeltaToBalance(50, false, "expense", 80)).toBe(0);
    expect(applyLedgerDeltaToBalance(50, true, "income", 80)).toBe(0);
  });

  it("flips type for reverse", () => {
    expect(oppositeTransactionType("income")).toBe("expense");
    expect(oppositeTransactionType("expense")).toBe("income");
  });
});

describe("balanceOnDate", () => {
  const entries: AccountValueEntry[] = [
    {
      id: "1",
      accountId: "a",
      date: "2026-07-01",
      value: 100,
      markOnGraph: true,
      createdAt: "2026-07-01T00:00:00.000Z",
    },
    {
      id: "2",
      accountId: "a",
      date: "2026-08-01",
      value: 150,
      markOnGraph: true,
      createdAt: "2026-08-01T00:00:00.000Z",
    },
  ];

  it("uses exact day entry when present", () => {
    expect(balanceOnDate(entries, "a", "2026-08-01", 0)).toBe(150);
  });

  it("carries forward prior balance", () => {
    expect(balanceOnDate(entries, "a", "2026-07-15", 0)).toBe(100);
  });

  it("falls back when no history", () => {
    expect(balanceOnDate([], "a", "2026-08-01", 42)).toBe(42);
  });

  it("uses latest same-day entry", () => {
    const sameDay: AccountValueEntry[] = [
      {
        id: "1",
        accountId: "a",
        date: "2026-08-01",
        value: 100,
        markOnGraph: true,
        createdAt: "2026-08-01T10:00:00.000Z",
      },
      {
        id: "2",
        accountId: "a",
        date: "2026-08-01",
        value: 150,
        markOnGraph: true,
        createdAt: "2026-08-01T18:00:00.000Z",
      },
    ];
    expect(balanceOnDate(sameDay, "a", "2026-08-01", 0)).toBe(150);
  });
});

describe("ledger totals", () => {
  it("sums income and expense in base currency", () => {
    const txs: Transaction[] = [
      {
        id: "1",
        type: "income",
        amount: 100,
        currency: "USD",
        date: "2026-08-01",
        title: "Pay",
        category: "salary",
        createdAt: "2026-08-01T00:00:00.000Z",
      },
      {
        id: "2",
        type: "expense",
        amount: 50,
        currency: "HKD",
        date: "2026-08-01",
        title: "Lunch",
        category: "food",
        createdAt: "2026-08-01T00:00:00.000Z",
      },
    ];
    const totals = computeLedgerTotals(txs, (amount, currency) =>
      currency === "USD" ? amount * 7.8 : amount,
    );
    expect(totals.income).toBeCloseTo(780);
    expect(totals.expense).toBeCloseTo(50);
    expect(totals.net).toBeCloseTo(730);
  });
});
