"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Plus } from "lucide-react";
import { AccountForm } from "@/components/AccountForm";
import { AccountList } from "@/components/AccountList";
import {
  DEFAULT_HOME_FILTER,
  FilterSheet,
  type HomeFilterState,
} from "@/components/FilterSheet";
import { computeTotals } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";

function AccountsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);

  const [manualOpen, setManualOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<HomeFilterState>(DEFAULT_HOME_FILTER);
  /** Local dismiss so Cancel works even if router.replace is slow on static hosts. */
  const [queryNewDismissed, setQueryNewDismissed] = useState(false);

  const openFromQuery = searchParams.get("new") === "1" && !queryNewDismissed;
  const formOpen = manualOpen || openFromQuery;

  const closeForm = () => {
    setManualOpen(false);
    if (searchParams.get("new") === "1") {
      setQueryNewDismissed(true);
      router.replace("/accounts/");
    }
  };

  const totals = computeTotals(accounts, currencies);
  const assetCount = accounts.filter((a) => !a.isLiability).length;
  const liabilityCount = accounts.filter((a) => a.isLiability).length;
  const activeFilterCount =
    (filter.kind !== "all" ? 1 : 0) + (filter.categories.length > 0 ? 1 : 0);

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
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn-ghost relative"
              aria-label="Filter"
              onClick={() => setFilterOpen(true)}
            >
              <Filter size={18} />
              {activeFilterCount > 0 && (
                <span
                  className="absolute right-1 top-1 h-2 w-2 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setManualOpen(true)}
            >
              <Plus size={18} />
              Add
            </button>
          </div>
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
            className={`chip ${filter.kind === key ? "chip-active" : ""}`}
            onClick={() => setFilter((f) => ({ ...f, kind: key, categories: [] }))}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="animate-fade-up-delay">
        <AccountList filter={filter.kind} categories={filter.categories} />
      </div>

      <AccountForm open={formOpen} onClose={closeForm} />
      <FilterSheet
        open={filterOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
      />
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
