import { ASSET_TYPES, LIABILITY_TYPES, categoryColor } from "./categories";
import { toBaseCurrency } from "./currencies";
import type { Account, AccountCategory, Currency } from "./types";

export interface CategoryGroup {
  category: AccountCategory;
  label: string;
  color: string;
  isLiability: boolean;
  items: Account[];
  total: number;
}

/** Stable unique category order (ASSET_TYPES + LIABILITY_TYPES share `"other"`). */
export function categoryDisplayOrder(): AccountCategory[] {
  return [
    ...new Set<AccountCategory>([
      ...ASSET_TYPES.map((t) => t.value),
      ...LIABILITY_TYPES.map((t) => t.value),
    ]),
  ];
}

/**
 * Group accounts by category for the Accounts list.
 * `"other"` is one AccountCategory used for both Other Asset and Other Liability —
 * never emit that bucket twice or the same account rows double-count.
 */
export function buildCategoryGroups(
  accounts: Account[],
  currencies: Currency[],
): CategoryGroup[] {
  const byCategory = new Map<AccountCategory, Account[]>();
  for (const account of accounts) {
    const list = byCategory.get(account.category) ?? [];
    list.push(account);
    byCategory.set(account.category, list);
  }

  return categoryDisplayOrder()
    .filter((cat) => byCategory.has(cat))
    .map((category) => {
      const items = (byCategory.get(category) ?? []).sort((a, b) => {
        const av = toBaseCurrency(a.currentValue, a.currency, currencies);
        const bv = toBaseCurrency(b.currentValue, b.currency, currencies);
        return bv - av;
      });
      const total = items.reduce(
        (sum, a) => sum + toBaseCurrency(a.currentValue, a.currency, currencies),
        0,
      );
      const isLiability = items[0]?.isLiability ?? false;
      const meta = (isLiability ? LIABILITY_TYPES : ASSET_TYPES).find(
        (t) => t.value === category,
      );
      return {
        category,
        label: meta?.label ?? category,
        color: categoryColor(category),
        isLiability,
        items,
        total,
      };
    });
}
