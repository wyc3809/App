import { describe, expect, it } from "vitest";
import {
  applyLedgerDeltaToBalance,
  balanceOnDate,
  computeLedgerTotals,
  filterTransactionsByPeriod,
  ledgerPeriodStart,
  oppositeTransactionType,
} from "./ledger";
import type { AccountValueEntry, Transaction } from "./types";

describe("ledger account linking", () => {
  it("normalizes negative liability magnitudes before applying deltas", () => {
    expect(applyLedgerDeltaToBalance(331533.14, true, "expense", 520000)).toEqual({
      value: 851533.14,
      isLiability: true,
      flipped: false,
      signedDelta: 520000,
    });
  });

  it("increases asset on income and decreases on expense", () => {
    expect(applyLedgerDeltaToBalance(1000, false, "income", 200)).toEqual({
      value: 1200,
      isLiability: false,
      flipped: false,
      signedDelta: 200,
    });
    expect(applyLedgerDeltaToBalance(1000, false, "expense", 150)).toEqual({
      value: 850,
      isLiability: false,
      flipped: false,
      signedDelta: -150,
    });
  });

  it("increases liability on expense and decreases on income/payment", () => {
    expect(applyLedgerDeltaToBalance(500, true, "expense", 80)).toEqual({
      value: 580,
      isLiability: true,
      flipped: false,
      signedDelta: 80,
    });
    expect(applyLedgerDeltaToBalance(500, true, "income", 100)).toEqual({
      value: 400,
      isLiability: true,
      flipped: false,
      signedDelta: -100,
    });
  });

  it("flips asset to liability when expense crosses zero", () => {
    expect(applyLedgerDeltaToBalance(50, false, "expense", 80)).toEqual({
      value: 30,
      isLiability: true,
      flipped: true,
      signedDelta: -80,
    });
  });

  it("flips liability to asset when payment crosses zero", () => {
    expect(applyLedgerDeltaToBalance(50, true, "income", 80)).toEqual({
      value: 30,
      isLiability: false,
      flipped: true,
      signedDelta: -80,
    });
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

describe("ledger summary period", () => {
  it("starts month on the 1st and YTD on Jan 1", () => {
    expect(ledgerPeriodStart("day", "2026-08-15")).toBe("2026-08-15");
    expect(ledgerPeriodStart("month", "2026-08-15")).toBe("2026-08-01");
    expect(ledgerPeriodStart("ytd", "2026-08-15")).toBe("2026-01-01");
  });

  it("filters transactions into the selected window", () => {
    const txs: Transaction[] = [
      {
        id: "a",
        type: "income",
        amount: 10,
        currency: "HKD",
        date: "2025-12-31",
        title: "Old",
        category: "other",
        createdAt: "2025-12-31T00:00:00.000Z",
      },
      {
        id: "b",
        type: "income",
        amount: 20,
        currency: "HKD",
        date: "2026-01-02",
        title: "YTD",
        category: "salary",
        createdAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "c",
        type: "expense",
        amount: 5,
        currency: "HKD",
        date: "2026-08-01",
        title: "Month",
        category: "food",
        createdAt: "2026-08-01T00:00:00.000Z",
      },
      {
        id: "d",
        type: "expense",
        amount: 3,
        currency: "HKD",
        date: "2026-08-15",
        title: "Today",
        category: "food",
        createdAt: "2026-08-15T00:00:00.000Z",
      },
    ];
    expect(filterTransactionsByPeriod(txs, "day", "2026-08-15").map((t) => t.id)).toEqual([
      "d",
    ]);
    expect(filterTransactionsByPeriod(txs, "month", "2026-08-15").map((t) => t.id)).toEqual([
      "c",
      "d",
    ]);
    expect(filterTransactionsByPeriod(txs, "ytd", "2026-08-15").map((t) => t.id)).toEqual([
      "b",
      "c",
      "d",
    ]);
  });
});
