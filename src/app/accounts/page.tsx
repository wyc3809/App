"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { AccountForm } from "@/components/AccountForm";
import { AccountList } from "@/components/AccountList";
import { computeTotals } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { Account } from "@/lib/types";

function AccountsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);

  const [filter, setFilter] = useState<"all" | "assets" | "liabilities">("all");
  const [manualOpen, setManualOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const openFromQuery = searchParams.get("new") === "1";
  const formOpen = manualOpen || openFromQuery;

  const closeForm = () => {
    setManualOpen(false);
    setEditing(null);
    if (openFromQuery) router.replace("/accounts");
  };

  const totals = computeTotals(accounts, currencies);
  const assetCount = accounts.filter((a) => !a.isLiability).length;
  const liabilityCount = accounts.filter((a) => a.isLiability).length;

  return (
    <div className="space-y-4 pb-4">
      <header className="animate-fade-up">
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--fg-subtle)" }}
        >
          Portfolio
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="font-display text-3xl">Accounts</h1>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setManualOpen(true);
            }}
          >
            <Plus size={18} />
            Add
          </button>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          {assetCount} assets · {liabilityCount} liabilities · Net{" "}
          {formatMoney(totals.netWorth, settings.baseCurrency, currencies, {
            privacy: settings.isPrivacyMode,
            compact: true,
          })}
        </p>
      </header>

      <div className="flex gap-1 animate-fade-up">
        {(
          [
            ["all", "All"],
            ["assets", "Assets"],
            ["liabilities", "Liabilities"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip ${filter === key ? "chip-active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="animate-fade-up-delay">
        <AccountList
          filter={filter}
          onEdit={(account) => {
            setEditing(account);
            setManualOpen(true);
          }}
        />
      </div>

      <AccountForm open={formOpen} initial={editing} onClose={closeForm} />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm" style={{ color: "var(--fg-muted)" }}>
          Loading accounts…
        </div>
      }
    >
      <AccountsContent />
    </Suspense>
  );
}
