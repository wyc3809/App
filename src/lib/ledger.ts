import type {
  AccountValueEntry,
  LedgerCategory,
  Transaction,
  TransactionType,
} from "./types";

export const INCOME_CATEGORIES: { value: LedgerCategory; label: string }[] = [
  { value: "salary", label: "Salary" },
  { value: "bonus", label: "Bonus" },
  { value: "investment_return", label: "Investment return" },
  { value: "gift", label: "Gift" },
  { value: "transfer", label: "Transfer in" },
  { value: "other", label: "Other income" },
];

export const EXPENSE_CATEGORIES: { value: LedgerCategory; label: string }[] = [
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "housing", label: "Housing" },
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "health", label: "Health" },
  { value: "utilities", label: "Utilities" },
  { value: "transfer", label: "Transfer out" },
  { value: "other", label: "Other expense" },
];

export function ledgerCategoriesFor(type: TransactionType) {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function ledgerCategoryLabel(category: LedgerCategory): string {
  return (
    [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].find((c) => c.value === category)
      ?.label ?? category
  );
}

export interface LedgerTotals {
  income: number;
  expense: number;
  net: number;
}

/** Sum transactions converted with a provided converter to base currency. */
export function computeLedgerTotals(
  transactions: Transaction[],
  toBase: (amount: number, currency: string) => number,
): LedgerTotals {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    const base = toBase(tx.amount, tx.currency);
    if (tx.type === "income") income += base;
    else expense += base;
  }
  return { income, expense, net: income - expense };
}

/**
 * How a ledger entry changes an account balance.
 * Assets: income +, expense −
 * Liabilities: expense + (more debt), income − (payment)
 */
export function applyLedgerDeltaToBalance(
  currentValue: number,
  isLiability: boolean,
  type: TransactionType,
  amountInAccountCurrency: number,
): number {
  const signed = isLiability
    ? type === "expense"
      ? amountInAccountCurrency
      : -amountInAccountCurrency
    : type === "income"
      ? amountInAccountCurrency
      : -amountInAccountCurrency;
  return Math.max(0, Number((currentValue + signed).toFixed(2)));
}

export function groupTransactionsByDate(
  transactions: Transaction[],
): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  const sorted = [...transactions].sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return b.createdAt.localeCompare(a.createdAt);
  });
  for (const tx of sorted) {
    const list = map.get(tx.date) ?? [];
    list.push(tx);
    map.set(tx.date, list);
  }
  return [...map.entries()].map(([date, items]) => ({ date, items }));
}

/** Flip income ↔ expense (used when reversing a linked ledger effect). */
export function oppositeTransactionType(type: TransactionType): TransactionType {
  return type === "income" ? "expense" : "income";
}

/**
 * Balance for an account on `date`: exact entry that day, else latest on/before,
 * else the provided fallback (usually `account.currentValue`).
 */
export function balanceOnDate(
  entries: AccountValueEntry[],
  accountId: string,
  date: string,
  fallback: number,
): number {
  const onDay = entries.find((e) => e.accountId === accountId && e.date === date);
  if (onDay) return onDay.value;
  const prior = entries
    .filter((e) => e.accountId === accountId && e.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date));
  return prior[0]?.value ?? fallback;
}
