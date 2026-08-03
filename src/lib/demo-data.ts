import type {
  Account,
  AccountValueEntry,
  HistoricalSnapshot,
  Transaction,
} from "./types";

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
  const today = now.slice(0, 10);
  return [
    {
      id: id(),
      name: "HSBC Savings",
      category: "cash",
      isLiability: false,
      currency: "HKD",
      currentValue: 285000,
      asOfDate: today,
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
      asOfDate: today,
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
      asOfDate: today,
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
      asOfDate: today,
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
      asOfDate: today,
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
      asOfDate: today,
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
      asOfDate: today,
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
      asOfDate: today,
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
      asOfDate: today,
      institutionName: "American Express",
      updatedAt: now,
      createdAt: now,
    },
  ];
}

export function createDemoValueEntries(accounts: Account[]): AccountValueEntry[] {
  const now = new Date().toISOString();
  const entries: AccountValueEntry[] = [];
  const months = [180, 150, 120, 90, 60, 30, 0];

  for (const account of accounts) {
    months.forEach((days, index) => {
      const progress = index / (months.length - 1);
      const drift = account.isLiability
        ? 1.18 - progress * 0.18
        : 0.82 + progress * 0.18;
      const noise = 1 + Math.sin(index * 1.3 + account.name.length) * 0.015;
      const value = Number((account.currentValue * drift * noise).toFixed(2));
      entries.push({
        id: id(),
        accountId: account.id,
        date: daysAgo(days),
        value,
        markOnGraph: true,
        note: index === months.length - 1 ? "Latest" : undefined,
        createdAt: now,
      });
    });
  }
  return entries;
}

/** Sample income/expense rows (applied via store so linked balances update). */
export function createDemoTransactions(
  accounts: Account[],
): Omit<Transaction, "id" | "createdAt">[] {
  const cash = accounts.find((a) => a.name === "HSBC Savings");
  const card = accounts.find((a) => a.name === "Amex Platinum");
  const brokerage = accounts.find((a) => a.name === "USD Brokerage");

  return [
    {
      type: "income",
      amount: 48000,
      currency: "HKD",
      date: daysAgo(3),
      title: "Monthly salary",
      category: "salary",
      accountId: cash?.id,
      note: "Payroll",
    },
    {
      type: "expense",
      amount: 286,
      currency: "HKD",
      date: daysAgo(2),
      title: "Lunch near Central",
      category: "food",
      accountId: cash?.id,
    },
    {
      type: "expense",
      amount: 1200,
      currency: "HKD",
      date: daysAgo(1),
      title: "Amex statement",
      category: "shopping",
      accountId: card?.id,
      note: "Increases card balance",
    },
    {
      type: "income",
      amount: 350,
      currency: "USD",
      date: daysAgo(5),
      title: "Dividend",
      category: "investment_return",
      accountId: brokerage?.id,
    },
    {
      type: "expense",
      amount: 88,
      currency: "HKD",
      date: daysAgo(0),
      title: "MTR octopus",
      category: "transport",
      accountId: cash?.id,
    },
    {
      type: "income",
      amount: 2000,
      currency: "HKD",
      date: daysAgo(10),
      title: "Freelance side job",
      category: "other",
      // unlinked — ledger only
    },
  ];
}

/** Generate ~6 months of weekly snapshots with a gentle upward drift. */
export function createDemoSnapshots(accounts: Account[]): HistoricalSnapshot[] {
  const weeks = 26;
  const snapshots: HistoricalSnapshot[] = [];

  for (let i = weeks; i >= 0; i--) {
    const progress = (weeks - i) / weeks;
    const drift = 0.85 + progress * 0.15;
    const noise = 1 + Math.sin(i * 0.7) * 0.008;

    let totalAssets = 0;
    let totalLiabilities = 0;
    const accountBalances = accounts.map((a) => {
      const scaled = a.currentValue * drift * noise;
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
