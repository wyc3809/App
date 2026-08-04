"use client";

import { useMemo, useState } from "react";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { LedgerQuickEntry } from "@/components/LedgerQuickEntry";
import { TransactionModal } from "@/components/TransactionModal";
import { toBaseCurrency } from "@/lib/currencies";
import { formatMoney, todayISO } from "@/lib/format";
import {
  computeLedgerTotals,
  filterTransactionsByPeriod,
  groupTransactionsByDate,
  ledgerCategoryLabel,
  ledgerPeriodShortLabel,
  ledgerPeriodStart,
  type LedgerSummaryPeriod,
} from "@/lib/ledger";
import { useWorthStore } from "@/lib/store";
import type { Transaction, TransactionType } from "@/lib/types";

type Filter = "all" | TransactionType;

const PERIODS: { value: LedgerSummaryPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "ytd", label: "YTD" },
];

export default function LedgerPage() {
  const transactions = useWorthStore((s) => s.transactions);
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const deleteTransaction = useWorthStore((s) => s.deleteTransaction);

  /** Default: from the 1st of the current month through today. */
  const [period, setPeriod] = useState<LedgerSummaryPeriod>("month");
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const today = todayISO();

  const inPeriod = useMemo(
    () => filterTransactionsByPeriod(transactions, period, today),
    [transactions, period, today],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return inPeriod;
    return inPeriod.filter((t) => t.type === filter);
  }, [inPeriod, filter]);

  const totals = useMemo(
    () =>
      computeLedgerTotals(inPeriod, (amount, currency) =>
        toBaseCurrency(amount, currency, currencies),
      ),
    [inPeriod, currencies],
  );

  const groups = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const periodHint = useMemo(() => {
    const start = ledgerPeriodStart(period, today);
    if (period === "day") return "Today";
    if (period === "month") {
      const month = new Date(`${start}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
      return `From 1 ${month}`;
    }
    return `YTD · since ${start.slice(0, 4)}-01-01`;
  }, [period, today]);

  const accountName = (id?: string) =>
    id ? accounts.find((a) => a.id === id)?.name : undefined;

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setModalOpen(true);
  };

  return (
    <div className="space-y-3 pb-4">
      <header className="flex items-baseline justify-between gap-2 animate-fade-up">
        <h1 className="font-display text-2xl leading-none">Ledger</h1>
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--fg-subtle)" }}
        >
          Bookkeeping
        </p>
      </header>

      <LedgerQuickEntry />

      <section className="space-y-2 animate-fade-up" aria-label="Cashflow summary">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--fg-subtle)" }}
          >
            {periodHint}
          </p>
          <div
            className="flex gap-1 rounded-xl p-0.5"
            style={{ background: "var(--bg-muted)" }}
            role="tablist"
            aria-label="Summary period"
          >
            {PERIODS.map(({ value, label }) => {
              const active = period === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className="min-h-9 rounded-lg px-2.5 text-[11px] font-semibold transition"
                  style={{
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#04140c" : "var(--fg-muted)",
                  }}
                  onClick={() => setPeriod(value)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
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
        </div>
      </section>

      <div className="flex items-center justify-between gap-2 animate-fade-up-delay">
        <h2
          className="text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--fg-subtle)" }}
        >
          Records · {ledgerPeriodShortLabel(period)}
        </h2>
        <div className="flex gap-1.5">
          {([
            ["all", "All"],
            ["income", "Income"],
            ["expense", "Expense"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="rounded-xl px-2.5 py-1.5 text-[11px] font-semibold"
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
      </div>

      {groups.length === 0 ? (
        <div
          className="rounded-2xl px-4 py-8 text-center"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          <p className="text-sm">
            No records in this period. Use the keypad above or switch Day / Month /
            YTD.
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-up-delay">
          {groups.map(({ date, items }) => (
            <section key={date}>
              <h3
                className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--fg-subtle)" }}
              >
                {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
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
