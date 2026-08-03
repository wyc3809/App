"use client";

import { useMemo, useState } from "react";
import { Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { TransactionModal } from "@/components/TransactionModal";
import { toBaseCurrency } from "@/lib/currencies";
import { formatMoney } from "@/lib/format";
import {
  computeLedgerTotals,
  groupTransactionsByDate,
  ledgerCategoryLabel,
} from "@/lib/ledger";
import { useWorthStore } from "@/lib/store";
import type { Transaction, TransactionType } from "@/lib/types";

type Filter = "all" | TransactionType;

export default function LedgerPage() {
  const transactions = useWorthStore((s) => s.transactions);
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const deleteTransaction = useWorthStore((s) => s.deleteTransaction);

  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const totals = useMemo(
    () =>
      computeLedgerTotals(filtered, (amount, currency) =>
        toBaseCurrency(amount, currency, currencies),
      ),
    [filtered, currencies],
  );

  const groups = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const accountName = (id?: string) =>
    id ? accounts.find((a) => a.id === id)?.name : undefined;

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-4">
      <header className="animate-fade-up">
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--fg-subtle)" }}
        >
          Bookkeeping
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="font-display text-3xl">Ledger</h1>
          <button type="button" className="btn-primary" onClick={openNew}>
            <Plus size={18} />
            Add
          </button>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          Income & expense — optionally link to an account to update its balance.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-2 animate-fade-up">
        <SummaryTile
          label="Income"
          value={formatMoney(totals.income, settings.baseCurrency, currencies, {
            privacy: settings.isPrivacyMode,
            compact: true,
          })}
          tone="positive"
        />
        <SummaryTile
          label="Expense"
          value={formatMoney(totals.expense, settings.baseCurrency, currencies, {
            privacy: settings.isPrivacyMode,
            compact: true,
          })}
          tone="negative"
        />
        <SummaryTile
          label="Net"
          value={formatMoney(totals.net, settings.baseCurrency, currencies, {
            privacy: settings.isPrivacyMode,
            compact: true,
            showSign: true,
          })}
          tone={totals.net >= 0 ? "positive" : "negative"}
        />
      </section>

      <div className="flex gap-2 animate-fade-up-delay">
        {([
          ["all", "All"],
          ["income", "Income"],
          ["expense", "Expense"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="rounded-xl px-3 py-2 text-xs font-semibold"
            style={{
              background:
                filter === value ? "var(--accent-soft)" : "var(--bg-muted)",
              color: filter === value ? "var(--accent)" : "var(--fg-muted)",
            }}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div
          className="rounded-2xl px-4 py-10 text-center text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          No ledger entries yet. Add income or expense to start tracking.
        </div>
      ) : (
        <div className="space-y-4 animate-fade-up-delay">
          {groups.map(({ date, items }) => (
            <section key={date}>
              <h2
                className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--fg-subtle)" }}
              >
                {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </h2>
              <ul className="space-y-2">
                {items.map((tx) => {
                  const linked = accountName(tx.accountId);
                  const signed =
                    tx.type === "income" ? tx.amount : -tx.amount;
                  return (
                    <li key={tx.id} className="card-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{tx.title}</p>
                          <p
                            className="mt-0.5 text-xs"
                            style={{ color: "var(--fg-subtle)" }}
                          >
                            {ledgerCategoryLabel(tx.category)}
                            {linked ? (
                              <>
                                {" · "}
                                <span className="inline-flex items-center gap-0.5">
                                  <Link2 size={11} />
                                  {linked}
                                </span>
                              </>
                            ) : null}
                          </p>
                          {tx.note && (
                            <p
                              className="mt-1 text-xs"
                              style={{ color: "var(--fg-muted)" }}
                            >
                              {tx.note}
                            </p>
                          )}
                        </div>
                        <p
                          className="shrink-0 font-semibold tabular-nums"
                          style={{
                            color:
                              tx.type === "income"
                                ? "var(--positive)"
                                : "var(--negative)",
                          }}
                        >
                          {settings.isPrivacyMode
                            ? "••••"
                            : formatMoney(signed, tx.currency, currencies, {
                                showSign: true,
                                compact: true,
                              })}
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end gap-1">
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => openEdit(tx)}
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ color: "var(--danger)" }}
                          onClick={() => {
                            if (confirm(`Delete “${tx.title}”?`)) {
                              deleteTransaction(tx.id);
                            }
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
            </section>
          ))}
        </div>
      )}

      <TransactionModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative";
}) {
  return (
    <div className="card-surface px-3 py-3">
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--fg-subtle)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-sm font-semibold tabular-nums"
        style={{
          color: tone === "positive" ? "var(--positive)" : "var(--negative)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
