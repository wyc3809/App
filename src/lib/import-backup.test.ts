import { describe, expect, it } from "vitest";
import { parseWorthBackup } from "./import-backup";
import { DEFAULT_CURRENCIES } from "./currencies";

describe("import-backup", () => {
  it("parses a valid worthbook JSON backup", () => {
    const result = parseWorthBackup({
      settings: {
        baseCurrency: "HKD",
        isPrivacyMode: false,
        isBiometricEnabled: false,
        theme: "system",
      },
      currencies: DEFAULT_CURRENCIES,
      accounts: [
        {
          id: "a1",
          name: "Cash",
          category: "cash",
          isLiability: false,
          currency: "HKD",
          currentValue: 1000,
          asOfDate: "2026-08-01",
          createdAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      snapshots: [
        {
          id: "s1",
          date: "2026-08-01",
          totalAssetsBaseCurrency: 1000,
          totalLiabilitiesBaseCurrency: 0,
          netWorthBaseCurrency: 1000,
          accountBalances: [{ accountId: "a1", balance: 1000, currency: "HKD" }],
        },
      ],
      transactions: [
        {
          id: "t1",
          type: "expense",
          amount: 20,
          currency: "HKD",
          date: "2026-08-02",
          title: "Lunch",
          category: "food",
          createdAt: "2026-08-02T00:00:00.000Z",
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.accounts).toHaveLength(1);
    expect(result.data.transactions).toHaveLength(1);
  });

  it("rejects invalid payloads", () => {
    expect(parseWorthBackup(null).ok).toBe(false);
    expect(parseWorthBackup({ settings: {} }).ok).toBe(false);
    expect(
      parseWorthBackup({
        settings: {
          baseCurrency: "HKD",
          isPrivacyMode: false,
          isBiometricEnabled: false,
          theme: "light",
        },
        accounts: "nope",
        snapshots: [],
      }).ok,
    ).toBe(false);
  });
});
