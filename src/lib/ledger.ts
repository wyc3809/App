import { categoryAfterTypeFlip } from "./categories";
import type {
  AccountCategory,
  AccountValueEntry,
  LedgerCategory,
  Transaction,
  TransactionType,
} from "./types";

export const INCOME_CATEGORIES: { value: LedgerCategory; label: string }[] = [
  { value: "salary", label: "Salary" },
  { value: "bonus", label: "Bonus" },
  { value: "rental", label: "Rental" },
  { value: "allowance", label: "Allowance" },
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

/** Day = today · Month = from the 1st (MTD, default) · YTD = Jan 1 → today */
export type LedgerSummaryPeriod = "day" | "month" | "ytd";

export function ledgerPeriodStart(
  period: LedgerSummaryPeriod,
  today: string = new Date().toISOString().slice(0, 10),
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return today;
  if (period === "day") return today;
  if (period === "month") return `${today.slice(0, 7)}-01`;
  return `${today.slice(0, 4)}-01-01`;
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: LedgerSummaryPeriod,
  today: string = new Date().toISOString().slice(0, 10),
): Transaction[] {
  const start = ledgerPeriodStart(period, today);
  return transactions.filter((tx) => tx.date >= start && tx.date <= today);
}

export function ledgerPeriodShortLabel(period: LedgerSummaryPeriod): string {
  if (period === "day") return "Day";
  if (period === "month") return "Month";
  return "YTD";
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
 * Crossing below zero flips asset ↔ liability and keeps the absolute surplus.
 */
export interface LedgerBalanceResult {
  /** Absolute balance after the change (>= 0). */
  value: number;
  isLiability: boolean;
  flipped: boolean;
  /** Raw signed delta applied to the pre-change balance (can drive below zero). */
  signedDelta: number;
}

/**
 * Liabilities store absolute magnitude (>= 0); legacy rows may be negative.
 * Assets may store signed values (overdraft) for flip logic.
 */
export function balanceMagnitudeForLedger(
  value: number,
  isLiability: boolean,
): number {
  return isLiability ? Math.abs(value) : value;
}

/** Signed balance as shown in account UI. */
export function storedBalanceAsSigned(
  value: number,
  isLiability: boolean,
): number {
  return isLiability ? -Math.abs(value) : value;
}

/** Convert internal ledger delta to a signed display change. */
export function ledgerDeltaForDisplay(
  delta: number,
  isLiability: boolean,
): number {
  return isLiability ? -delta : delta;
}

export function applyLedgerDeltaToBalance(
  currentValue: number,
  isLiability: boolean,
  type: TransactionType,
  amountInAccountCurrency: number,
): LedgerBalanceResult {
  const signedDelta = isLiability
    ? type === "expense"
      ? amountInAccountCurrency
      : -amountInAccountCurrency
    : type === "income"
      ? amountInAccountCurrency
      : -amountInAccountCurrency;
  const raw = Number((currentValue + signedDelta).toFixed(2));
  if (raw >= 0) {
    return {
      value: raw,
      isLiability,
      flipped: false,
      signedDelta,
    };
  }
  return {
    value: Math.abs(raw),
    isLiability: !isLiability,
    flipped: true,
    signedDelta,
  };
}

/**
 * Convert a form/API entered number into a signed net position.
 * - Asset mode: entered value is already signed (overdraft allowed).
 * - Liability mode: absolute value is amount owed (legacy negatives kept as debt).
 */
export function enteredBalanceToSignedPosition(
  entered: number,
  preferredIsLiability: boolean,
): number {
  if (!Number.isFinite(entered)) return 0;
  if (preferredIsLiability) {
    return -Math.abs(entered);
  }
  return entered;
}

export interface NormalizedAccountBalance {
  isLiability: boolean;
  /** Stored balance: liability magnitude >= 0; asset may be 0+. */
  value: number;
  category: AccountCategory;
  flipped: boolean;
  /** Signed net position used for classification (+ asset / − liability). */
  signedPosition: number;
}

/**
 * Classify a balance by signed position and pick stored fields.
 *
 * Rules:
 * - Asset + negative → liability (overdraft)
 * - Liability + any (incl. legacy negative) → liability magnitude
 * - Liability edited to an explicit negative via signed UI is handled by
 *   callers passing preferredIsLiability=false after interpreting the sign,
 *   or by `normalizeSignedDisplayBalance`.
 */
export function normalizeEnteredBalance(
  entered: number,
  preferredIsLiability: boolean,
  preferredCategory: AccountCategory,
): NormalizedAccountBalance {
  if (!Number.isFinite(entered)) {
    return {
      isLiability: preferredIsLiability,
      value: 0,
      category: preferredCategory,
      flipped: false,
      signedPosition: 0,
    };
  }

  // Asset overdraft → liability
  if (!preferredIsLiability && entered < 0) {
    return {
      isLiability: true,
      value: Math.abs(entered),
      category: categoryAfterTypeFlip(true),
      flipped: true,
      signedPosition: entered,
    };
  }

  // Liability form / legacy: always store magnitude as debt
  if (preferredIsLiability) {
    return {
      isLiability: true,
      value: Math.abs(entered),
      category: preferredCategory,
      flipped: false,
      signedPosition: -Math.abs(entered),
    };
  }

  // Non-negative asset
  return {
    isLiability: false,
    value: entered,
    category: preferredCategory,
    flipped: false,
    signedPosition: entered,
  };
}

/**
 * Normalize a signed amount from Update Value (+/− control).
 * - Asset + negative → liability (overdraft)
 * - Liability → always keep as liability magnitude (legacy signed rows included)
 */
export function normalizeSignedDisplayBalance(
  signedDisplay: number,
  currentIsLiability: boolean,
  currentCategory: AccountCategory,
): NormalizedAccountBalance {
  if (!Number.isFinite(signedDisplay)) {
    return {
      isLiability: currentIsLiability,
      value: 0,
      category: currentCategory,
      flipped: false,
      signedPosition: 0,
    };
  }

  if (currentIsLiability) {
    return {
      isLiability: true,
      value: Math.abs(signedDisplay),
      category: currentCategory,
      flipped: false,
      signedPosition: -Math.abs(signedDisplay),
    };
  }

  if (signedDisplay < 0) {
    return {
      isLiability: true,
      value: Math.abs(signedDisplay),
      category: categoryAfterTypeFlip(true),
      flipped: true,
      signedPosition: signedDisplay,
    };
  }

  return {
    isLiability: false,
    value: signedDisplay,
    category: currentCategory,
    flipped: false,
    signedPosition: signedDisplay,
  };
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
 * Latest balance for an account on/before `date` (same-day uses newest createdAt),
 * else the provided fallback (usually `account.currentValue`).
 */
export function balanceOnDate(
  entries: AccountValueEntry[],
  accountId: string,
  date: string,
  fallback: number,
): number {
  const prior = entries
    .filter((e) => e.accountId === accountId && e.date <= date)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
  return prior[0]?.value ?? fallback;
}

/** True if `a` is strictly after `b` in value-history order. */
export function isEntryAfter(
  a: Pick<AccountValueEntry, "date" | "createdAt">,
  b: Pick<AccountValueEntry, "date" | "createdAt">,
): boolean {
  const d = a.date.localeCompare(b.date);
  if (d !== 0) return d > 0;
  return a.createdAt.localeCompare(b.createdAt) > 0;
}

/**
 * Liability flag as of `date` (inclusive of typeFlips on that day).
 * Reconstructs initial state from typeFlip metadata, then walks forward.
 */
export function liabilityStateOnDate(
  entries: AccountValueEntry[],
  accountId: string,
  date: string,
  currentIsLiability: boolean,
): boolean {
  const chronological = entries
    .filter((e) => e.accountId === accountId)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    );

  let isLiability = currentIsLiability;
  for (let i = chronological.length - 1; i >= 0; i -= 1) {
    const flip = chronological[i].typeFlip;
    if (flip) isLiability = flip.fromIsLiability;
  }

  for (const entry of chronological) {
    if (entry.date > date) break;
    if (entry.typeFlip) isLiability = entry.typeFlip.toIsLiability;
  }
  return isLiability;
}

/**
 * Liability flag immediately before applying a mutation at `date`/`createdAt`.
 * Entries on the same day with later createdAt are ignored.
 */
export function liabilityStateBefore(
  entries: AccountValueEntry[],
  accountId: string,
  date: string,
  currentIsLiability: boolean,
  beforeCreatedAt?: string,
): boolean {
  const chronological = entries
    .filter((e) => e.accountId === accountId)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
    );

  let isLiability = currentIsLiability;
  for (let i = chronological.length - 1; i >= 0; i -= 1) {
    const flip = chronological[i].typeFlip;
    if (flip) isLiability = flip.fromIsLiability;
  }

  for (const entry of chronological) {
    if (entry.date > date) break;
    if (
      entry.date === date &&
      beforeCreatedAt &&
      entry.createdAt.localeCompare(beforeCreatedAt) >= 0
    ) {
      break;
    }
    if (entry.typeFlip) isLiability = entry.typeFlip.toIsLiability;
  }
  return isLiability;
}
