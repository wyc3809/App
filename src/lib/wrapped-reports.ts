import { toBaseCurrency } from "./currencies";
import { ledgerCategoryLabel } from "./ledger";
import type { Currency, HistoricalSnapshot, Transaction } from "./types";

export interface WeeklyLedgerTopItem {
  id: string;
  title: string;
  categoryLabel: string;
  type: "income" | "expense";
  amountBase: number;
}

export interface WeeklyLedgerReport {
  periodLabel: string;
  start: string;
  end: string;
  weekKey: string;
  income: number;
  expense: number;
  net: number;
  topExpenses: WeeklyLedgerTopItem[];
  topIncome: WeeklyLedgerTopItem[];
  biggestCategory: { label: string; amount: number; type: "income" | "expense" } | null;
}

export interface MonthlyAccountMover {
  accountId: string;
  name: string;
  delta: number;
  fromValue: number;
  toValue: number;
}

export interface MonthlyNetWorthReport {
  monthKey: string;
  periodLabel: string;
  start: string;
  end: string;
  fromNetWorth: number;
  toNetWorth: number;
  delta: number;
  percent: number;
  assetsDelta: number;
  liabilitiesDelta: number;
  topGainers: MonthlyAccountMover[];
  topLosers: MonthlyAccountMover[];
}

function snapshotOnOrBefore(
  sortedAsc: HistoricalSnapshot[],
  targetISO: string,
): HistoricalSnapshot | null {
  for (let i = sortedAsc.length - 1; i >= 0; i--) {
    if (sortedAsc[i].date <= targetISO) return sortedAsc[i];
  }
  return null;
}

export function buildWeeklyLedgerReport(
  transactions: Transaction[],
  currencies: Currency[],
  start: string,
  end: string,
  weekKey: string,
  periodLabel: string,
): WeeklyLedgerReport | null {
  const inRange = transactions.filter((tx) => tx.date >= start && tx.date <= end);
  if (inRange.length === 0) return null;

  let income = 0;
  let expense = 0;
  const items: WeeklyLedgerTopItem[] = [];

  for (const tx of inRange) {
    const amountBase = toBaseCurrency(tx.amount, tx.currency, currencies);
    if (tx.type === "income") income += amountBase;
    else expense += amountBase;
    items.push({
      id: tx.id,
      title: tx.title,
      categoryLabel: ledgerCategoryLabel(tx.category),
      type: tx.type,
      amountBase,
    });
  }

  const topExpenses = items
    .filter((i) => i.type === "expense")
    .sort((a, b) => b.amountBase - a.amountBase)
    .slice(0, 5);

  const topIncome = items
    .filter((i) => i.type === "income")
    .sort((a, b) => b.amountBase - a.amountBase)
    .slice(0, 3);

  const categoryTotals = new Map<string, { label: string; amount: number; type: "income" | "expense" }>();
  for (const tx of inRange) {
    const amountBase = toBaseCurrency(tx.amount, tx.currency, currencies);
    const label = ledgerCategoryLabel(tx.category);
    const key = `${tx.type}:${tx.category}`;
    const prev = categoryTotals.get(key);
    if (prev) prev.amount += amountBase;
    else categoryTotals.set(key, { label, amount: amountBase, type: tx.type });
  }

  let biggestCategory: WeeklyLedgerReport["biggestCategory"] = null;
  for (const entry of categoryTotals.values()) {
    if (!biggestCategory || entry.amount > biggestCategory.amount) {
      biggestCategory = entry;
    }
  }

  return {
    periodLabel,
    start,
    end,
    weekKey,
    income,
    expense,
    net: income - expense,
    topExpenses,
    topIncome,
    biggestCategory,
  };
}

export function buildMonthlyNetWorthReport(
  snapshots: HistoricalSnapshot[],
  accounts: { id: string; name: string }[],
  start: string,
  end: string,
  monthKey: string,
  periodLabel: string,
): MonthlyNetWorthReport | null {
  if (snapshots.length < 2) return null;

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const baseline = snapshotOnOrBefore(sorted, start) ?? sorted[0];
  const latest = snapshotOnOrBefore(sorted, end);
  if (!latest || baseline.date === latest.date) return null;

  const delta = latest.netWorthBaseCurrency - baseline.netWorthBaseCurrency;
  const percent =
    baseline.netWorthBaseCurrency === 0
      ? 0
      : (delta / Math.abs(baseline.netWorthBaseCurrency)) * 100;

  const assetsDelta =
    latest.totalAssetsBaseCurrency - baseline.totalAssetsBaseCurrency;
  const liabilitiesDelta =
    latest.totalLiabilitiesBaseCurrency - baseline.totalLiabilitiesBaseCurrency;

  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const movers: MonthlyAccountMover[] = [];

  const fromMap = new Map(baseline.accountBalances.map((b) => [b.accountId, b.balance]));
  const toMap = new Map(latest.accountBalances.map((b) => [b.accountId, b.balance]));
  const ids = new Set([...fromMap.keys(), ...toMap.keys()]);

  for (const id of ids) {
    const fromValue = fromMap.get(id) ?? 0;
    const toValue = toMap.get(id) ?? 0;
    const deltaAcc = toValue - fromValue;
    if (deltaAcc === 0) continue;
    movers.push({
      accountId: id,
      name: accountName.get(id) ?? "Account",
      delta: deltaAcc,
      fromValue,
      toValue,
    });
  }

  const gainers = [...movers].filter((m) => m.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);
  const losers = [...movers]
    .filter((m) => m.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 5);

  return {
    monthKey,
    periodLabel,
    start: baseline.date,
    end: latest.date,
    fromNetWorth: baseline.netWorthBaseCurrency,
    toNetWorth: latest.netWorthBaseCurrency,
    delta,
    percent,
    assetsDelta,
    liabilitiesDelta,
    topGainers: gainers,
    topLosers: losers,
  };
}

export type WrappedSlide =
  | {
      kind: "intro";
      title: string;
      subtitle: string;
      accent?: string;
    }
  | {
      kind: "stat";
      label: string;
      value: string;
      hint?: string;
      tone?: "positive" | "negative" | "neutral";
    }
  | {
      kind: "rank";
      rank: number;
      title: string;
      subtitle?: string;
      value: string;
      tone?: "positive" | "negative";
    }
  | {
      kind: "outro";
      title: string;
      subtitle: string;
    };

export function weeklyReportToSlides(
  report: WeeklyLedgerReport,
  formatMoney: (n: number, opts?: { showSign?: boolean }) => string,
): WrappedSlide[] {
  const slides: WrappedSlide[] = [
    {
      kind: "intro",
      title: "Your week in WorthBook",
      subtitle: report.periodLabel,
      accent: "ledger",
    },
    {
      kind: "stat",
      label: "Income",
      value: formatMoney(report.income),
      tone: "positive",
    },
    {
      kind: "stat",
      label: "Expense",
      value: formatMoney(report.expense),
      tone: "negative",
    },
    {
      kind: "stat",
      label: "Net cashflow",
      value: formatMoney(report.net, { showSign: true }),
      tone: report.net >= 0 ? "positive" : "negative",
    },
  ];

  if (report.biggestCategory) {
    slides.push({
      kind: "stat",
      label: `Top category · ${report.biggestCategory.label}`,
      value: formatMoney(report.biggestCategory.amount),
      hint: report.biggestCategory.type === "income" ? "Income" : "Expense",
    });
  }

  for (const item of report.topExpenses) {
    slides.push({
      kind: "rank",
      rank: report.topExpenses.indexOf(item) + 1,
      title: item.title,
      subtitle: item.categoryLabel,
      value: formatMoney(item.amountBase),
      tone: "negative",
    });
  }

  for (const item of report.topIncome) {
    slides.push({
      kind: "rank",
      rank: report.topIncome.indexOf(item) + 1,
      title: item.title,
      subtitle: item.categoryLabel,
      value: formatMoney(item.amountBase),
      tone: "positive",
    });
  }

  slides.push({
    kind: "outro",
    title: "Week wrapped",
    subtitle: "Keep logging — next recap drops Monday.",
  });

  return slides;
}

export function monthlyReportToSlides(
  report: MonthlyNetWorthReport,
  formatMoney: (n: number, opts?: { showSign?: boolean; compact?: boolean }) => string,
): WrappedSlide[] {
  const slides: WrappedSlide[] = [
    {
      kind: "intro",
      title: "Your month in WorthBook",
      subtitle: report.periodLabel,
      accent: "networth",
    },
    {
      kind: "stat",
      label: "Net worth",
      value: formatMoney(report.toNetWorth, { compact: true }),
      hint: `From ${formatMoney(report.fromNetWorth, { compact: true })}`,
    },
    {
      kind: "stat",
      label: "Monthly change",
      value: formatMoney(report.delta, { showSign: true, compact: true }),
      hint: `${report.percent >= 0 ? "+" : ""}${report.percent.toFixed(1)}%`,
      tone: report.delta >= 0 ? "positive" : "negative",
    },
    {
      kind: "stat",
      label: "Assets",
      value: formatMoney(report.assetsDelta, { showSign: true, compact: true }),
      tone: report.assetsDelta >= 0 ? "positive" : "negative",
    },
    {
      kind: "stat",
      label: "Liabilities",
      value: formatMoney(report.liabilitiesDelta, { showSign: true, compact: true }),
      tone: report.liabilitiesDelta <= 0 ? "positive" : "negative",
    },
  ];

  for (const mover of report.topGainers) {
    slides.push({
      kind: "rank",
      rank: report.topGainers.indexOf(mover) + 1,
      title: mover.name,
      subtitle: "Top gainer",
      value: formatMoney(mover.delta, { showSign: true, compact: true }),
      tone: "positive",
    });
  }

  for (const mover of report.topLosers) {
    slides.push({
      kind: "rank",
      rank: report.topLosers.indexOf(mover) + 1,
      title: mover.name,
      subtitle: "Top mover down",
      value: formatMoney(mover.delta, { showSign: true, compact: true }),
      tone: "negative",
    });
  }

  slides.push({
    kind: "outro",
    title: "Month wrapped",
    subtitle: "Your next recap arrives on the 1st.",
  });

  return slides;
}
