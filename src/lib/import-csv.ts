import { ASSET_TYPES, LIABILITY_TYPES } from "./categories";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "./ledger";
import type {
  AccountCategory,
  LedgerCategory,
  TransactionType,
} from "./types";

export interface CsvAccountRow {
  name: string;
  category: AccountCategory;
  isLiability: boolean;
  currency: string;
  currentValue: number;
  asOfDate: string;
  institutionName?: string;
  note?: string;
}

export interface CsvTransactionRow {
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  title: string;
  category: LedgerCategory;
  accountName?: string;
  note?: string;
}

export type CsvImportKind = "accounts" | "ledger" | "mixed";

export type CsvParseResult =
  | {
      ok: true;
      kind: CsvImportKind;
      accounts: CsvAccountRow[];
      transactions: CsvTransactionRow[];
      skipped: number;
      warnings: string[];
    }
  | { ok: false; error: string };

const ASSET_SET = new Set<string>(ASSET_TYPES.map((t) => t.value));
const LIABILITY_SET = new Set<string>(LIABILITY_TYPES.map((t) => t.value));
const INCOME_SET = new Set<string>(INCOME_CATEGORIES.map((c) => c.value));
const EXPENSE_SET = new Set<string>(EXPENSE_CATEGORIES.map((c) => c.value));
const LEDGER_SET = new Set<string>([...INCOME_SET, ...EXPENSE_SET]);

/** Split a CSV line respecting double-quoted fields. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseCsvText(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((l) => l.trim().length > 0);
  return lines.map(splitCsvLine);
}

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^\w]/g, "");
}

function headerIndex(headers: string[], aliases: string[]): number {
  const map = headers.map(normHeader);
  for (const alias of aliases) {
    const i = map.indexOf(normHeader(alias));
    if (i >= 0) return i;
  }
  return -1;
}

function cell(row: string[], index: number): string {
  if (index < 0 || index >= row.length) return "";
  return row[index]?.trim() ?? "";
}

/** Accept YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, YYYY/MM/DD. */
export function parseCsvDate(raw: string, fallback = ""): string | null {
  const s = raw.trim();
  if (!s) return fallback || null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const slash = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const y = slash[3];
    // Prefer DD/MM/YYYY (HK/UK); if first > 12 it's clearly day-first
    let day: number;
    let month: number;
    if (a > 12) {
      day = a;
      month = b;
    } else if (b > 12) {
      month = a;
      day = b;
    } else {
      day = a;
      month = b;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const ymd = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (ymd) {
    const y = ymd[1];
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[, ]/g, "").replace(/^[+$]/, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.abs(n);
}

function parseLiabilityFlag(raw: string, category?: string): boolean | null {
  const s = raw.trim().toLowerCase();
  if (!s) {
    if (category && LIABILITY_SET.has(normHeader(category))) return true;
    if (category && ASSET_SET.has(normHeader(category))) return false;
    return null;
  }
  if (["liability", "liabilities", "debt", "loan", "1", "true", "yes", "l"].includes(s)) {
    return true;
  }
  if (["asset", "assets", "0", "false", "no", "a"].includes(s)) {
    return false;
  }
  return null;
}

function parseAccountCategory(raw: string, isLiability: boolean): AccountCategory {
  const s = normHeader(raw).replace(/_+/g, "_");
  const aliases: Record<string, AccountCategory> = {
    cash: "cash",
    bank: "cash",
    cash_bank: "cash",
    investment: "investment",
    investments: "investment",
    stocks: "investment",
    real_estate: "real_estate",
    property: "real_estate",
    crypto: "crypto",
    cryptocurrency: "crypto",
    vehicle: "vehicle",
    car: "vehicle",
    other: "other",
    other_asset: "other",
    mortgage: "mortgage",
    loan: "loan",
    credit_card: "credit_card",
    creditcard: "credit_card",
    card: "credit_card",
    other_liability: "other",
  };
  const mapped = aliases[s];
  if (mapped) {
    if (isLiability && !LIABILITY_SET.has(mapped)) return "loan";
    if (!isLiability && !ASSET_SET.has(mapped)) return "cash";
    return mapped;
  }
  return isLiability ? "loan" : "other";
}

function parseTxnType(raw: string, amountRaw: string): TransactionType | null {
  const s = raw.trim().toLowerCase();
  if (["income", "in", "credit", "deposit", "earn", "+"].includes(s)) return "income";
  if (["expense", "out", "debit", "spend", "payment", "-"].includes(s)) return "expense";
  if (amountRaw.trim().startsWith("-")) return "expense";
  if (amountRaw.trim().startsWith("+")) return "income";
  return null;
}

function parseLedgerCategory(raw: string, type: TransactionType): LedgerCategory {
  const s = normHeader(raw);
  const aliases: Record<string, LedgerCategory> = {
    salary: "salary",
    wage: "salary",
    wages: "salary",
    bonus: "bonus",
    investment_return: "investment_return",
    investment: "investment_return",
    dividend: "investment_return",
    gift: "gift",
    food: "food",
    dining: "food",
    transport: "transport",
    transit: "transport",
    housing: "housing",
    rent: "housing",
    shopping: "shopping",
    entertainment: "entertainment",
    fun: "entertainment",
    health: "health",
    medical: "health",
    utilities: "utilities",
    bills: "utilities",
    transfer: "transfer",
    other: "other",
  };
  const mapped = aliases[s];
  if (mapped && LEDGER_SET.has(mapped)) {
    if (type === "income" && !INCOME_SET.has(mapped) && mapped !== "transfer" && mapped !== "other") {
      return "other";
    }
    if (type === "expense" && !EXPENSE_SET.has(mapped) && mapped !== "transfer" && mapped !== "other") {
      return "other";
    }
    return mapped;
  }
  return "other";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Detect CSV kind from headers and parse rows into account / ledger drafts.
 */
export function parseWorthCsv(text: string): CsvParseResult {
  const table = parseCsvText(text);
  if (table.length < 2) {
    return { ok: false, error: "CSV needs a header row and at least one data row." };
  }

  const headers = table[0];
  const rows = table.slice(1);

  const nameIdx = headerIndex(headers, [
    "name",
    "account",
    "account_name",
    "accountname",
  ]);
  const valueIdx = headerIndex(headers, [
    "current_value",
    "currentvalue",
    "value",
    "balance",
    "amount",
  ]);
  const kindIdx = headerIndex(headers, [
    "kind",
    "type",
    "account_type",
    "is_liability",
    "isliability",
  ]);
  const categoryIdx = headerIndex(headers, ["category", "account_category"]);
  const currencyIdx = headerIndex(headers, ["currency", "ccy", "curr"]);
  const asOfIdx = headerIndex(headers, [
    "as_of",
    "asof",
    "as_of_date",
    "asofdate",
    "date",
  ]);
  const institutionIdx = headerIndex(headers, [
    "institution",
    "institution_name",
    "bank",
  ]);
  const noteIdx = headerIndex(headers, ["note", "notes", "memo", "comment"]);

  const txnTypeIdx = headerIndex(headers, [
    "transaction_type",
    "txn_type",
    "tx_type",
    "entry_type",
  ]);
  const titleIdx = headerIndex(headers, [
    "title",
    "description",
    "desc",
    "payee",
    "merchant",
  ]);
  const dateIdx = headerIndex(headers, [
    "date",
    "transaction_date",
    "txn_date",
    "posted",
  ]);
  const amountIdx = headerIndex(headers, ["amount", "value", "sum"]);
  const ledgerCatIdx = headerIndex(headers, [
    "ledger_category",
    "category",
    "expense_category",
    "income_category",
  ]);
  const accountLinkIdx = headerIndex(headers, [
    "account",
    "account_name",
    "accountname",
    "linked_account",
  ]);

  // Ledger if we have date + amount + (type or signed amount), and not a clear accounts-only sheet
  const looksLikeLedger =
    dateIdx >= 0 &&
    amountIdx >= 0 &&
    (txnTypeIdx >= 0 || titleIdx >= 0 || ledgerCatIdx >= 0);

  const looksLikeAccounts =
    nameIdx >= 0 &&
    valueIdx >= 0 &&
    (kindIdx >= 0 || categoryIdx >= 0 || institutionIdx >= 0);

  // Prefer accounts when both name+value and no transaction_type column
  const preferAccounts =
    looksLikeAccounts && txnTypeIdx < 0 && titleIdx < 0;

  if (!looksLikeLedger && !looksLikeAccounts) {
    return {
      ok: false,
      error:
        "Unrecognized CSV headers. For accounts use: name, category, type, currency, value. For ledger use: date, type, amount, title, category, currency.",
    };
  }

  const accounts: CsvAccountRow[] = [];
  const transactions: CsvTransactionRow[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  if (preferAccounts || (looksLikeAccounts && !looksLikeLedger)) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const name = cell(row, nameIdx);
      const amountRaw = cell(row, valueIdx);
      const amount = parseAmount(amountRaw);
      if (!name || amount === null) {
        skipped++;
        continue;
      }
      const catRaw = cell(row, categoryIdx);
      const kindRaw = cell(row, kindIdx);
      let isLiability = parseLiabilityFlag(kindRaw, catRaw);
      if (isLiability === null) {
        isLiability = LIABILITY_SET.has(normHeader(catRaw));
      }
      const category = parseAccountCategory(catRaw, isLiability);
      const currency = (cell(row, currencyIdx) || "HKD").toUpperCase();
      const asOfDate =
        parseCsvDate(cell(row, asOfIdx), todayISO()) ?? todayISO();
      const institutionName = cell(row, institutionIdx) || undefined;
      const note = cell(row, noteIdx) || undefined;
      accounts.push({
        name,
        category,
        isLiability,
        currency,
        currentValue: amount,
        asOfDate,
        institutionName,
        note,
      });
    }

    if (accounts.length === 0) {
      return { ok: false, error: "No valid account rows found in CSV." };
    }

    return {
      ok: true,
      kind: "accounts",
      accounts,
      transactions: [],
      skipped,
      warnings,
    };
  }

  // Ledger path
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const amountRaw = cell(row, amountIdx);
    const amount = parseAmount(amountRaw);
    const date = parseCsvDate(cell(row, dateIdx));
    const type =
      parseTxnType(cell(row, txnTypeIdx >= 0 ? txnTypeIdx : kindIdx), amountRaw) ??
      (amountRaw.trim().startsWith("-") ? "expense" : null);

    if (amount === null || amount <= 0 || !date || !type) {
      skipped++;
      continue;
    }

    const title =
      cell(row, titleIdx) ||
      (type === "income" ? "Income" : "Expense");
    const category = parseLedgerCategory(
      cell(row, ledgerCatIdx >= 0 ? ledgerCatIdx : categoryIdx),
      type,
    );
    const currency = (cell(row, currencyIdx) || "HKD").toUpperCase();
    const linkedAccount =
      accountLinkIdx >= 0 ? cell(row, accountLinkIdx) || undefined : undefined;
    const note = cell(row, noteIdx) || undefined;

    transactions.push({
      type,
      amount,
      currency,
      date,
      title,
      category,
      accountName: linkedAccount,
      note,
    });
  }

  if (transactions.length === 0) {
    return { ok: false, error: "No valid ledger rows found in CSV." };
  }

  return {
    ok: true,
    kind: "ledger",
    accounts: [],
    transactions,
    skipped,
    warnings,
  };
}

export async function readCsvFile(file: File): Promise<CsvParseResult> {
  try {
    const text = await file.text();
    return parseWorthCsv(text);
  } catch {
    return { ok: false, error: "Could not read CSV file." };
  }
}

/** Example templates for Settings download. */
export const CSV_ACCOUNT_TEMPLATE = `name,type,category,currency,value,as_of_date,institution,note
HSBC Savings,asset,cash,HKD,50000,2026-08-01,HSBC,Everyday account
Brokerage,asset,investment,HKD,120000,2026-08-01,Futu,
Mortgage,liability,mortgage,HKD,1800000,2026-08-01,Bank,Primary home
`;

export const CSV_LEDGER_TEMPLATE = `date,type,amount,currency,title,category,account,note
2026-08-01,income,28000,HKD,August salary,salary,HSBC Savings,
2026-08-02,expense,85.5,HKD,Lunch,food,HSBC Savings,Cafe
2026-08-03,expense,120,HKD,MTR,transport,HSBC Savings,
`;
