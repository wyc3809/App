"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  Filter,
  FolderOpen,
  MoreVertical,
  Plus,
  Settings2,
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
import { BackupReminder } from "@/components/BackupReminder";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { FilterSheet, DEFAULT_HOME_FILTER, type HomeFilterState } from "@/components/FilterSheet";
import { OnboardingSheet } from "@/components/OnboardingSheet";
import { Sparkline } from "@/components/Sparkline";
import { shouldRemindBackup } from "@/lib/backup-meta";
import { buildAccountHistoryPoints, relativeUpdateLabel } from "@/lib/account-history";
import { computeTotals } from "@/lib/calculations";
import { toBaseCurrency } from "@/lib/currencies";
import { formatMoney, formatPercent } from "@/lib/format";
import {
  buildNetWorthSeries,
  chartDomainForRange,
  filterNetWorthSeries,
  type ChartRange,
} from "@/lib/net-worth-series";
import { useWorthStore } from "@/lib/store";

const RANGES = ["ALL", "6M", "YTD", "1Y", "2Y", "5Y", "8Y"] as const;

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
  const completeOnboarding = useWorthStore((s) => s.completeOnboarding);

  const [range, setRange] = useState<(typeof RANGES)[number]>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<HomeFilterState>(DEFAULT_HOME_FILTER);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [backupDismissed, setBackupDismissed] = useState(false);
  const showOnboarding =
    !settings.onboardingCompleted && accounts.length === 0;
  const showBackupReminder =
    !backupDismissed &&
    !showOnboarding &&
    shouldRemindBackup(settings.lastBackupAt);

  const totals = computeTotals(accounts, currencies);
  const privacy = settings.isPrivacyMode;

  const chartData = useMemo(() => {
    const series = buildNetWorthSeries(
      accounts,
      valueEntries,
      currencies,
      snapshots,
    );
    const filtered = filterNetWorthSeries(series, range as ChartRange);
    const domain = chartDomainForRange(range as ChartRange, filtered);
    const domainMs: [number, number] | ["dataMin", "dataMax"] =
      domain[0] === "dataMin"
        ? ["dataMin", "dataMax"]
        : [
            new Date(`${domain[0]}T00:00:00`).getTime(),
            new Date(`${domain[1]}T00:00:00`).getTime(),
          ];
    return {
      points: filtered.map((p) => ({
        ...p,
        t: new Date(`${p.date}T00:00:00`).getTime(),
      })),
      domainMs,
      useTimeScale: domain[0] !== "dataMin",
    };
  }, [accounts, valueEntries, currencies, snapshots, range]);

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
            <p className="font-display text-xl leading-tight tracking-tight">WorthBook</p>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              {greeting()}
            </p>
          </div>
        </div>
        <div className="relative z-30 flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              className="btn-ghost"
              aria-label="More options"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreVertical size={18} />
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
                  className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border shadow-lg"
                  style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                >
                  <Link
                    href="/settings/"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-muted)]"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings2 size={16} style={{ color: "var(--fg-muted)" }} />
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-muted)]"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmDemo(true);
                    }}
                  >
                    <Sparkles size={16} style={{ color: "var(--fg-muted)" }} />
                    Load demo data
                  </button>
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

      {showBackupReminder ? (
        <BackupReminder
          lastBackupAt={settings.lastBackupAt}
          onDismiss={() => setBackupDismissed(true)}
        />
      ) : null}

      <section className="relative z-0 animate-fade-up text-center">
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--fg-subtle)" }}
        >
          Net worth
        </p>
        <p className="mt-1 font-display text-4xl tabular-nums tracking-tight">
          {formatMoney(totals.netWorth, settings.baseCurrency, currencies, {
            privacy,
            compact: Math.abs(totals.netWorth) >= 1_000_000,
          })}
        </p>
        <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>
          Assets{" "}
          {formatMoney(totals.totalAssets, settings.baseCurrency, currencies, {
            privacy,
            compact: true,
          })}
          {" · "}
          Liabilities{" "}
          {formatMoney(totals.totalLiabilities, settings.baseCurrency, currencies, {
            privacy,
            compact: true,
          })}
        </p>
      </section>

      <section className="relative z-0 animate-fade-up-delay">
        {chartData.points.length < 2 ? (
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
              <AreaChart
                data={chartData.points}
                margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="homeNwFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey={chartData.useTimeScale ? "t" : "date"}
                  type={chartData.useTimeScale ? "number" : "category"}
                  domain={chartData.useTimeScale ? chartData.domainMs : undefined}
                  tick={{ fill: "var(--fg-subtle)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={36}
                  tickFormatter={(v) => {
                    const d =
                      typeof v === "number"
                        ? new Date(v)
                        : new Date(`${v}T00:00:00`);
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
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as
                      | { date?: string }
                      | undefined;
                    if (!row?.date) return "";
                    return new Date(`${row.date}T00:00:00`).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short", day: "numeric" },
                    );
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

      </section>

      {accounts.length === 0 && settings.onboardingCompleted && (
        <section
          className="rounded-2xl p-4 text-sm animate-fade-up"
          style={{ background: "var(--accent-soft)" }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={18} style={{ color: "var(--accent)" }} className="mt-0.5" />
            <div>
              <p className="font-semibold">Add your first account</p>
              <p className="mt-1" style={{ color: "var(--fg-muted)" }}>
                Or load a sample portfolio to explore the app.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/accounts/?new=1" className="btn-primary">
                  Add account
                </Link>
                <button type="button" className="btn-secondary" onClick={() => setConfirmDemo(true)}>
                  Load demo
                </button>
              </div>
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

      <ConfirmSheet
        open={confirmDemo}
        title="Load demo portfolio?"
        message="Demo data replaces your current local data on this device."
        confirmLabel="Load demo"
        onConfirm={() => {
          loadDemoData();
          completeOnboarding();
        }}
        onClose={() => setConfirmDemo(false)}
      />

      <OnboardingSheet
        open={showOnboarding}
        onLoadDemo={() => {
          loadDemoData();
          completeOnboarding();
        }}
        onDismiss={() => completeOnboarding()}
      />

      <FilterSheet
        open={filterOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}
