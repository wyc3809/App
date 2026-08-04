"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChartPie,
  ChevronDown,
  Filter,
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
import { AllocationChart } from "@/components/AllocationChart";
import { CashflowBarChart } from "@/components/CashflowBarChart";
import { LedgerCalendarHeatmap } from "@/components/LedgerCalendarHeatmap";
import { TrendChart } from "@/components/TrendChart";
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

const CHARTS = [
  {
    id: "growth",
    label: "Growth",
    description: "Period growth bars",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    id: "assets",
    label: "Assets vs Liabilities",
    description: "Stacked area trend",
    icon: Scale,
  },
  {
    id: "allocation",
    label: "Allocation",
    description: "Pie by category",
    icon: ChartPie,
  },
  {
    id: "cashflow",
    label: "Cashflow",
    description: "Income vs expense bars",
    icon: BarChart3,
  },
  {
    id: "calendar",
    label: "Calendar",
    description: "Monthly spending grid",
    icon: CalendarDays,
  },
  {
    id: "trend",
    label: "Trend",
    description: "Net worth over time",
    icon: LineChart,
  },
] as const;

type ChartId = (typeof CHARTS)[number]["id"];

/** Show bar-top labels only when they won't collide. */
const LABEL_BAR_LIMIT = 6;

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
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const activeChart = CHARTS.find((c) => c.id === chartId) ?? CHARTS[0];
  const ActiveIcon = activeChart.icon;
  const showBarLabels = !privacy && growthBars.length > 0 && growthBars.length <= LABEL_BAR_LIMIT;

  const money = (n: number, opts?: { showSign?: boolean }) =>
    formatMoney(n, settings.baseCurrency, currencies, {
      privacy,
      compact: true,
      showSign: opts?.showSign,
    });

  return (
    <div className="space-y-4 pb-28">
      <header className="relative flex items-center justify-center animate-fade-up">
        <h1 className="font-display text-2xl">Insights</h1>
        <button
          type="button"
          className="btn-ghost absolute right-0"
          aria-label="Reset range to 6M"
          onClick={() => setRange("6M")}
        >
          <Filter size={18} />
        </button>
      </header>

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

      {/* Chart picker */}
      <div className="relative z-10 animate-fade-up-delay">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((v) => !v)}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <ActiveIcon size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{activeChart.label}</span>
              <span className="block truncate text-xs" style={{ color: "var(--fg-subtle)" }}>
                {activeChart.description}
              </span>
            </span>
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 transition ${pickerOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--fg-muted)" }}
          />
        </button>

        {pickerOpen && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close chart picker"
              onClick={() => setPickerOpen(false)}
            />
            <div
              role="dialog"
              aria-label="Choose chart"
              className="relative z-10 max-h-[min(70dvh,28rem)] w-full max-w-lg overflow-y-auto rounded-t-3xl border pb-[max(1rem,var(--safe-bottom))] sm:rounded-3xl"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <div className="sticky top-0 z-10 border-b px-4 py-3" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                <p className="text-center text-sm font-semibold">Choose chart</p>
              </div>
              <ul>
                {CHARTS.map((chart) => {
                  const Icon = chart.icon;
                  const selected = chart.id === chartId;
                  return (
                    <li key={chart.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition"
                        style={{
                          background: selected ? "var(--accent-soft)" : "transparent",
                        }}
                        onClick={() => {
                          setChartId(chart.id);
                          setPickerOpen(false);
                        }}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            background: selected
                              ? "color-mix(in srgb, var(--accent) 18%, transparent)"
                              : "var(--bg-muted)",
                            color: selected ? "var(--accent)" : "var(--fg-muted)",
                          }}
                        >
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0">
                          <span
                            className="block text-sm font-semibold"
                            style={{ color: selected ? "var(--accent)" : "var(--fg)" }}
                          >
                            {chart.label}
                          </span>
                          <span className="block text-xs" style={{ color: "var(--fg-subtle)" }}>
                            {chart.description}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
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
              <div className="mt-3 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={growthBars}
                    margin={{
                      top: showBarLabels ? 36 : 8,
                      right: 4,
                      left: 0,
                      bottom: 0,
                    }}
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
                      {showBarLabels ? (
                        <LabelList
                          dataKey="labelText"
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
                            return (
                              <g>
                                <text
                                  x={x + width / 2}
                                  y={y - 16}
                                  textAnchor="middle"
                                  fill={color}
                                  fontSize={9}
                                  fontWeight={600}
                                >
                                  {amount}
                                </text>
                                <text
                                  x={x + width / 2}
                                  y={y - 4}
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
        )}

        {chartId === "allocation" && <AllocationChart />}
        {chartId === "cashflow" && <CashflowBarChart />}
        {chartId === "calendar" && <LedgerCalendarHeatmap />}
        {chartId === "trend" && <TrendChart />}
      </div>
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
