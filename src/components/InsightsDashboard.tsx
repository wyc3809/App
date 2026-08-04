"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Filter, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildAssetsLiabilitiesTrend,
  buildInsightGrowthBars,
  computeInsightSummary,
  growthChartTitle,
  INSIGHT_RANGES,
  rangeSubtitle,
  type InsightGranularity,
  type InsightRange,
} from "@/lib/insights";
import { formatMoney, formatPercent } from "@/lib/format";
import { useWorthStore } from "@/lib/store";

const GRANULARITIES: { value: InsightGranularity; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

function compactAxis(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1000) return `${(v / 1000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(v));
}

export function InsightsDashboard() {
  const snapshots = useWorthStore((s) => s.snapshots);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const privacy = settings.isPrivacyMode;

  const [granularity, setGranularity] = useState<InsightGranularity>("monthly");
  const [range, setRange] = useState<InsightRange>("6M");

  const summary = useMemo(
    () => computeInsightSummary(snapshots, range),
    [snapshots, range],
  );
  const growthBars = useMemo(
    () => buildInsightGrowthBars(snapshots, granularity, range),
    [snapshots, granularity, range],
  );
  const alTrend = useMemo(
    () => buildAssetsLiabilitiesTrend(snapshots, range),
    [snapshots, range],
  );

  const money = (n: number, opts?: { showSign?: boolean }) =>
    formatMoney(n, settings.baseCurrency, currencies, {
      privacy,
      compact: true,
      showSign: opts?.showSign,
    });

  return (
    <div className="space-y-4 pb-4">
      <header className="relative flex items-center justify-center animate-fade-up">
        <h1 className="font-display text-2xl">Insights</h1>
        <button
          type="button"
          className="btn-ghost absolute right-0"
          aria-label="Filter"
          onClick={() => setRange("6M")}
        >
          <Filter size={18} />
        </button>
      </header>

      {/* Monthly / Quarterly / Yearly */}
      <div
        className="grid grid-cols-3 gap-1 rounded-2xl p-1 animate-fade-up"
        style={{ background: "var(--bg-muted)" }}
        role="tablist"
        aria-label="Granularity"
      >
        {GRANULARITIES.map((g) => {
          const active = granularity === g.value;
          return (
            <button
              key={g.value}
              type="button"
              role="tab"
              aria-selected={active}
              className="rounded-xl px-2 py-2.5 text-sm font-semibold transition"
              style={{
                background: active ? "var(--bg-elevated)" : "transparent",
                color: active ? "var(--fg)" : "var(--fg-muted)",
                boxShadow: active ? "var(--shadow-soft)" : "none",
              }}
              onClick={() => setGranularity(g.value)}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      {/* Range chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-up-delay">
        {INSIGHT_RANGES.map((r) => {
          const active = range === r.value;
          return (
            <button
              key={r.value}
              type="button"
              className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
              style={{
                background: active ? "var(--fg)" : "var(--bg-muted)",
                color: active ? "var(--bg)" : "var(--fg-muted)",
              }}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Summary cards */}
      {!summary ? (
        <div
          className="rounded-2xl px-4 py-10 text-center text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          Take snapshots or update account values to unlock Insights.
        </div>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 animate-fade-up-delay">
          <SummaryCard
            label="Total Net Worth"
            value={money(summary.netWorth)}
            sparkline={summary.sparkline}
          />
          <SummaryCard
            label="Period Change"
            value={
              privacy
                ? "••••"
                : `${money(summary.periodChange, { showSign: true })} / ${formatPercent(summary.periodChangePercent)}`
            }
            tone={summary.periodChange >= 0 ? "positive" : "negative"}
            icon={
              summary.periodChange >= 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )
            }
          />
          <SummaryCard
            label="Average"
            value={money(summary.averageNetWorth)}
            hint={`${granularity === "monthly" ? "Monthly" : granularity === "quarterly" ? "Quarterly" : "Yearly"} avg`}
          />
        </div>
      )}

      {/* Growth bar chart */}
      <section className="card-surface p-4 animate-fade-up-delay">
        <h2 className="font-display text-lg">{growthChartTitle(granularity)}</h2>
        <p className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
          {rangeSubtitle(granularity, range)}
        </p>

        {growthBars.length === 0 ? (
          <Empty message="Need at least two periods of history for growth bars." />
        ) : (
          <div className="mt-3 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={growthBars}
                margin={{ top: 28, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--fg-subtle)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={compactAxis}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--fg)",
                  }}
                  formatter={(value, _n, item) => {
                    const pct = item?.payload?.percent as number | undefined;
                    const moneyLabel = privacy
                      ? "••••••"
                      : formatMoney(Number(value), settings.baseCurrency, currencies, {
                          showSign: true,
                          compact: true,
                        });
                    const pctLabel =
                      privacy || pct == null ? "" : ` (${formatPercent(pct)})`;
                    return [`${moneyLabel}${pctLabel}`, "Change"];
                  }}
                />
                <Bar dataKey="change" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {growthBars.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={
                        entry.change >= 0 ? "var(--positive)" : "var(--negative)"
                      }
                    />
                  ))}
                  <LabelList
                    dataKey="change"
                    position="top"
                    content={(props) => {
                      const { x, y, width, index } = props as {
                        x?: number;
                        y?: number;
                        width?: number;
                        index?: number;
                      };
                      if (
                        x == null ||
                        y == null ||
                        width == null ||
                        index == null ||
                        privacy
                      ) {
                        return null;
                      }
                      const row = growthBars[index];
                      if (!row) return null;
                      const label = `${formatMoney(row.change, settings.baseCurrency, currencies, {
                        showSign: true,
                        compact: true,
                      })} ${formatPercent(row.percent)}`;
                      return (
                        <text
                          x={x + width / 2}
                          y={y - 6}
                          textAnchor="middle"
                          fill={
                            row.change >= 0
                              ? "var(--positive)"
                              : "var(--negative)"
                          }
                          fontSize={9}
                          fontWeight={600}
                        >
                          {label}
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Assets vs Liabilities */}
      <section className="card-surface p-4 animate-fade-up-delay-2">
        <h2 className="font-display text-lg">Assets vs. Liabilities</h2>
        <p className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
          Assets and liabilities trend over{" "}
          {range === "ALL" || range === "ALL1" ? "all time" : range === "YTD" ? "this year" : `the last ${range}`}
        </p>

        {alTrend.length < 2 ? (
          <Empty message="Need more history to chart assets vs liabilities." />
        ) : (
          <div className="mt-3 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={alTrend}
                margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="insAssets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="insLiab" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B6914" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8B6914" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "var(--fg-subtle)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={compactAxis}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--fg)",
                  }}
                  formatter={(value, name) => [
                    privacy
                      ? "••••••"
                      : formatMoney(Number(value), settings.baseCurrency, currencies, {
                          compact: true,
                        }),
                    String(name),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="assets"
                  name="Assets"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#insAssets)"
                />
                <Area
                  type="monotone"
                  dataKey="liabilities"
                  name="Liabilities"
                  stroke="#8B6914"
                  strokeWidth={2}
                  fill="url(#insLiab)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sparkline,
  tone,
  icon,
  hint,
}: {
  label: string;
  value: string;
  sparkline?: { v: number }[];
  tone?: "positive" | "negative";
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <div
      className="relative min-w-[9.5rem] flex-1 overflow-hidden rounded-2xl px-3.5 py-3"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      {sparkline && sparkline.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 opacity-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="sumSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--positive)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--positive)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--positive)"
                strokeWidth={1.5}
                fill="url(#sumSpark)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <p
        className="relative text-[10px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: "var(--fg-subtle)" }}
      >
        {label}
      </p>
      <p
        className="relative mt-2 flex items-center gap-1 text-base font-semibold tabular-nums"
        style={{
          color:
            tone === "positive"
              ? "var(--positive)"
              : tone === "negative"
                ? "var(--negative)"
                : "var(--fg)",
        }}
      >
        {icon}
        <span className="truncate">{value}</span>
        {tone === "positive" && !icon ? <ArrowUpRight size={14} /> : null}
      </p>
      {hint && (
        <p className="relative mt-1 text-[10px]" style={{ color: "var(--fg-subtle)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div
      className="mt-3 flex h-28 items-center justify-center rounded-2xl px-4 text-center text-sm"
      style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
    >
      {message}
    </div>
  );
}
