import type { Currency } from "./types";
import { toBaseCurrency } from "./currencies";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  filterTransactionsByPeriod,
  type LedgerSummaryPeriod,
} from "./ledger";
import type { LedgerCategory, Transaction, TransactionType } from "./types";

export interface CategoryBreakdownRow {
  category: LedgerCategory;
  label: string;
  short: string;
  tint: string;
  amount: number;
  percent: number;
  count: number;
}

export interface LedgerCategoryBreakdown {
  period: LedgerSummaryPeriod;
  incomeTotal: number;
  expenseTotal: number;
  income: CategoryBreakdownRow[];
  expense: CategoryBreakdownRow[];
}

/** Pastel-friendly brand tints for ledger categories (shared by Ledger + Insights). */
export const LEDGER_CATEGORY_TINT: Record<LedgerCategory, string> = {
  food: "#f59e0b",
  transport: "#3b82f6",
  housing: "#f97316",
  shopping: "#ec4899",
  entertainment: "#a855f7",
  health: "#14b8a6",
  utilities: "#06b6d4",
  salary: "#0f7a4c",
  bonus: "#84cc16",
  investment_return: "#22c55e",
  gift: "#ec4899",
  transfer: "#64748b",
  other: "#94a3b8",
};

export const LEDGER_CATEGORY_SHORT: Record<LedgerCategory, string> = {
  food: "Food",
  transport: "Transport",
  housing: "Home",
  shopping: "Shopping",
  entertainment: "Fun",
  health: "Health",
  utilities: "Bills",
  salary: "Salary",
  bonus: "Bonus",
  investment_return: "Invest",
  gift: "Gift",
  transfer: "Transfer",
  other: "Other",
};

function rowsForType(
  transactions: Transaction[],
  type: TransactionType,
  catalog: { value: LedgerCategory; label: string }[],
  toBase: (amount: number, currency: string) => number,
): { total: number; rows: CategoryBreakdownRow[] } {
  const sums = new Map<LedgerCategory, { amount: number; count: number }>();
  for (const c of catalog) {
    sums.set(c.value, { amount: 0, count: 0 });
  }

  let total = 0;
  for (const tx of transactions) {
    if (tx.type !== type) continue;
    const base = toBase(tx.amount, tx.currency);
    total += base;
    const bucket = sums.get(tx.category) ?? { amount: 0, count: 0 };
    bucket.amount += base;
    bucket.count += 1;
    sums.set(tx.category, bucket);
  }

  const rows: CategoryBreakdownRow[] = catalog.map((c) => {
    const bucket = sums.get(c.value) ?? { amount: 0, count: 0 };
    return {
      category: c.value,
      label: c.label,
      short: LEDGER_CATEGORY_SHORT[c.value],
      tint: LEDGER_CATEGORY_TINT[c.value],
      amount: Number(bucket.amount.toFixed(2)),
      percent: total > 0 ? (bucket.amount / total) * 100 : 0,
      count: bucket.count,
    };
  });

  // Categories with spend first, then alphabetical by short label among zeros
  rows.sort((a, b) => {
    if (b.amount !== a.amount) return b.amount - a.amount;
    return a.short.localeCompare(b.short);
  });

  return { total: Number(total.toFixed(2)), rows };
}

/**
 * Aggregate ledger amounts by category for Day / Month / YTD (same windows as Ledger).
 * Amounts are converted to the portfolio base currency.
 */
export function buildLedgerCategoryBreakdown(
  transactions: Transaction[],
  currencies: Currency[],
  period: LedgerSummaryPeriod,
  today: string = new Date().toISOString().slice(0, 10),
): LedgerCategoryBreakdown {
  const filtered = filterTransactionsByPeriod(transactions, period, today);
  const toBase = (amount: number, currency: string) =>
    toBaseCurrency(amount, currency, currencies);

  const expense = rowsForType(filtered, "expense", EXPENSE_CATEGORIES, toBase);
  const income = rowsForType(filtered, "income", INCOME_CATEGORIES, toBase);

  return {
    period,
    incomeTotal: income.total,
    expenseTotal: expense.total,
    income: income.rows,
    expense: expense.rows,
  };
}

/** Chart bars: non-zero categories only (expense negative for diverging chart optional). */
export function categoryBarsForChart(
  breakdown: LedgerCategoryBreakdown,
  type: TransactionType,
): { key: string; label: string; amount: number; tint: string }[] {
  const rows = type === "income" ? breakdown.income : breakdown.expense;
  return rows
    .filter((r) => r.amount > 0)
    .map((r) => ({
      key: r.category,
      label: r.short,
      amount: r.amount,
      tint: r.tint,
    }));
}
