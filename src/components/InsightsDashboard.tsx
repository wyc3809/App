"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChartPie,
  Filter,
  LayoutGrid,
  LineChart,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
import { BottomSheet } from "@/components/BottomSheet";
import { AllocationChart } from "@/components/AllocationChart";
import { CashflowBarChart } from "@/components/CashflowBarChart";
import { LedgerCalendarHeatmap } from "@/components/LedgerCalendarHeatmap";
import { LedgerCategoryInsight } from "@/components/LedgerCategoryInsight";
import { TrendChart } from "@/components/TrendChart";
import { CHART_FOCUS,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_CURSOR} from "@/lib/chart-config";
import {
  buildAssetsLiabilitiesTrend,
  buildInsightGrowthBars,
  computeInsightSummary,
  growthBarLabelYs,
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

const CHARTS = [
  {
    id: "growth",
    label: "Growth",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    id: "categories",
    label: "Categories",
    icon: LayoutGrid,
  },
  {
    id: "cashflow",
    label: "Cashflow",
    icon: BarChart3,
  },
  {
    id: "assets",
    label: "Assets",
    icon: Scale,
  },
  {
    id: "allocation",
    label: "Allocation",
    icon: ChartPie,
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
  },
  {
    id: "trend",
    label: "Trend",
    icon: LineChart,
  },
] as const;

type ChartId = (typeof CHARTS)[number]["id"];

/** Show bar-top labels only when they won't collide. */
const LABEL_BAR_LIMIT = 4;

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
  const [chartId, setChartId] = useState<ChartId>("growth");
  const [filterOpen, setFilterOpen] = useState(false);

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

  const showBarLabels = !privacy && growthBars.length > 0 && growthBars.length <= LABEL_BAR_LIMIT;
  const hasNegativeGrowth = growthBars.some((b) => b.change < 0);

  const money = (n: number, opts?: { showSign?: boolean }) =>
    formatMoney(n, settings.baseCurrency, currencies, {
      privacy,
      compact: true,
      showSign: opts?.showSign,
    });

  return (
    <div className="space-y-4 pb-28">
      <header className="relative flex items-center justify-center animate-fade-up">
        <div className="text-center">
          <p className="eyebrow">Analytics</p>
          <h1 className="font-display text-2xl font-bold">Insights</h1>
        </div>
        <button
          type="button"
          className="btn-ghost absolute right-0"
          aria-label="Open insights filter"
          onClick={() => setFilterOpen(true)}
        >
          <Filter size={18} />
        </button>
      </header>

      <div className="segment-track animate-fade-up" role="tablist" aria-label="Granularity">
        {GRANULARITIES.map((g) => {
          const active = granularity === g.value;
          return (
            <button
              key={g.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`segment-item ${active ? "segment-item-active" : ""}`}
              onClick={() => setGranularity(g.value)}
            >
              {g.label}
            </button>
          );
        })}
      </div>

      <div className="chip-scroll animate-fade-up-delay">
        {INSIGHT_RANGES.map((r) => {
          const active = range === r.value;
          return (
            <button
              key={r.value}
              type="button"
              className={`chip shrink-0 ${active ? "chip-active" : ""}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {!summary ? (
        <div
          className="rounded-2xl px-4 py-10 text-center text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          Take snapshots or update account values to unlock Insights.
        </div>
      ) : (
        <div className="chip-scroll -mx-1 px-1 animate-fade-up-delay">
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

      {/* Chart selector — always in-page, no overlay */}
      <div className="animate-fade-up-delay" role="tablist" aria-label="Chart type">
        <p
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--fg-subtle)" }}
        >
          Chart
        </p>
        <div className="flex flex-wrap gap-2 pb-1">
          {CHARTS.map((chart) => {
            const Icon = chart.icon;
            const selected = chart.id === chartId;
            return (
              <button
                key={chart.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className="flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition"
                style={{
                  background: selected ? "var(--accent)" : "var(--bg-muted)",
                  color: selected ? "#04140c" : "var(--fg-muted)",
                }}
                onClick={() => setChartId(chart.id)}
              >
                <Icon size={14} strokeWidth={selected ? 2.4 : 2} />
                {chart.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="animate-fade-up-delay" key={chartId}>
        {chartId === "growth" && (
          <section className="card-surface p-4">
            <h2 className="font-display text-lg">{growthChartTitle(granularity)}</h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
              {rangeSubtitle(granularity, range)}
              {!showBarLabels && growthBars.length > LABEL_BAR_LIMIT
                ? " · tap a bar for details"
                : null}
            </p>

            {growthBars.length === 0 ? (
              <Empty message="Need at least two periods of history for growth bars." />
            ) : (
              <div className="chart-panel mt-3 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={growthBars}
                    margin={{
                      top: showBarLabels ? 36 : 8,
                      right: 4,
                      left: 0,
                      bottom: showBarLabels && hasNegativeGrowth ? 36 : 8,
                    }}
                    {...CHART_FOCUS}
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
                      contentStyle={CHART_TOOLTIP_STYLE}
                      itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                      labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                      cursor={CHART_CURSOR}
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
                      {showBarLabels ? (
                        <LabelList
                          dataKey="change"
                          content={(props) => {
                            const { x, y, width, height, index } = props as {
                              x?: number;
                              y?: number;
                              width?: number;
                              height?: number;
                              index?: number;
                            };
                            if (
                              x == null ||
                              y == null ||
                              width == null ||
                              index == null
                            ) {
                              return null;
                            }
                            const row = growthBars[index];
                            if (!row) return null;
                            const amount = formatMoney(
                              row.change,
                              settings.baseCurrency,
                              currencies,
                              { showSign: true, compact: true },
                            );
                            const pct = formatPercent(row.percent);
                            const color =
                              row.change >= 0
                                ? "var(--positive)"
                                : "var(--negative)";
                            const { amountY, percentY } = growthBarLabelYs(
                              y,
                              height ?? 0,
                              row.change,
                            );
                            return (
                              <g>
                                <text
                                  x={x + width / 2}
                                  y={amountY}
                                  textAnchor="middle"
                                  fill={color}
                                  fontSize={9}
                                  fontWeight={600}
                                >
                                  {amount}
                                </text>
                                <text
                                  x={x + width / 2}
                                  y={percentY}
                                  textAnchor="middle"
                                  fill={color}
                                  fontSize={8}
                                  fontWeight={500}
                                  opacity={0.85}
                                >
                                  {pct}
                                </text>
                              </g>
                            );
                          }}
                        />
                      ) : null}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )}

        {chartId === "assets" && (
          <section className="card-surface p-4">
            <h2 className="font-display text-lg">Assets vs. Liabilities</h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
              Assets and liabilities trend over{" "}
              {range === "ALL" || range === "ALL1"
                ? "all time"
                : range === "YTD"
                  ? "this year"
                  : `the last ${range}`}
            </p>

            {alTrend.length < 2 ? (
              <Empty message="Need more history to chart assets vs liabilities." />
            ) : (
              <div className="chart-panel mt-3 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={alTrend}
                    margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                    {...CHART_FOCUS}
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
                      contentStyle={CHART_TOOLTIP_STYLE}
                      itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                      labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                      cursor={CHART_CURSOR}
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
        )}

        {chartId === "allocation" && <AllocationChart />}
        {chartId === "cashflow" && <CashflowBarChart />}
        {chartId === "categories" && <LedgerCategoryInsight />}
        {chartId === "calendar" && <LedgerCalendarHeatmap />}
        {chartId === "trend" && <TrendChart />}
      </div>
      {filterOpen ? (
        <BottomSheet
          onClose={() => setFilterOpen(false)}
          title="Insights filter"
          titleId="insights-filter-title"
          footer={
            <>
              <button
                type="button"
                className="btn-secondary min-h-11 flex-1"
                onClick={() => {
                  setGranularity("monthly");
                  setRange("6M");
                }}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn-primary min-h-11 flex-1"
                onClick={() => setFilterOpen(false)}
              >
                Apply
              </button>
            </>
          }
        >
          <div className="space-y-5">
            <div>
              <p className="label">Granularity</p>
              <div className="flex flex-wrap gap-1">
                {GRANULARITIES.map((g) => {
                  const active = granularity === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      className={`chip ${active ? "chip-active" : ""}`}
                      onClick={() => setGranularity(g.value)}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="label">Range</p>
              <div className="flex flex-wrap gap-1">
                {INSIGHT_RANGES.map((r) => {
                  const active = range === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      className={`chip ${active ? "chip-active" : ""}`}
                      onClick={() => setRange(r.value)}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </BottomSheet>
      ) : null}
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
    <div className="card-surface relative min-w-[9.5rem] flex-1 overflow-hidden px-3.5 py-3">
      {sparkline && sparkline.length > 1 && (
        <div className="chart-panel pointer-events-none absolute inset-x-0 bottom-0 h-14 opacity-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={sparkline}
              margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
              {...CHART_FOCUS}
            >
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
