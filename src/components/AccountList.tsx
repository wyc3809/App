"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Landmark, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { ASSET_TYPES, LIABILITY_TYPES, categoryColor } from "@/lib/categories";
import { toBaseCurrency } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";
import { hapticTap } from "@/lib/haptic";
import { useWorthStore } from "@/lib/store";
import type { Account, AccountCategory } from "@/lib/types";

interface AccountListProps {
  filter?: "all" | "assets" | "liabilities";
  categories?: import("@/lib/types").AccountCategory[];
}

type TopGroup = "assets" | "liabilities";

interface CategoryGroup {
  category: AccountCategory;
  label: string;
  color: string;
  isLiability: boolean;
  items: Account[];
  total: number;
}

function buildCategoryGroups(
  accounts: Account[],
  currencies: ReturnType<typeof useWorthStore.getState>["currencies"],
): CategoryGroup[] {
  const order: AccountCategory[] = [
    ...ASSET_TYPES.map((t) => t.value),
    ...LIABILITY_TYPES.map((t) => t.value),
  ];

  const byCategory = new Map<AccountCategory, Account[]>();
  for (const account of accounts) {
    const list = byCategory.get(account.category) ?? [];
    list.push(account);
    byCategory.set(account.category, list);
  }

  return order
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
      const meta = [...ASSET_TYPES, ...LIABILITY_TYPES].find((t) => t.value === category);
      return {
        category,
        label: meta?.label ?? category,
        color: categoryColor(category),
        isLiability: items[0]?.isLiability ?? false,
        items,
        total,
      };
    });
}

export function AccountList({ filter = "all", categories = [] }: AccountListProps) {
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);

  const [expandedTop, setExpandedTop] = useState<TopGroup | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<AccountCategory>>(
    () => new Set(),
  );

  const filteredAccounts = useMemo(
    () =>
      accounts
        .filter((a) => {
          if (filter === "assets") return !a.isLiability;
          if (filter === "liabilities") return a.isLiability;
          return true;
        })
        .filter((a) => (categories.length === 0 ? true : categories.includes(a.category))),
    [accounts, filter, categories],
  );

  const allGroups = useMemo(
    () => buildCategoryGroups(filteredAccounts, currencies),
    [filteredAccounts, currencies],
  );

  const assetGroups = useMemo(
    () => allGroups.filter((g) => !g.isLiability),
    [allGroups],
  );
  const liabilityGroups = useMemo(
    () => allGroups.filter((g) => g.isLiability),
    [allGroups],
  );

  const assetTotal = useMemo(
    () => assetGroups.reduce((sum, g) => sum + g.total, 0),
    [assetGroups],
  );
  const liabilityTotal = useMemo(
    () => liabilityGroups.reduce((sum, g) => sum + g.total, 0),
    [liabilityGroups],
  );

  const assetCount = useMemo(
    () => assetGroups.reduce((sum, g) => sum + g.items.length, 0),
    [assetGroups],
  );
  const liabilityCount = useMemo(
    () => liabilityGroups.reduce((sum, g) => sum + g.items.length, 0),
    [liabilityGroups],
  );

  const toggleTop = (group: TopGroup) => {
    hapticTap();
    setExpandedTop((current) => (current === group ? null : group));
  };

  const toggleCategory = (category: AccountCategory) => {
    hapticTap();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  if (allGroups.length === 0) {
    return (
      <div
        className="rounded-2xl px-4 py-10 text-center text-sm"
        style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
      >
        No accounts yet. Add your first asset or liability.
      </div>
    );
  }

  const renderAccountRow = (account: Account, groupLabel: string) => {
    const signed = account.isLiability
      ? -Math.abs(account.currentValue)
      : account.currentValue;
    return (
      <li key={account.id}>
        <Link
          href={`/accounts/detail/?id=${account.id}`}
          className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[var(--bg-muted)]"
        >
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{account.name}</h3>
            <p className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
              {account.institutionName || groupLabel}
              {account.asOfDate ? ` · ${account.asOfDate}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <p
              className="font-semibold tabular-nums"
              style={{
                color: account.isLiability ? "var(--negative)" : "var(--fg)",
              }}
            >
              {formatMoney(signed, account.currency, currencies, {
                privacy: settings.isPrivacyMode,
                showSign: account.isLiability,
              })}
            </p>
            <ChevronRight size={18} style={{ color: "var(--fg-subtle)" }} />
          </div>
        </Link>
      </li>
    );
  };

  const renderCategoryGroup = (group: CategoryGroup) => {
    const open = expandedCategories.has(group.category);
    return (
      <section key={group.category} className="space-y-2">
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
          }}
          aria-expanded={open}
          onClick={() => toggleCategory(group.category)}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: group.color }}
            />
            <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              {group.label}
            </h2>
            <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              {group.items.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-semibold tabular-nums"
              style={{ color: group.isLiability ? "var(--negative)" : "var(--fg)" }}
            >
              {formatMoney(
                group.isLiability ? -group.total : group.total,
                settings.baseCurrency,
                currencies,
                {
                  privacy: settings.isPrivacyMode,
                  compact: true,
                  showSign: group.isLiability,
                },
              )}
            </p>
            <ChevronDown
              size={18}
              className="shrink-0 transition-transform duration-200"
              style={{
                color: "var(--fg-subtle)",
                transform: open ? "rotate(180deg)" : undefined,
              }}
            />
          </div>
        </button>

        {open ? (
          <ul
            className="card-surface divide-y overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            {group.items.map((account) => renderAccountRow(account, group.label))}
          </ul>
        ) : null}
      </section>
    );
  };

  const renderTopGroup = (
    top: TopGroup,
    label: string,
    count: number,
    total: number,
    isLiability: boolean,
    groups: CategoryGroup[],
  ) => {
    const open = expandedTop === top;
    return (
      <section className="space-y-2">
        <button
          type="button"
          className="list-row w-full text-left transition hover:opacity-95"
          aria-expanded={open}
          onClick={() => toggleTop(top)}
        >
          <div
            className="list-row-icon"
            style={
              isLiability
                ? { background: "rgba(220, 38, 38, 0.1)", color: "var(--negative)" }
                : { background: "var(--accent-soft)", color: "var(--accent)" }
            }
          >
            {isLiability ? (
              <Landmark size={18} strokeWidth={2.25} />
            ) : (
              <WalletCards size={18} strokeWidth={2.25} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{label}</p>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              {count} account{count === 1 ? "" : "s"}
            </p>
          </div>
          <p
            className="shrink-0 font-semibold tabular-nums"
            style={{ color: isLiability ? "var(--negative)" : "var(--fg)" }}
          >
            {formatMoney(total, settings.baseCurrency, currencies, {
              privacy: settings.isPrivacyMode,
              compact: true,
              showSign: isLiability,
            })}
          </p>
          <ChevronDown
            size={18}
            className="shrink-0 transition-transform duration-200"
            style={{
              color: "var(--fg-subtle)",
              transform: open ? "rotate(180deg)" : undefined,
            }}
          />
        </button>
        {open ? (
          <div className="space-y-3 pl-1">{groups.map(renderCategoryGroup)}</div>
        ) : null}
      </section>
    );
  };

  if (filter === "all") {
    return (
      <div className="space-y-2">
        {assetGroups.length > 0
          ? renderTopGroup("assets", "Assets", assetCount, assetTotal, false, assetGroups)
          : null}
        {liabilityGroups.length > 0
          ? renderTopGroup(
              "liabilities",
              "Liabilities",
              liabilityCount,
              liabilityTotal,
              true,
              liabilityGroups,
            )
          : null}
      </div>
    );
  }

  const visibleGroups = filter === "assets" ? assetGroups : liabilityGroups;
  return <div className="space-y-3">{visibleGroups.map(renderCategoryGroup)}</div>;
}
