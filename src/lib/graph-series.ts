import { toBaseCurrency } from "./currencies";
import type { Currency, Transaction } from "./types";

export interface MonthlyCashflowBar {
  /** YYYY-MM */
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface CalendarDayCell {
  date: string;
  /** expense in base (0 if none) */
  expense: number;
  /** income in base (0 if none) */
  income: number;
  /** income - expense */
  net: number;
  intensity: number; // 0–1 based on expense relative to max in window
  /** false for padding days outside the focused month */
  inMonth?: boolean;
}

function monthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

/** Aggregate ledger cashflow by calendar month (base currency). */
export function buildMonthlyCashflowBars(
  transactions: Transaction[],
  currencies: Currency[],
  months = 12,
): MonthlyCashflowBar[] {
  const map = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    const key = tx.date.slice(0, 7);
    const base = toBaseCurrency(tx.amount, tx.currency, currencies);
    const row = map.get(key) ?? { income: 0, expense: 0 };
    if (tx.type === "income") row.income += base;
    else row.expense += base;
    map.set(key, row);
  }

  const end = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
  }

  return keys.map((month) => {
    const row = map.get(month) ?? { income: 0, expense: 0 };
    return {
      month,
      label: monthLabel(month),
      income: Number(row.income.toFixed(2)),
      expense: Number(row.expense.toFixed(2)),
      net: Number((row.income - row.expense).toFixed(2)),
    };
  });
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function ledgerTotalsByDate(
  transactions: Transaction[],
  currencies: Currency[],
): Map<string, { income: number; expense: number }> {
  const byDate = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    const base = toBaseCurrency(tx.amount, tx.currency, currencies);
    const row = byDate.get(tx.date) ?? { income: 0, expense: 0 };
    if (tx.type === "income") row.income += base;
    else row.expense += base;
    byDate.set(tx.date, row);
  }
  return byDate;
}

/**
 * Month grid (Mon–Sun) for a given year/month, with leading/trailing
 * padding days from adjacent months.
 */
export function buildMonthlyCalendarDays(
  transactions: Transaction[],
  currencies: Currency[],
  year: number,
  monthIndex: number, // 0–11
): CalendarDayCell[] {
  const byDate = ledgerTotalsByDate(transactions, currencies);
  const first = new Date(year, monthIndex, 1);
  first.setHours(12, 0, 0, 0);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const start = new Date(first);
  start.setDate(first.getDate() - startDow);

  const last = new Date(year, monthIndex + 1, 0);
  last.setHours(12, 0, 0, 0);
  const endDow = (last.getDay() + 6) % 7;
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - endDow));

  const cells: CalendarDayCell[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const date = isoDate(cursor);
    const row = byDate.get(date) ?? { income: 0, expense: 0 };
    cells.push({
      date,
      income: Number(row.income.toFixed(2)),
      expense: Number(row.expense.toFixed(2)),
      net: Number((row.income - row.expense).toFixed(2)),
      intensity: 0,
      inMonth: cursor.getMonth() === monthIndex,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxExpense = Math.max(
    0,
    ...cells.filter((c) => c.inMonth).map((c) => c.expense),
  );
  return cells.map((c) => ({
    ...c,
    intensity: c.inMonth && maxExpense > 0 ? c.expense / maxExpense : 0,
  }));
}

/**
 * Daily ledger activity for a calendar heatmap covering `weeks` weeks
 * ending today (Mon–Sun rows).
 */
export function buildLedgerCalendarDays(
  transactions: Transaction[],
  currencies: Currency[],
  weeks = 16,
): CalendarDayCell[] {
  const byDate = ledgerTotalsByDate(transactions, currencies);

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const totalDays = weeks * 7;
  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));

  const startDow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - startDow);
  const end = new Date(today);
  const endDow = (end.getDay() + 6) % 7;
  end.setDate(end.getDate() + (6 - endDow));

  const cells: CalendarDayCell[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const date = isoDate(cursor);
    const row = byDate.get(date) ?? { income: 0, expense: 0 };
    const net = row.income - row.expense;
    cells.push({
      date,
      income: Number(row.income.toFixed(2)),
      expense: Number(row.expense.toFixed(2)),
      net: Number(net.toFixed(2)),
      intensity: 0,
      inMonth: true,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxExpense = Math.max(0, ...cells.map((c) => c.expense));
  return cells.map((c) => ({
    ...c,
    intensity: maxExpense > 0 ? c.expense / maxExpense : 0,
  }));
}
