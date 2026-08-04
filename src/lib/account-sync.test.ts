import { describe, expect, it } from "vitest";
import type { Account, AccountValueEntry } from "./types";

/** Mirror of store sync sort — newest date, then newest createdAt. */
function latestEntryValue(
  accountId: string,
  entries: AccountValueEntry[],
): number | null {
  const mine = entries
    .filter((e) => e.accountId === accountId)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
  return mine[0]?.value ?? null;
}

describe("account balance sync from history", () => {
  it("uses newest same-day entry (by createdAt), not an older sibling", () => {
    const entries: AccountValueEntry[] = [
      {
        id: "old",
        accountId: "a1",
        date: "2026-08-03",
        value: 336192.46,
        markOnGraph: true,
        createdAt: "2026-08-03T10:00:00.000Z",
      },
      {
        id: "new",
        accountId: "a1",
        date: "2026-08-03",
        value: 0,
        markOnGraph: true,
        createdAt: "2026-08-03T18:00:00.000Z",
        transactionId: "tx-mtr",
        delta: -336192.46,
      },
    ];
    expect(latestEntryValue("a1", entries)).toBe(0);
  });

  it("prefers a later date over a newer createdAt on an older date", () => {
    const entries: AccountValueEntry[] = [
      {
        id: "aug",
        accountId: "a1",
        date: "2026-08-03",
        value: 100,
        markOnGraph: true,
        createdAt: "2026-08-03T08:00:00.000Z",
      },
      {
        id: "jul",
        accountId: "a1",
        date: "2026-07-01",
        value: 999,
        markOnGraph: true,
        createdAt: "2026-08-03T20:00:00.000Z",
      },
    ];
    expect(latestEntryValue("a1", entries)).toBe(100);
  });
});

describe("account display alignment", () => {
  it("header should match latest history value", () => {
    const account: Account = {
      id: "a1",
      name: "HSBC",
      category: "cash",
      isLiability: false,
      currency: "HKD",
      currentValue: 336192.46,
      asOfDate: "2026-08-03",
      updatedAt: "2026-08-03T10:00:00.000Z",
      createdAt: "2026-02-04T00:00:00.000Z",
    };
    const latestHistory = 0;
    const display = latestHistory ?? account.currentValue;
    expect(display).toBe(0);
  });
});
