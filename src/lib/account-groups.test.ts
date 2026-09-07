import { describe, expect, it } from "vitest";
import { buildCategoryGroups, categoryDisplayOrder } from "./account-groups";
import { DEFAULT_CURRENCIES } from "./currencies";
import type { Account } from "./types";

function account(partial: Partial<Account> & Pick<Account, "id" | "name" | "category" | "isLiability" | "currentValue">): Account {
  return {
    currency: "HKD",
    asOfDate: "2026-09-07",
    createdAt: "2026-09-07T00:00:00.000Z",
    updatedAt: "2026-09-07T00:00:00.000Z",
    ...partial,
  };
}

describe("categoryDisplayOrder", () => {
  it("includes other only once despite ASSET_TYPES + LIABILITY_TYPES overlap", () => {
    const order = categoryDisplayOrder();
    expect(order.filter((c) => c === "other")).toHaveLength(1);
    expect(new Set(order).size).toBe(order.length);
  });
});

describe("buildCategoryGroups", () => {
  it("does not double-list a single Other liability account", () => {
    const accounts = [
      account({
        id: "a1",
        name: "Other Asset 1",
        category: "other",
        isLiability: true,
        currentValue: 15000,
      }),
    ];
    const groups = buildCategoryGroups(accounts, DEFAULT_CURRENCIES);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(1);
    expect(groups[0].isLiability).toBe(true);
    expect(groups[0].label).toBe("Other Liability");
    expect(groups[0].total).toBe(15000);

    const liabilityCount = groups
      .filter((g) => g.isLiability)
      .reduce((sum, g) => sum + g.items.length, 0);
    const liabilityTotal = groups
      .filter((g) => g.isLiability)
      .reduce((sum, g) => sum + g.total, 0);
    expect(liabilityCount).toBe(1);
    expect(liabilityTotal).toBe(15000);
  });

  it("does not double-list a single Other asset account", () => {
    const accounts = [
      account({
        id: "a1",
        name: "Other Asset 1",
        category: "other",
        isLiability: false,
        currentValue: 15000,
      }),
    ];
    const groups = buildCategoryGroups(accounts, DEFAULT_CURRENCIES);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toHaveLength(1);
    expect(groups[0].label).toBe("Other Asset");
  });
});
