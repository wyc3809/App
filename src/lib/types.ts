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
