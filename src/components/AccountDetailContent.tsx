"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
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
import { AccountForm } from "@/components/AccountForm";
import { categoryLabel } from "@/lib/categories";
import {
  buildAccountHistoryPoints,
  filterHistoryByRange,
  getAccountEntries,
  relativeUpdateLabel,
} from "@/lib/account-history";
import { formatMoney, formatPercent } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { AccountValueEntry } from "@/lib/types";

const RANGES = ["ALL", "6M", "YTD", "1Y", "2Y", "4Y", "8Y"] as const;

export function AccountDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const accountId = searchParams.get("id") ?? "";

  const accounts = useWorthStore((s) => s.accounts);
  const valueEntries = useWorthStore((s) => s.valueEntries);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const deleteAccount = useWorthStore((s) => s.deleteAccount);
  const deleteValueEntry = useWorthStore((s) => s.deleteValueEntry);

  const account = accounts.find((a) => a.id === accountId) ?? null;
  const [range, setRange] = useState<(typeof RANGES)[number]>("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountValueEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const history = useMemo(
    () => (account ? buildAccountHistoryPoints(valueEntries, account.id) : []),
    [account, valueEntries],
  );

  const chartPoints = useMemo(() => {
    const filtered = filterHistoryByRange(history, range).slice().reverse();
    return filtered
      .filter((p) => p.markOnGraph)
      .map((p) => ({
        ...p,
        chartValue: account?.isLiability ? -Math.abs(p.value) : p.value,
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

  const signed = account.isLiability
    ? -Math.abs(account.currentValue)
    : account.currentValue;
  const latestChange = history[0];
  const changePositive = (latestChange?.changeAbsolute ?? 0) >= 0;
  // For liabilities, a decrease in absolute debt is "good" / green in the reference
  const changeGood = account.isLiability
    ? (latestChange?.changeAbsolute ?? 0) <= 0
    : changePositive;

  const startedOn = [...history].sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
  const ath = history.reduce<(typeof history)[number] | null>((best, point) => {
    if (!best) return point;
    if (account.isLiability) {
      return point.value < best.value ? point : best;
    }
    return point.value > best.value ? point : best;
  }, null);

  return (
    <div className="space-y-4 pb-24">
      <header className="flex items-center justify-between animate-fade-up">
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
              className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border shadow-lg"
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
                  if (confirm(`Delete “${account.name}”?`)) {
                    deleteAccount(account.id);
                    router.replace("/accounts/");
                  }
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
              showSign: account.isLiability,
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

      <section className="card-surface animate-fade-up-delay p-3">
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
              account.isLiability ? -Math.abs(ath.value) : ath.value,
              account.currency,
              currencies,
              { privacy: settings.isPrivacyMode, compact: true, showSign: account.isLiability },
            )}`}
          />
        )}
      </div>

      <section className="animate-fade-up-delay-2">
        <h2 className="mb-2 font-display text-xl">Value History</h2>
        {history.length === 0 ? (
          <div
            className="rounded-2xl px-4 py-8 text-center text-sm"
            style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
          >
            No value entries yet. Tap Update to add one.
          </div>
        ) : (
          <ul className="card-surface divide-y overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {history.map((point) => {
              const pointSigned = account.isLiability
                ? -Math.abs(point.value)
                : point.value;
              const good = account.isLiability
                ? (point.changeAbsolute ?? 0) <= 0
                : (point.changeAbsolute ?? 0) >= 0;
              const entry = entries.find((e) => e.date === point.date);
              return (
                <li key={`${point.date}-${point.value}`} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{point.label}</p>
                      {point.note && (
                        <p className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                          {point.note}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className="font-semibold tabular-nums"
                        style={{
                          color: account.isLiability ? "var(--negative)" : "var(--fg)",
                        }}
                      >
                        {formatMoney(pointSigned, account.currency, currencies, {
                          privacy: settings.isPrivacyMode,
                          showSign: account.isLiability,
                        })}
                      </p>
                      {point.changeAbsolute != null && point.changePercent != null && (
                        <p
                          className="mt-0.5 text-xs font-semibold tabular-nums"
                          style={{
                            color: good ? "var(--positive)" : "var(--negative)",
                          }}
                        >
                          {settings.isPrivacyMode
                            ? "••••"
                            : `${formatPercent(Math.abs(point.changePercent)).replace("+", "")} ${
                                good ? "↑" : "↓"
                              } ${formatMoney(Math.abs(point.changeAbsolute), account.currency, currencies, {
                                compact: true,
                              })}`}
                        </p>
                      )}
                      {entry && (
                        <div className="mt-1.5 flex justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs font-semibold"
                            style={{ color: "var(--accent)" }}
                            onClick={() => setEditingEntry(entry)}
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                          {history.length > 1 && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-semibold"
                              style={{ color: "var(--danger)" }}
                              onClick={() => {
                                if (confirm(`Delete entry on ${point.date}?`)) {
                                  deleteValueEntry(entry.id);
                                }
                              }}
                            >
                              <Trash2 size={12} />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div
        className="fixed bottom-0 left-1/2 z-30 w-full max-w-lg -translate-x-1/2 px-4 pt-2"
        style={{
          paddingBottom: "calc(var(--nav-height) + var(--safe-bottom) + 8px)",
          background: "linear-gradient(transparent, var(--bg) 30%)",
        }}
      >
        <button type="button" className="btn-primary w-full" onClick={() => setAddOpen(true)}>
          Update
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
      <AccountForm open={editOpen} initial={account} onClose={() => setEditOpen(false)} />
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
