import type { AccountCategory, AssetType, LiabilityType } from "./types";

export const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "cash", label: "Cash & Bank" },
  { value: "investment", label: "Investments" },
  { value: "real_estate", label: "Real Estate" },
  { value: "crypto", label: "Crypto" },
  { value: "vehicle", label: "Vehicle" },
  { value: "other", label: "Other Asset" },
];

export const LIABILITY_TYPES: { value: LiabilityType; label: string }[] = [
  { value: "mortgage", label: "Mortgage" },
  { value: "loan", label: "Loan" },
  { value: "credit_card", label: "Credit Card" },
  { value: "other", label: "Other Liability" },
];

export const CATEGORY_META: Record<
  AccountCategory,
  { label: string; color: string; isLiability: boolean }
> = {
  cash: { label: "Cash & Bank", color: "#3B82F6", isLiability: false },
  investment: { label: "Investments", color: "#10B981", isLiability: false },
  real_estate: { label: "Real Estate", color: "#F59E0B", isLiability: false },
  crypto: { label: "Crypto", color: "#8B5CF6", isLiability: false },
  vehicle: { label: "Vehicle", color: "#06B6D4", isLiability: false },
  other: { label: "Other", color: "#64748B", isLiability: false },
  mortgage: { label: "Mortgage", color: "#EF4444", isLiability: true },
  loan: { label: "Loan", color: "#F97316", isLiability: true },
  credit_card: { label: "Credit Card", color: "#EC4899", isLiability: true },
};

export function categoryLabel(category: AccountCategory): string {
  return CATEGORY_META[category]?.label ?? category;
}

export function categoryColor(category: AccountCategory): string {
  return CATEGORY_META[category]?.color ?? "#64748B";
}
