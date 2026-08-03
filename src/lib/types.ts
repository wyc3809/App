export type AssetType =
  | "cash"
  | "investment"
  | "real_estate"
  | "crypto"
  | "vehicle"
  | "other";

export type LiabilityType = "mortgage" | "loan" | "credit_card" | "other";

export type AccountCategory = AssetType | LiabilityType;

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  exchangeRateToBase: number;
}

export interface Account {
  id: string;
  name: string;
  category: AccountCategory;
  isLiability: boolean;
  currency: string;
  currentValue: number;
  /** YYYY-MM-DD — date this balance applies to */
  asOfDate: string;
  institutionName?: string;
  note?: string;
  updatedAt: string;
  createdAt: string;
}

/** Per-account dated balance entry (Value History). */
export interface AccountValueEntry {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  value: number;
  note?: string;
  markOnGraph: boolean;
  createdAt: string;
  /** When set, this row was created by a linked ledger transaction. */
  transactionId?: string;
  /** Signed change vs previous balance (ledger rows); used when reversing. */
  delta?: number;
}

export interface AccountBalanceSnapshot {
  accountId: string;
  balance: number;
  currency: string;
}

export interface HistoricalSnapshot {
  id: string;
  date: string;
  totalAssetsBaseCurrency: number;
  totalLiabilitiesBaseCurrency: number;
  netWorthBaseCurrency: number;
  accountBalances: AccountBalanceSnapshot[];
}

export interface UserSettings {
  baseCurrency: string;
  isPrivacyMode: boolean;
  isBiometricEnabled: boolean;
  theme: "light" | "dark" | "system";
}

export type TimeRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export type TransactionType = "income" | "expense";

export type LedgerCategory =
  | "salary"
  | "bonus"
  | "investment_return"
  | "gift"
  | "food"
  | "transport"
  | "housing"
  | "shopping"
  | "entertainment"
  | "health"
  | "utilities"
  | "transfer"
  | "other";

/** Income / expense bookkeeping entry, optionally linked to an account. */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string; // YYYY-MM-DD
  title: string;
  note?: string;
  category: LedgerCategory;
  /** When set, this entry adjusts the linked account balance. */
  accountId?: string;
  createdAt: string;
}
