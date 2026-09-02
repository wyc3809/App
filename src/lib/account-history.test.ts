import { describe, expect, it } from "vitest";
import {
  buildAccountHistoryPoints,
  filterHistoryByRange,
} from "./account-history";
import type { AccountValueEntry } from "./types";

function entry(
  date: string,
  value: number,
  accountId = "a1",
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

describe("account value history", () => {
  it("shows liability expense as a negative display delta", () => {
    const points = buildAccountHistoryPoints(
      [
        {
          id: "1",
          accountId: "a1",
          date: "2026-09-01",
          value: 331533.14,
          markOnGraph: true,
          createdAt: "2026-09-01T10:00:00.000Z",
        },
        {
          id: "2",
          accountId: "a1",
          date: "2026-09-02",
          value: 851533.14,
          note: "Expense · Food",
          markOnGraph: true,
          createdAt: "2026-09-02T10:00:00.000Z",
          transactionId: "tx1",
          delta: 520000,
        },
      ],
      "a1",
      true,
    );
    expect(points[0].changeAbsolute).toBe(-520000);
    expect(points[0].signedValue).toBe(-851533.14);
  });

  it("uses per-point signed values after asset to liability flip", () => {
    const points = buildAccountHistoryPoints(
      [
        {
          id: "1",
          accountId: "a1",
          date: "2026-08-01",
          value: 50,
          markOnGraph: true,
          createdAt: "2026-08-01T10:00:00.000Z",
        },
        {
          id: "2",
          accountId: "a1",
          date: "2026-08-02",
          value: 30,
          note: "Expense · Big spend",
          markOnGraph: true,
          createdAt: "2026-08-02T10:00:00.000Z",
          transactionId: "tx1",
          delta: -80,
          typeFlip: {
            fromIsLiability: false,
            fromCategory: "cash",
            toIsLiability: true,
            toCategory: "loan",
          },
        },
      ],
      "a1",
      true,
    );
    expect(points[1].signedValue).toBe(50);
    expect(points[0].signedValue).toBe(-30);
  });

  it("builds newest-first points with MoM deltas", () => {
    const points = buildAccountHistoryPoints(
      [entry("2026-06-01", 100), entry("2026-07-01", 120), entry("2026-08-01", 150)],
      "a1",
    );
    expect(points).toHaveLength(3);
    expect(points[0].date).toBe("2026-08-01");
    expect(points[0].changeAbsolute).toBe(30);
    expect(points[0].changePercent).toBeCloseTo(25);
    expect(points[2].changeAbsolute).toBeNull();
  });

  it("keeps separate same-day ledger rows", () => {
    const points = buildAccountHistoryPoints(
      [
        {
          id: "1",
          accountId: "a1",
          date: "2026-08-01",
          value: 1000,
          markOnGraph: true,
          createdAt: "2026-08-01T10:00:00.000Z",
        },
        {
          id: "2",
          accountId: "a1",
          date: "2026-08-01",
          value: 1200,
          note: "Income · Salary",
          markOnGraph: true,
          createdAt: "2026-08-01T12:00:00.000Z",
          transactionId: "tx1",
          delta: 200,
        },
        {
          id: "3",
          accountId: "a1",
          date: "2026-08-01",
          value: 1150,
          note: "Expense · Lunch",
          markOnGraph: true,
          createdAt: "2026-08-01T14:00:00.000Z",
          transactionId: "tx2",
          delta: -50,
        },
      ],
      "a1",
    );
    expect(points).toHaveLength(3);
    expect(points[0].transactionId).toBe("tx2");
    expect(points[0].changeAbsolute).toBe(-50);
    expect(points[1].transactionId).toBe("tx1");
    expect(points[1].changeAbsolute).toBe(200);
    expect(points[0].entryId).toBe("3");
  });

  it("filters by range", () => {
    const points = buildAccountHistoryPoints(
      [
        entry("2024-01-01", 50),
        entry("2026-01-01", 80),
        entry("2026-08-01", 100),
      ],
      "a1",
    );
    const filtered = filterHistoryByRange(points, "1Y");
    expect(filtered.every((p) => p.date >= "2025-01-01" || filtered.length === 1)).toBe(
      true,
    );
    expect(filterHistoryByRange(points, "ALL")).toHaveLength(3);
  });
});
