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
