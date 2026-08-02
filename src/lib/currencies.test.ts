import { describe, expect, it } from "vitest";
import {
  DEFAULT_CURRENCIES,
  convertAmount,
  rebaseCurrencyRates,
  toBaseCurrency,
} from "./currencies";
import { computeTotals } from "./calculations";
import type { Account } from "./types";

describe("currency conversion", () => {
  it("converts USD to HKD using default rates", () => {
    expect(toBaseCurrency(100, "USD", DEFAULT_CURRENCIES)).toBeCloseTo(780);
  });

  it("converts between non-base currencies", () => {
    // 100 USD -> 780 HKD -> 780/8.45 EUR
    const eur = convertAmount(100, "USD", "EUR", DEFAULT_CURRENCIES);
    expect(eur).toBeCloseTo(780 / 8.45, 4);
  });

  it("rebases rates when base currency changes", () => {
    const rebased = rebaseCurrencyRates(DEFAULT_CURRENCIES, "USD");
    const usd = rebased.find((c) => c.code === "USD");
    const hkd = rebased.find((c) => c.code === "HKD");
    expect(usd?.exchangeRateToBase).toBe(1);
    expect(hkd?.exchangeRateToBase).toBeCloseTo(1 / 7.8, 5);
  });
});

describe("portfolio totals", () => {
  it("nets assets minus liabilities in base currency", () => {
    const now = new Date().toISOString();
    const accounts: Account[] = [
      {
        id: "1",
        name: "Cash",
        category: "cash",
        isLiability: false,
        currency: "HKD",
        currentValue: 1000,
        updatedAt: now,
        createdAt: now,
      },
      {
        id: "2",
        name: "USD Stock",
        category: "investment",
        isLiability: false,
        currency: "USD",
        currentValue: 100,
        updatedAt: now,
        createdAt: now,
      },
      {
        id: "3",
        name: "Loan",
        category: "loan",
        isLiability: true,
        currency: "HKD",
        currentValue: 500,
        updatedAt: now,
        createdAt: now,
      },
    ];

    const totals = computeTotals(accounts, DEFAULT_CURRENCIES);
    expect(totals.totalAssets).toBeCloseTo(1000 + 780);
    expect(totals.totalLiabilities).toBeCloseTo(500);
    expect(totals.netWorth).toBeCloseTo(1280);
  });
});
