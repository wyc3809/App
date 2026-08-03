"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { ASSET_TYPES, LIABILITY_TYPES, categoryColor } from "@/lib/categories";
import { toBaseCurrency } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { Account, AccountCategory } from "@/lib/types";

interface AccountListProps {
  filter?: "all" | "assets" | "liabilities";
  categories?: import("@/lib/types").AccountCategory[];
}

export function AccountList({ filter = "all", categories = [] }: AccountListProps) {
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);

  const groups = useMemo(() => {
    const filtered = accounts.filter((a) => {
      if (filter === "assets") return !a.isLiability;
      if (filter === "liabilities") return a.isLiability;
      return true;
    }).filter((a) => (categories.length === 0 ? true : categories.includes(a.category)));

    const order: AccountCategory[] = [
      ...ASSET_TYPES.map((t) => t.value),
      ...LIABILITY_TYPES.map((t) => t.value),
    ];

    const byCategory = new Map<AccountCategory, Account[]>();
    for (const account of filtered) {
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
  }, [accounts, currencies, filter, categories]);

  if (groups.length === 0) {
    return (
      <div
        className="rounded-2xl px-4 py-10 text-center text-sm"
        style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
      >
        No accounts yet. Add your first asset or liability.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.category} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: group.color }}
              />
              <h2 className="text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>
                {group.label}
              </h2>
              <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                {group.items.length}
              </span>
            </div>
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
          </div>

          <ul className="card-surface divide-y overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {group.items.map((account) => {
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
                        {account.institutionName || group.label}
                        {account.asOfDate ? ` · ${account.asOfDate}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="text-right">
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
                      </div>
                      <ChevronRight size={18} style={{ color: "var(--fg-subtle)" }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
