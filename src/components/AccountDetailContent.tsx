"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AddValueModal } from "@/components/AddValueModal";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { AccountForm } from "@/components/AccountForm";
import { HistoryEntrySheet } from "@/components/HistoryEntrySheet";
import { TransactionModal } from "@/components/TransactionModal";
import { categoryLabel } from "@/lib/categories";
import {
  buildAccountHistoryPoints,
  filterHistoryByRange,
  getAccountEntries,
  relativeUpdateLabel,
  type ValueHistoryPoint,
} from "@/lib/account-history";
import { formatMoney, formatPercent } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { AccountValueEntry, Transaction } from "@/lib/types";

const RANGES = ["ALL", "6M", "YTD", "1Y", "2Y", "5Y", "8Y"] as const;

/** Resolve the ledger transaction for a Value History row (strict link only). */
function resolveLedgerTransaction(
  transactions: Transaction[],
  accountId: string,
  point: ValueHistoryPoint,
): Transaction | undefined {
  if (point.transactionId) {
    return transactions.find((t) => t.id === point.transactionId);
  }
  // Legacy rows: exact note match only — never guess from same-day leftovers.
  if (!point.note) return undefined;
  const onDay = transactions.filter(
    (t) => t.accountId === accountId && t.date === point.date,
  );
  return onDay.find(
    (t) =>
      point.note === `Income · ${t.title}` ||
      point.note === `Expense · ${t.title}` ||
      point.note === `Ledger: ${t.title}`,
  );
}

export function AccountDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get("id") ?? "";

  const accounts = useWorthStore((s) => s.accounts);
  const valueEntries = useWorthStore((s) => s.valueEntries);
  const transactions = useWorthStore((s) => s.transactions);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const deleteAccount = useWorthStore((s) => s.deleteAccount);
  const deleteValueEntry = useWorthStore((s) => s.deleteValueEntry);
  const deleteTransaction = useWorthStore((s) => s.deleteTransaction);

  const account = accounts.find((a) => a.id === accountId) ?? null;
  const [range, setRange] = useState<(typeof RANGES)[number]>("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountValueEntry | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ValueHistoryPoint | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "account" }
    | { kind: "ledger"; tx: Transaction }
    | { kind: "value"; entryId: string; date: string }
    | null
  >(null);

  const history = useMemo(
    () =>
      account
        ? buildAccountHistoryPoints(valueEntries, account.id, account.isLiability)
        : [],
    [account, valueEntries],
  );

  const chartPoints = useMemo(() => {
    const filtered = filterHistoryByRange(history, range).slice().reverse();
    return filtered
      .filter((p) => p.markOnGraph)
      .map((p) => ({
        ...p,
        chartValue: p.signedValue,
      }));
  }, [history, range, account]);

  const entries = account ? getAccountEntries(valueEntries, account.id) : [];

  if (!account) {
    return (
      <div className="space-y-4 pb-4">
        <Link href="/accounts/" className="btn-ghost inline-flex">
          <ArrowLeft size={18} />
          Back
        </Link>
        <div
          className="rounded-2xl px-4 py-10 text-center text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          Account not found.
        </div>
      </div>
    );
  }

  const signed = history[0]?.signedValue ?? (account.isLiability
    ? -Math.abs(account.currentValue)
    : account.currentValue);
  const latestChange = history[0];
  const changePositive = (latestChange?.changeAbsolute ?? 0) >= 0;
  const changeGood = changePositive;

  const startedOn = [...history].sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
  const ath = history.reduce<(typeof history)[number] | null>((best, point) => {
    if (!best) return point;
    return point.signedValue > best.signedValue ? point : best;
  }, null);

  return (
    <div className="space-y-4 pb-28">
      <header className="relative z-30 flex items-center justify-between animate-fade-up">
        <Link href="/accounts/" className="btn-ghost" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <div className="relative">
          <button
            type="button"
            className="btn-ghost"
            aria-label="More"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-xl border shadow-lg"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-muted)]"
                onClick={() => {
                  setMenuOpen(false);
                  setEditOpen(true);
                }}
              >
                <Pencil size={16} />
                Edit account
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-muted)]"
                style={{ color: "var(--danger)" }}
                onClick={() => {
                  setMenuOpen(false);
                  setPendingDelete({ kind: "account" });
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="animate-fade-up">
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          {account.name}
        </p>
        <div className="mt-1 flex flex-wrap items-end gap-3">
          <h1 className="font-display text-3xl tabular-nums tracking-tight">
            {formatMoney(signed, account.currency, currencies, {
              privacy: settings.isPrivacyMode,
              showSign: signed < 0,
            })}
          </h1>
          {latestChange?.changePercent != null && (
            <div
              className="mb-1 inline-flex items-center gap-1 text-sm font-semibold"
              style={{ color: changeGood ? "var(--positive)" : "var(--negative)" }}
            >
              {changeGood ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {settings.isPrivacyMode
                ? "••••"
                : `${formatPercent(Math.abs(latestChange.changePercent)).replace("+", "")} ${
                    changeGood ? "↑" : "↓"
                  } ${formatMoney(
                    Math.abs(latestChange.changeAbsolute ?? 0),
                    account.currency,
                    currencies,
                    { compact: true },
                  )}`}
            </div>
          )}
        </div>
      </section>

      <section className="relative z-0 card-surface animate-fade-up-delay p-3">
        {chartPoints.length < 2 ? (
          <div
            className="flex h-40 items-center justify-center rounded-xl text-sm"
            style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
          >
            Add dated values to see the trend.
          </div>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="acctFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--fg-subtle)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                  tickFormatter={(v) => {
                    const d = new Date(`${v}T00:00:00`);
                    return d.toLocaleDateString(undefined, {
                      month: "short",
                      year: "2-digit",
                    });
                  }}
                />
                <YAxis
                  tick={{ fill: "var(--fg-subtle)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(v) =>
                    Math.abs(v) >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : Math.abs(v) >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                  formatter={(value) => [
                    settings.isPrivacyMode
                      ? "••••••"
                      : formatMoney(Number(value), account.currency, currencies),
                    "Value",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="chartValue"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#acctFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={`chip ${range === r ? "chip-active" : ""}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up-delay">
        <MetaChip label="Type" value={categoryLabel(account.category)} />
        <MetaChip label="Last update" value={relativeUpdateLabel(account.asOfDate)} />
        {startedOn && <MetaChip label="Started on" value={startedOn} />}
        {ath && (
          <MetaChip
            label={account.isLiability ? "ATL" : "ATH"}
            value={`${ath.date.slice(5)} · ${formatMoney(
              ath.signedValue,
              account.currency,
              currencies,
              { privacy: settings.isPrivacyMode, compact: true, showSign: ath.signedValue < 0 },
            )}`}
          />
        )}
      </div>

      <section className="animate-fade-up-delay-2">
        <h2 className="mb-1 font-display text-xl">Value History</h2>
        <p className="mb-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
          Tap a row to see the linked ledger and edit or delete it.
        </p>
        {history.length === 0 ? (
          <div
            className="rounded-2xl px-4 py-8 text-center text-sm"
            style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
          >
            No value entries yet. Tap Update value or Add ledger.
          </div>
        ) : (
          <ul className="card-surface divide-y overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {history.map((point) => {
              const pointSigned = point.signedValue;
              const good = (point.changeAbsolute ?? 0) >= 0;
              const linkedTx = resolveLedgerTransaction(
                transactions,
                account.id,
                point,
              );
              const isLedger = Boolean(linkedTx || point.transactionId);

              return (
                <li key={point.entryId}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-[var(--bg-muted)]"
                    onClick={() => setSelectedPoint(point)}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{point.label}</p>
                      {isLedger ? (
                        <p
                          className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide"
                          style={{ color: "var(--accent)" }}
                        >
                          <Link2 size={11} />
                          Linked ledger
                          {linkedTx ? ` · ${linkedTx.title}` : ""}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                          {point.note || "Manual value update"}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <div className="text-right">
                        <p
                          className="font-semibold tabular-nums"
                          style={{
                            color: pointSigned < 0 ? "var(--negative)" : "var(--fg)",
                          }}
                        >
                          {formatMoney(pointSigned, account.currency, currencies, {
                            privacy: settings.isPrivacyMode,
                            showSign: pointSigned < 0,
                          })}
                        </p>
                        {point.changeAbsolute != null && (
                          <p
                            className="mt-0.5 text-xs font-semibold tabular-nums"
                            style={{
                              color: good ? "var(--positive)" : "var(--negative)",
                            }}
                          >
                            {settings.isPrivacyMode
                              ? "••••"
                              : `${good ? "↑" : "↓"} ${formatMoney(
                                  Math.abs(point.changeAbsolute),
                                  account.currency,
                                  currencies,
                                  { compact: true },
                                )}`}
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        size={18}
                        className="mt-0.5"
                        style={{ color: "var(--fg-subtle)" }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div
        className="fixed left-1/2 z-30 flex w-full max-w-lg -translate-x-1/2 gap-2 px-4 pb-2 pt-2"
        style={{
          /* Sit above the bottom nav — do not overlap it (overlap steals taps) */
          bottom: "calc(var(--nav-height) + var(--safe-bottom))",
          background: "linear-gradient(transparent, var(--bg) 28%)",
        }}
      >
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={() => {
            setEditingTx(null);
            setLedgerOpen(true);
          }}
        >
          <Receipt size={18} />
          Add ledger
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={() => setAddOpen(true)}
        >
          <Plus size={18} />
          Update value
        </button>
      </div>

      <AddValueModal
        open={addOpen || Boolean(editingEntry)}
        account={account}
        initial={editingEntry}
        onClose={() => {
          setAddOpen(false);
          setEditingEntry(null);
        }}
      />
      <TransactionModal
        open={ledgerOpen || Boolean(editingTx)}
        initial={editingTx}
        defaultAccountId={account.id}
        onClose={() => {
          setLedgerOpen(false);
          setEditingTx(null);
        }}
      />
      {selectedPoint && (
        <HistoryEntrySheet
          open
          account={account}
          point={selectedPoint}
          linkedTx={
            resolveLedgerTransaction(transactions, account.id, selectedPoint) ??
            null
          }
          currencies={currencies}
          settings={settings}
          canDelete={history.length > 1}
          onClose={() => setSelectedPoint(null)}
          onEditLedger={(tx) => {
            setSelectedPoint(null);
            setEditingTx(tx);
          }}
          onDeleteLedger={(tx) => {
            setPendingDelete({ kind: "ledger", tx });
          }}
          onEditValue={() => {
            const entry = entries.find((e) => e.id === selectedPoint.entryId);
            setSelectedPoint(null);
            if (entry) setEditingEntry(entry);
          }}
          onDeleteValue={() => {
            const entry = entries.find((e) => e.id === selectedPoint.entryId);
            if (entry) {
              setPendingDelete({
                kind: "value",
                entryId: entry.id,
                date: selectedPoint.date,
              });
            }
          }}
        />
      )}
      <AccountForm open={editOpen} initial={account} onClose={() => setEditOpen(false)} />
      <ConfirmSheet
        open={pendingDelete !== null}
        title={
          pendingDelete?.kind === "account"
            ? `Delete “${account.name}”?`
            : pendingDelete?.kind === "ledger"
              ? `Delete ledger “${pendingDelete.tx.title}”?`
              : pendingDelete
                ? `Delete entry on ${pendingDelete.date}?`
                : ""
        }
        message={
          pendingDelete?.kind === "account"
            ? "This removes the account and its value history from this device."
            : pendingDelete?.kind === "ledger"
              ? "Linked account balances will reverse this ledger effect."
              : "This value history row will be removed."
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.kind === "account") {
            deleteAccount(account.id);
            router.replace("/accounts/");
          } else if (pendingDelete.kind === "ledger") {
            deleteTransaction(pendingDelete.tx.id);
            setSelectedPoint(null);
          } else {
            deleteValueEntry(pendingDelete.entryId);
            setSelectedPoint(null);
          }
          setPendingDelete(null);
        }}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="min-w-[7.5rem] shrink-0 rounded-2xl px-3 py-2"
      style={{ background: "var(--bg-muted)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
