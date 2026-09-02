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

export type WrappedStatItem = {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive" | "negative" | "neutral";
};

export type WrappedRankItem = {
  rank: number;
  title: string;
  subtitle?: string;
  value: string;
  tone?: "positive" | "negative";
};

export type WrappedSlide =
  | {
      kind: "intro";
      title: string;
      subtitle: string;
      accent?: string;
    }
  | {
      kind: "statsGroup";
      heading?: string;
      items: WrappedStatItem[];
    }
  | {
      kind: "rankList";
      heading: string;
      items: WrappedRankItem[];
    }
  | {
      kind: "outro";
      title: string;
      subtitle: string;
    };

const MAX_WRAPPED_SLIDES = 5;

function weekStatsGroup(
  report: WeeklyLedgerReport,
  formatMoney: (n: number, opts?: { showSign?: boolean }) => string,
): WrappedSlide {
  const summaryItems: WrappedStatItem[] = [
    {
      label: "Income",
      value: formatMoney(report.income),
      tone: "positive",
    },
    {
      label: "Expense",
      value: formatMoney(report.expense),
      tone: "negative",
    },
    {
      label: "Net cashflow",
      value: formatMoney(report.net, { showSign: true }),
      tone: report.net >= 0 ? "positive" : "negative",
    },
  ];

  if (report.biggestCategory) {
    summaryItems.push({
      label: `Top category · ${report.biggestCategory.label}`,
      value: formatMoney(report.biggestCategory.amount),
      hint: report.biggestCategory.type === "income" ? "Income" : "Expense",
    });
  }

  return {
    kind: "statsGroup",
    heading: "Week at a glance",
    items: summaryItems,
  };
}

function ledgerHighlightsList(
  report: WeeklyLedgerReport,
  formatMoney: (n: number, opts?: { showSign?: boolean }) => string,
): WrappedSlide | null {
  const items: WrappedRankItem[] = [];

  for (const item of report.topExpenses.slice(0, 3)) {
    items.push({
      rank: items.length + 1,
      title: item.title,
      subtitle: item.categoryLabel,
      value: formatMoney(item.amountBase),
      tone: "negative",
    });
  }

  for (const item of report.topIncome.slice(0, 2)) {
    items.push({
      rank: items.length + 1,
      title: item.title,
      subtitle: item.categoryLabel,
      value: formatMoney(item.amountBase),
      tone: "positive",
    });
  }

  if (items.length === 0) return null;

  return {
    kind: "rankList",
    heading: "Ledger highlights",
    items,
  };
}

function monthStatsGroup(
  report: MonthlyNetWorthReport,
  formatMoney: (n: number, opts?: { showSign?: boolean; compact?: boolean }) => string,
): WrappedSlide {
  return {
    kind: "statsGroup",
    heading: "Month at a glance",
    items: [
      {
        label: "Net worth",
        value: formatMoney(report.toNetWorth, { compact: true }),
        hint: `From ${formatMoney(report.fromNetWorth, { compact: true })}`,
      },
      {
        label: "Monthly change",
        value: formatMoney(report.delta, { showSign: true, compact: true }),
        hint: `${report.percent >= 0 ? "+" : ""}${report.percent.toFixed(1)}%`,
        tone: report.delta >= 0 ? "positive" : "negative",
      },
      {
        label: "Assets",
        value: formatMoney(report.assetsDelta, { showSign: true, compact: true }),
        tone: report.assetsDelta >= 0 ? "positive" : "negative",
      },
      {
        label: "Liabilities",
        value: formatMoney(report.liabilitiesDelta, { showSign: true, compact: true }),
        tone: report.liabilitiesDelta <= 0 ? "positive" : "negative",
      },
    ],
  };
}

function accountMoversList(
  report: MonthlyNetWorthReport,
  formatMoney: (n: number, opts?: { showSign?: boolean; compact?: boolean }) => string,
): WrappedSlide | null {
  const items: WrappedRankItem[] = [];

  for (const mover of report.topGainers.slice(0, 3)) {
    items.push({
      rank: items.length + 1,
      title: mover.name,
      subtitle: "Top gainer",
      value: formatMoney(mover.delta, { showSign: true, compact: true }),
      tone: "positive",
    });
  }

  for (const mover of report.topLosers.slice(0, 3)) {
    items.push({
      rank: items.length + 1,
      title: mover.name,
      subtitle: "Mover down",
      value: formatMoney(mover.delta, { showSign: true, compact: true }),
      tone: "negative",
    });
  }

  if (items.length === 0) return null;

  return {
    kind: "rankList",
    heading: "Account movers",
    items,
  };
}

/** Single Wrapped deck merging weekly ledger + monthly net worth (max 5 slides). */
export function combinedReportToSlides(
  weekly: WeeklyLedgerReport | null,
  monthly: MonthlyNetWorthReport | null,
  formatMoney: (n: number, opts?: { showSign?: boolean; compact?: boolean }) => string,
): WrappedSlide[] | null {
  if (!weekly && !monthly) return null;

  const subtitleParts: string[] = [];
  if (weekly) subtitleParts.push(`Week · ${weekly.periodLabel}`);
  if (monthly) subtitleParts.push(`Month · ${monthly.periodLabel}`);

  const slides: WrappedSlide[] = [
    {
      kind: "intro",
      title: "Your WorthBook recap",
      subtitle: subtitleParts.join("  ·  "),
      accent: "combined",
    },
  ];

  if (weekly) {
    slides.push(weekStatsGroup(weekly, formatMoney));
    const ledger = ledgerHighlightsList(weekly, formatMoney);
    if (ledger) slides.push(ledger);
  }

  if (monthly) {
    slides.push(monthStatsGroup(monthly, formatMoney));
    const movers = accountMoversList(monthly, formatMoney);
    if (movers) slides.push(movers);
  }

  slides.push({
    kind: "outro",
    title: "All wrapped",
    subtitle: "Keep tracking — your next recap is on the way.",
  });

  return slides.slice(0, MAX_WRAPPED_SLIDES);
}

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
    weekStatsGroup(report, formatMoney),
  ];

  const ledger = ledgerHighlightsList(report, formatMoney);
  if (ledger) slides.push(ledger);

  slides.push({
    kind: "outro",
    title: "Week wrapped",
    subtitle: "Keep logging — next recap drops Monday.",
  });

  return slides.slice(0, MAX_WRAPPED_SLIDES);
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
    monthStatsGroup(report, formatMoney),
  ];

  const movers = accountMoversList(report, formatMoney);
  if (movers) slides.push(movers);

  slides.push({
    kind: "outro",
    title: "Month wrapped",
    subtitle: "Your next recap arrives on the 1st.",
  });

  return slides.slice(0, MAX_WRAPPED_SLIDES);
}
