import { DEFAULT_CURRENCIES } from "./currencies";
import type {
  Account,
  AccountCategory,
  Currency,
  HistoricalSnapshot,
  UserSettings,
} from "./types";

export interface WorthBackupPayload {
  exportedAt?: string;
  settings: UserSettings;
  currencies: Currency[];
  accounts: Account[];
  snapshots: HistoricalSnapshot[];
}

const ASSET_CATEGORIES = new Set([
  "cash",
  "investment",
  "real_estate",
  "crypto",
  "vehicle",
  "other",
]);
const LIABILITY_CATEGORIES = new Set(["mortgage", "loan", "credit_card", "other"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseCurrency(raw: unknown): Currency | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.code !== "string" || !raw.code.trim()) return null;
  if (typeof raw.symbol !== "string") return null;
  if (typeof raw.name !== "string") return null;
  if (!isFiniteNumber(raw.exchangeRateToBase) || raw.exchangeRateToBase <= 0) return null;
  return {
    code: raw.code.trim().toUpperCase(),
    symbol: raw.symbol,
    name: raw.name,
    exchangeRateToBase: raw.exchangeRateToBase,
  };
}

function parseAccount(raw: unknown): Account | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (typeof raw.name !== "string" || !raw.name.trim()) return null;
  if (typeof raw.category !== "string") return null;
  if (typeof raw.isLiability !== "boolean") return null;
  if (typeof raw.currency !== "string" || !raw.currency) return null;
  if (!isFiniteNumber(raw.currentValue) || raw.currentValue < 0) return null;
  if (typeof raw.updatedAt !== "string") return null;
  if (typeof raw.createdAt !== "string") return null;

  const category = raw.category as AccountCategory;
  const okCategory = raw.isLiability
    ? LIABILITY_CATEGORIES.has(category)
    : ASSET_CATEGORIES.has(category);
  if (!okCategory) return null;

  const asOfDate =
    typeof raw.asOfDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.asOfDate)
      ? raw.asOfDate
      : raw.createdAt.slice(0, 10);

  return {
    id: raw.id,
    name: raw.name.trim(),
    category,
    isLiability: raw.isLiability,
    currency: raw.currency,
    currentValue: raw.currentValue,
    asOfDate,
    institutionName:
      typeof raw.institutionName === "string" ? raw.institutionName : undefined,
    note: typeof raw.note === "string" ? raw.note : undefined,
    updatedAt: raw.updatedAt,
    createdAt: raw.createdAt,
  };
}

function parseSnapshot(raw: unknown): HistoricalSnapshot | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (typeof raw.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date)) return null;
  if (!isFiniteNumber(raw.totalAssetsBaseCurrency)) return null;
  if (!isFiniteNumber(raw.totalLiabilitiesBaseCurrency)) return null;
  if (!isFiniteNumber(raw.netWorthBaseCurrency)) return null;
  if (!Array.isArray(raw.accountBalances)) return null;

  const accountBalances = raw.accountBalances
    .map((b) => {
      if (!isRecord(b)) return null;
      if (typeof b.accountId !== "string") return null;
      if (!isFiniteNumber(b.balance)) return null;
      if (typeof b.currency !== "string") return null;
      return {
        accountId: b.accountId,
        balance: b.balance,
        currency: b.currency,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  return {
    id: raw.id,
    date: raw.date,
    totalAssetsBaseCurrency: raw.totalAssetsBaseCurrency,
    totalLiabilitiesBaseCurrency: raw.totalLiabilitiesBaseCurrency,
    netWorthBaseCurrency: raw.netWorthBaseCurrency,
    accountBalances,
  };
}

function parseSettings(raw: unknown): UserSettings | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.baseCurrency !== "string" || !raw.baseCurrency) return null;
  if (typeof raw.isPrivacyMode !== "boolean") return null;
  if (typeof raw.isBiometricEnabled !== "boolean") return null;
  if (raw.theme !== "light" && raw.theme !== "dark" && raw.theme !== "system") {
    return null;
  }
  return {
    baseCurrency: raw.baseCurrency,
    isPrivacyMode: raw.isPrivacyMode,
    isBiometricEnabled: raw.isBiometricEnabled,
    theme: raw.theme,
  };
}

export type ImportResult =
  | { ok: true; data: WorthBackupPayload }
  | { ok: false; error: string };

export function parseWorthBackup(input: unknown): ImportResult {
  if (!isRecord(input)) {
    return { ok: false, error: "Backup must be a JSON object." };
  }

  const settings = parseSettings(input.settings);
  if (!settings) {
    return { ok: false, error: "Invalid or missing settings in backup." };
  }

  if (!Array.isArray(input.accounts)) {
    return { ok: false, error: "Backup accounts must be an array." };
  }
  if (!Array.isArray(input.snapshots)) {
    return { ok: false, error: "Backup snapshots must be an array." };
  }

  const accounts = input.accounts.map(parseAccount);
  if (accounts.some((a) => a === null)) {
    return { ok: false, error: "One or more accounts in the backup are invalid." };
  }

  const snapshots = input.snapshots.map(parseSnapshot);
  if (snapshots.some((s) => s === null)) {
    return { ok: false, error: "One or more snapshots in the backup are invalid." };
  }

  let currencies: Currency[] = DEFAULT_CURRENCIES;
  if (Array.isArray(input.currencies) && input.currencies.length > 0) {
    const parsed = input.currencies.map(parseCurrency);
    if (parsed.some((c) => c === null)) {
      return { ok: false, error: "One or more currencies in the backup are invalid." };
    }
    currencies = parsed as Currency[];
  }

  if (!currencies.some((c) => c.code === settings.baseCurrency)) {
    return {
      ok: false,
      error: `Base currency ${settings.baseCurrency} is missing from currencies list.`,
    };
  }

  return {
    ok: true,
    data: {
      exportedAt: typeof input.exportedAt === "string" ? input.exportedAt : undefined,
      settings,
      currencies,
      accounts: accounts as Account[],
      snapshots: (snapshots as HistoricalSnapshot[]).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    },
  };
}

export async function readBackupFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const json = JSON.parse(text) as unknown;
    return parseWorthBackup(json);
  } catch {
    return { ok: false, error: "Could not read JSON file. Check the file format." };
  }
}
