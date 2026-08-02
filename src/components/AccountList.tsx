"use client";

import { Pencil, Trash2 } from "lucide-react";
import { categoryColor, categoryLabel } from "@/lib/categories";
import { toBaseCurrency } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { Account } from "@/lib/types";

interface AccountListProps {
  onEdit: (account: Account) => void;
  filter?: "all" | "assets" | "liabilities";
}

export function AccountList({ onEdit, filter = "all" }: AccountListProps) {
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const deleteAccount = useWorthStore((s) => s.deleteAccount);

  const filtered = accounts
    .filter((a) => {
      if (filter === "assets") return !a.isLiability;
      if (filter === "liabilities") return a.isLiability;
      return true;
    })
    .sort((a, b) => {
      const av = toBaseCurrency(a.currentValue, a.currency, currencies);
      const bv = toBaseCurrency(b.currentValue, b.currency, currencies);
      return bv - av;
    });

  if (filtered.length === 0) {
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
    <ul className="space-y-2">
      {filtered.map((account) => {
        const base = toBaseCurrency(account.currentValue, account.currency, currencies);
        return (
          <li key={account.id} className="card-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: categoryColor(account.category) }}
                  />
                  <h3 className="truncate font-semibold">{account.name}</h3>
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--fg-subtle)" }}>
                  {categoryLabel(account.category)}
                  {account.institutionName ? ` · ${account.institutionName}` : ""}
                  {account.currency !== settings.baseCurrency ? ` · ${account.currency}` : ""}
                  {account.asOfDate ? ` · ${account.asOfDate}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-semibold tabular-nums"
                  style={{
                    color: account.isLiability ? "var(--negative)" : "var(--fg)",
                  }}
                >
                  {formatMoney(account.currentValue, account.currency, currencies, {
                    privacy: settings.isPrivacyMode,
                  })}
                </p>
                {account.currency !== settings.baseCurrency && (
                  <p className="mt-0.5 text-xs tabular-nums" style={{ color: "var(--fg-subtle)" }}>
                    ≈{" "}
                    {formatMoney(base, settings.baseCurrency, currencies, {
                      privacy: settings.isPrivacyMode,
                      compact: true,
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-end gap-1">
              <button type="button" className="btn-ghost" onClick={() => onEdit(account)}>
                <Pencil size={16} />
                Edit
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ color: "var(--danger)" }}
                onClick={() => {
                  if (confirm(`Delete “${account.name}”?`)) deleteAccount(account.id);
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
