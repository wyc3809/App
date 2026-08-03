"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  Filter,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Sparkles,
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
import { FilterSheet, DEFAULT_HOME_FILTER, type HomeFilterState } from "@/components/FilterSheet";
import { Sparkline } from "@/components/Sparkline";
import { buildAccountHistoryPoints, relativeUpdateLabel } from "@/lib/account-history";
import { computeTotals, filterSnapshotsByRange } from "@/lib/calculations";
import { toBaseCurrency } from "@/lib/currencies";
import { formatMoney, formatPercent } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { TimeRange } from "@/lib/types";

const RANGES = ["ALL", "6M", "YTD", "1Y", "2Y", "4Y", "8Y"] as const;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export function HomeDashboard() {
  const accounts = useWorthStore((s) => s.accounts);
  const valueEntries = useWorthStore((s) => s.valueEntries);
  const snapshots = useWorthStore((s) => s.snapshots);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const loadDemoData = useWorthStore((s) => s.loadDemoData);

  const [range, setRange] = useState<(typeof RANGES)[number]>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<HomeFilterState>(DEFAULT_HOME_FILTER);
  const [menuOpen, setMenuOpen] = useState(false);

  const totals = computeTotals(accounts, currencies);
  const privacy = settings.isPrivacyMode;

  const chartData = useMemo(() => {
    const mappedRange: TimeRange | "YTD" | "2Y" | "4Y" | "8Y" =
      range === "ALL"
        ? "ALL"
        : range === "6M"
          ? "6M"
          : range === "1Y"
            ? "1Y"
            : range === "YTD"
              ? "YTD"
              : range === "2Y"
                ? "2Y"
                : range === "4Y"
                  ? "4Y"
                  : "8Y";

    // Reuse snapshot filter for standard ranges; custom for extended.
    if (mappedRange === "YTD" || mappedRange === "2Y" || mappedRange === "4Y" || mappedRange === "8Y") {
      const now = new Date();
      let cutoff = new Date(now);
      if (mappedRange === "YTD") cutoff = new Date(now.getFullYear(), 0, 1);
      else {
        const years = mappedRange === "2Y" ? 2 : mappedRange === "4Y" ? 4 : 8;
        cutoff.setFullYear(cutoff.getFullYear() - years);
      }
      const cutoffISO = cutoff.toISOString().slice(0, 10);
      const filtered = snapshots.filter((s) => s.date >= cutoffISO);
      const list = filtered.length > 0 ? filtered : snapshots.slice(-1);
      return list.map((s) => ({
        date: s.date,
        netWorth: s.netWorthBaseCurrency,
      }));
    }

    return filterSnapshotsByRange(snapshots, mappedRange).map((s) => ({
      date: s.date,
      netWorth: s.netWorthBaseCurrency,
    }));
  }, [snapshots, range]);

  const filteredAccounts = useMemo(() => {
    let list = [...accounts];
    if (filter.kind === "assets") list = list.filter((a) => !a.isLiability);
    if (filter.kind === "liabilities") list = list.filter((a) => a.isLiability);
    if (filter.categories.length > 0) {
      list = list.filter((a) => filter.categories.includes(a.category));
    }

    list.sort((a, b) => {
      if (filter.sort === "name") return a.name.localeCompare(b.name);
      if (filter.sort === "updated") return b.asOfDate.localeCompare(a.asOfDate);
      const av = toBaseCurrency(a.currentValue, a.currency, currencies);
      const bv = toBaseCurrency(b.currentValue, b.currency, currencies);
      return bv - av;
    });
    return list;
  }, [accounts, filter, currencies]);

  const activeFilterCount =
    (filter.kind !== "all" ? 1 : 0) +
    (filter.categories.length > 0 ? 1 : 0) +
    (filter.sort !== "value" ? 1 : 0);

  return (
    <div className="space-y-4 pb-4">
      <header className="relative z-30 flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            W
          </div>
          <div>
            <p className="text-sm font-semibold">{greeting()}</p>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              WorthTracker
            </p>
          </div>
        </div>
        <div className="relative z-30 flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              className="btn-ghost"
              aria-label="More"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-40 cursor-default"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border shadow-lg"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                >
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-muted)]"
                    onClick={() => {
                      setMenuOpen(false);
                      if (confirm("Replace with demo portfolio?")) loadDemoData();
                    }}
                  >
                    Load demo data
                  </button>
                  <Link
                    href="/settings/"
                    className="block w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-muted)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                </div>
              </>
            )}
          </div>
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
          <Link href="/accounts/?new=1" className="btn-ghost" aria-label="Add account">
            <Plus size={18} />
          </Link>
        </div>
      </header>

      <section className="relative z-0 animate-fade-up-delay">
        {chartData.length < 2 ? (
          <div
            className="flex h-48 items-center justify-center rounded-2xl text-sm"
            style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
          >
            {accounts.length === 0
              ? "Add accounts or load demo data to see your net worth trend."
              : "Take snapshots / update values to build the chart."}
          </div>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="homeNwFill" x1="0" y1="0" x2="0" y2="1">
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
                  minTickGap={36}
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
                    privacy
                      ? "••••••"
                      : formatMoney(Number(value), settings.baseCurrency, currencies),
                    "Net Worth",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#homeNwFill)"
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
              {r === "ALL" ? "All" : r}
            </button>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Your total net worth is
          </p>
          <p className="mt-1 font-display text-3xl tabular-nums tracking-tight">
            {formatMoney(totals.netWorth, settings.baseCurrency, currencies, {
              privacy,
              compact: Math.abs(totals.netWorth) >= 1_000_000,
            })}
          </p>
        </div>
      </section>

      {accounts.length === 0 && (
        <section
          className="rounded-2xl p-4 text-sm animate-fade-up"
          style={{ background: "var(--accent-soft)" }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={18} style={{ color: "var(--accent)" }} className="mt-0.5" />
            <div>
              <p className="font-semibold">Start with a sample portfolio</p>
              <p className="mt-1" style={{ color: "var(--fg-muted)" }}>
                Or add your first account with +.
              </p>
              <button type="button" className="btn-primary mt-3" onClick={loadDemoData}>
                Load demo data
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="animate-fade-up-delay-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} style={{ color: "var(--accent)" }} />
            <h2 className="font-semibold">Assets & Liabilities</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn-ghost"
              aria-label="Sort"
              onClick={() =>
                setFilter((f) => ({
                  ...f,
                  sort:
                    f.sort === "value" ? "name" : f.sort === "name" ? "updated" : "value",
                }))
              }
            >
              <ArrowDownUp size={16} />
            </button>
            <button
              type="button"
              className="btn-ghost relative"
              aria-label="Filter list"
              onClick={() => setFilterOpen(true)}
            >
              <Filter size={16} />
              {activeFilterCount > 0 && (
                <span
                  className="absolute right-1 top-1 h-2 w-2 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div
            className="rounded-2xl px-4 py-8 text-center text-sm"
            style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
          >
            No accounts match this filter.
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredAccounts.map((account) => {
              const history = buildAccountHistoryPoints(valueEntries, account.id);
              const latest = history[0];
              const signed = account.isLiability
                ? -Math.abs(account.currentValue)
                : account.currentValue;
              const good = account.isLiability
                ? (latest?.changeAbsolute ?? 0) <= 0
                : (latest?.changeAbsolute ?? 0) >= 0;

              return (
                <li key={account.id}>
                  <Link
                    href={`/accounts/detail/?id=${account.id}`}
                    className="card-surface flex items-center gap-3 px-3 py-3 transition hover:bg-[var(--bg-muted)]"
                  >
                    <Sparkline
                      entries={valueEntries}
                      accountId={account.id}
                      isLiability={account.isLiability}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{account.name}</p>
                      <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                        Updated {relativeUpdateLabel(account.asOfDate)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className="font-semibold tabular-nums"
                        style={{
                          color: account.isLiability ? "var(--negative)" : "var(--fg)",
                        }}
                      >
                        {formatMoney(signed, account.currency, currencies, {
                          privacy,
                          compact: true,
                          showSign: account.isLiability,
                        })}
                      </p>
                      {latest?.changeAbsolute != null && latest.changePercent != null && (
                        <p
                          className="mt-0.5 text-xs font-semibold tabular-nums"
                          style={{
                            color: good ? "var(--positive)" : "var(--negative)",
                          }}
                        >
                          {privacy
                            ? "••••"
                            : `${formatPercent(latest.changePercent)} / ${formatMoney(
                                latest.changeAbsolute,
                                account.currency,
                                currencies,
                                { showSign: true, compact: true },
                              )}`}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <FilterSheet
        open={filterOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}
