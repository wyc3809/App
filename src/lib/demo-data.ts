import type { Account, HistoricalSnapshot } from "./types";

function id(): string {
  return crypto.randomUUID();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function createDemoAccounts(): Account[] {
  const now = new Date().toISOString();
  return [
    {
      id: id(),
      name: "HSBC Savings",
      category: "cash",
      isLiability: false,
      currency: "HKD",
      currentValue: 285000,
      institutionName: "HSBC",
      note: "Emergency fund",
      updatedAt: now,
      createdAt: now,
    },
    {
      id: id(),
      name: "USD Brokerage",
      category: "investment",
      isLiability: false,
      currency: "USD",
      currentValue: 42000,
      institutionName: "Futu",
      updatedAt: now,
      createdAt: now,
    },
    {
      id: id(),
      name: "Hang Seng Index ETF",
      category: "investment",
      isLiability: false,
      currency: "HKD",
      currentValue: 156000,
      institutionName: "Interactive Brokers",
      updatedAt: now,
      createdAt: now,
    },
    {
      id: id(),
      name: "Apartment — Kowloon",
      category: "real_estate",
      isLiability: false,
      currency: "HKD",
      currentValue: 6800000,
      institutionName: "Self",
      updatedAt: now,
      createdAt: now,
    },
    {
      id: id(),
      name: "Bitcoin",
      category: "crypto",
      isLiability: false,
      currency: "USD",
      currentValue: 18500,
      institutionName: "Binance",
      updatedAt: now,
      createdAt: now,
    },
    {
      id: id(),
      name: "Tesla Model 3",
      category: "vehicle",
      isLiability: false,
      currency: "HKD",
      currentValue: 220000,
      updatedAt: now,
      createdAt: now,
    },
    {
      id: id(),
      name: "Home Mortgage",
      category: "mortgage",
      isLiability: true,
      currency: "HKD",
      currentValue: 4200000,
      institutionName: "Bank of China",
      updatedAt: now,
      createdAt: now,
    },
    {
      id: id(),
      name: "Car Loan",
      category: "loan",
      isLiability: true,
      currency: "HKD",
      currentValue: 85000,
      institutionName: "HSBC",
      updatedAt: now,
      createdAt: now,
    },
    {
      id: id(),
      name: "Amex Platinum",
      category: "credit_card",
      isLiability: true,
      currency: "HKD",
      currentValue: 12400,
      institutionName: "American Express",
      updatedAt: now,
      createdAt: now,
    },
  ];
}

/** Generate ~6 months of weekly snapshots with a gentle upward drift. */
export function createDemoSnapshots(accounts: Account[]): HistoricalSnapshot[] {
  const weeks = 26;
  const snapshots: HistoricalSnapshot[] = [];

  // Approximate starting net worth ~15% lower
  for (let i = weeks; i >= 0; i--) {
    const progress = (weeks - i) / weeks;
    const drift = 0.85 + progress * 0.15;
    const noise = 1 + Math.sin(i * 0.7) * 0.008;

    let totalAssets = 0;
    let totalLiabilities = 0;
    const accountBalances = accounts.map((a) => {
      const scaled = a.currentValue * drift * noise;
      // Rough HKD conversion for demo history (matches default rates)
      const rate =
        a.currency === "USD" ? 7.8 : a.currency === "EUR" ? 8.45 : 1;
      const base = scaled * rate;
      if (a.isLiability) totalLiabilities += base;
      else totalAssets += base;
      return {
        accountId: a.id,
        balance: Number(scaled.toFixed(2)),
        currency: a.currency,
      };
    });

    snapshots.push({
      id: id(),
      date: daysAgo(i * 7),
      totalAssetsBaseCurrency: Number(totalAssets.toFixed(2)),
      totalLiabilitiesBaseCurrency: Number(totalLiabilities.toFixed(2)),
      netWorthBaseCurrency: Number((totalAssets - totalLiabilities).toFixed(2)),
      accountBalances,
    });
  }

  return snapshots;
}
