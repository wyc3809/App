"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronDown,
  ChevronRight,
  Filter,
  FolderOpen,
  Landmark,
  MoreVertical,
  Plus,
  Settings2,
  Sparkles,
  WalletCards,
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
import { BrandMark } from "@/components/BrandMark";
import { ChartErrorBoundary } from "@/components/ChartErrorBoundary";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { FilterSheet, DEFAULT_HOME_FILTER, type HomeFilterState } from "@/components/FilterSheet";
import { Sparkline } from "@/components/Sparkline";
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
import type { Account } from "@/lib/types";
import { CHART_ANIMATION, CHART_FOCUS,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_CURSOR} from "@/lib/chart-config";
import { useI18n } from "@/lib/i18n/context";
import { hapticTap } from "@/lib/haptic";

const RANGES = ["ALL", "6M", "YTD", "1Y", "2Y", "5Y", "8Y"] as const;

type AccountGroup = "assets" | "liabilities";

function greeting(t: (key: import("@/lib/i18n").TranslationKey) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("home.greetingMorning");
  if (hour < 18) return t("home.greetingAfternoon");
  return t("home.greetingEvening");
}

function AccountHomeRow({
  account,
  valueEntries,
  currencies,
  privacy,
}: {
  account: Account;
  valueEntries: ReturnType<typeof useWorthStore.getState>["valueEntries"];
  currencies: ReturnType<typeof useWorthStore.getState>["currencies"];
  privacy: boolean;
}) {
  const history = buildAccountHistoryPoints(
    valueEntries,
    account.id,
    account.isLiability,
  );
  const latest = history[0];
  const signed = account.isLiability
    ? -Math.abs(account.currentValue)
    : account.currentValue;
  const good = (latest?.changeAbsolute ?? 0) >= 0;

  return (
    <li>
      <Link
        href={`/accounts/detail/?id=${account.id}`}
        className="list-row transition hover:opacity-95"
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
          {latest?.changeAbsolute != null && latest.changePercent != null ? (
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
          ) : null}
        </div>
        <ChevronRight size={18} style={{ color: "var(--fg-subtle)" }} className="shrink-0" />
      </Link>
    </li>
  );
}

export function HomeDashboard() {
  const { t } = useI18n();
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
  const [expandedGroup, setExpandedGroup] = useState<AccountGroup | null>(null);
  const showOnboarding =
    !settings.onboardingCompleted && accounts.length === 0;

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

  const assetAccounts = useMemo(
    () => filteredAccounts.filter((a) => !a.isLiability),
    [filteredAccounts],
  );
  const liabilityAccounts = useMemo(
    () => filteredAccounts.filter((a) => a.isLiability),
    [filteredAccounts],
  );

  const assetGroupTotal = useMemo(
    () =>
      assetAccounts.reduce(
        (sum, a) => sum + toBaseCurrency(a.currentValue, a.currency, currencies),
        0,
      ),
    [assetAccounts, currencies],
  );
  const liabilityGroupTotal = useMemo(
    () =>
      liabilityAccounts.reduce(
        (sum, a) => sum + toBaseCurrency(a.currentValue, a.currency, currencies),
        0,
      ),
    [liabilityAccounts, currencies],
  );

  const toggleAccountGroup = (group: AccountGroup) => {
    hapticTap();
    setExpandedGroup((current) => (current === group ? null : group));
  };

  const activeFilterCount =
    (filter.kind !== "all" ? 1 : 0) +
    (filter.categories.length > 0 ? 1 : 0) +
    (filter.sort !== "value" ? 1 : 0);

  return (
    <div className="space-y-4 pb-4">
      <header className="relative z-30 flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">
            <BrandMark className="h-11 w-11" />
          </div>
          <div>
            <p className="font-display text-xl leading-tight tracking-tight">WorthBook</p>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              {greeting(t)}
            </p>
          </div>
        </div>
        <div className="relative z-30 flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              className="btn-ghost"
              aria-label={t("home.moreOptions")}
              aria-expanded={menuOpen}
              onClick={() => {
                hapticTap();
                setMenuOpen((v) => !v);
              }}
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
                    {t("home.settings")}
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
                    {t("home.loadDemo")}
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            className="btn-ghost relative"
            aria-label={t("home.filter")}
            onClick={() => {
              hapticTap();
              setFilterOpen(true);
            }}
          >
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span
                className="absolute right-1 top-1 h-2 w-2 rounded-full"
                style={{ background: "var(--accent)" }}
              />
            )}
          </button>
          <Link href="/accounts/?new=1" className="btn-ghost" aria-label={t("home.addAccount")} onClick={() => hapticTap()}>
            <Plus size={18} />
          </Link>
        </div>
      </header>

      <section className="hero-card relative z-0 animate-fade-up px-4 py-3.5 text-center">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.14em]"
          style={{ color: "var(--hero-muted)" }}
        >
          {t("home.netWorthProfile")}
        </p>
        <p
          className="mt-1.5 text-2xl font-bold leading-none tracking-tight tabular-nums sm:text-[1.75rem]"
          style={{ color: "var(--hero-fg)" }}
        >
          {formatMoney(totals.netWorth, settings.baseCurrency, currencies, {
            privacy,
            compact: Math.abs(totals.netWorth) >= 1_000_000,
          })}
        </p>
        <p className="mt-2 text-xs" style={{ color: "var(--hero-muted)" }}>
          {t("home.assets")}{" "}
          {formatMoney(totals.totalAssets, settings.baseCurrency, currencies, {
            privacy,
            compact: true,
          })}
          {" · "}
          {t("home.liabilities")}{" "}
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
              ? t("home.chartEmptyNoAccounts")
              : t("home.chartEmptyNeedData")}
          </div>
        ) : (
          <ChartErrorBoundary>
          <div
            className="chart-panel h-52 w-full"
            role="img"
            aria-label={t("home.netWorthProfile")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData.points}
                margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                {...CHART_FOCUS}
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
                  contentStyle={CHART_TOOLTIP_STYLE}
                      itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                      labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                      cursor={CHART_CURSOR}
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
                  strokeWidth={3}
                  fill="url(#homeNwFill)"
                  {...CHART_ANIMATION}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          </ChartErrorBoundary>
        )}

        <div className="chip-scroll mt-2">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={`chip ${range === r ? "chip-active" : ""}`}
              onClick={() => {
                hapticTap();
                setRange(r);
              }}
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
              <p className="font-semibold">{t("home.addFirstAccount")}</p>
              <p className="mt-1" style={{ color: "var(--fg-muted)" }}>
                Or load a sample portfolio to explore the app.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/accounts/?new=1" className="btn-primary" onClick={() => hapticTap()}>
                  {t("home.addAccount")}
                </Link>
                <button type="button" className="btn-secondary" onClick={() => { hapticTap(); setConfirmDemo(true); }}>
                  {t("home.loadDemo")}
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
            <h2 className="text-base font-bold">Assets & Liabilities</h2>
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
          <div className="space-y-2">
            {assetAccounts.length > 0 ? (
              <div>
                <button
                  type="button"
                  className="list-row w-full text-left transition hover:opacity-95"
                  aria-expanded={expandedGroup === "assets"}
                  onClick={() => toggleAccountGroup("assets")}
                >
                  <div
                    className="list-row-icon"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    <WalletCards size={18} strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{t("home.assets")}</p>
                    <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                      {assetAccounts.length} account{assetAccounts.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">
                    {formatMoney(assetGroupTotal, settings.baseCurrency, currencies, {
                      privacy,
                      compact: true,
                    })}
                  </p>
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform duration-200"
                    style={{
                      color: "var(--fg-subtle)",
                      transform: expandedGroup === "assets" ? "rotate(180deg)" : undefined,
                    }}
                  />
                </button>
                {expandedGroup === "assets" ? (
                  <ul className="mt-2 space-y-2">
                    {assetAccounts.map((account) => (
                      <AccountHomeRow
                        key={account.id}
                        account={account}
                        valueEntries={valueEntries}
                        currencies={currencies}
                        privacy={privacy}
                      />
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {liabilityAccounts.length > 0 ? (
              <div>
                <button
                  type="button"
                  className="list-row w-full text-left transition hover:opacity-95"
                  aria-expanded={expandedGroup === "liabilities"}
                  onClick={() => toggleAccountGroup("liabilities")}
                >
                  <div
                    className="list-row-icon"
                    style={{
                      background: "rgba(220, 38, 38, 0.1)",
                      color: "var(--negative)",
                    }}
                  >
                    <Landmark size={18} strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{t("home.liabilities")}</p>
                    <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
                      {liabilityAccounts.length} account
                      {liabilityAccounts.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p
                    className="shrink-0 font-semibold tabular-nums"
                    style={{ color: "var(--negative)" }}
                  >
                    {formatMoney(liabilityGroupTotal, settings.baseCurrency, currencies, {
                      privacy,
                      compact: true,
                    })}
                  </p>
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform duration-200"
                    style={{
                      color: "var(--fg-subtle)",
                      transform: expandedGroup === "liabilities" ? "rotate(180deg)" : undefined,
                    }}
                  />
                </button>
                {expandedGroup === "liabilities" ? (
                  <ul className="mt-2 space-y-2">
                    {liabilityAccounts.map((account) => (
                      <AccountHomeRow
                        key={account.id}
                        account={account}
                        valueEntries={valueEntries}
                        currencies={currencies}
                        privacy={privacy}
                      />
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
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

      <FilterSheet
        open={filterOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}
