"use client";

import { useMemo, useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { filterSnapshotsByRange } from "@/lib/calculations";
import { CHART_ANIMATION, CHART_FOCUS,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_CURSOR} from "@/lib/chart-config";
import {
  buildMonthlyGrowthSeries,
  filterMonthlySeriesByRange,
} from "@/lib/growth";
import { formatDateLabel, formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { TimeRange } from "@/lib/types";

const RANGES: TimeRange[] = ["1M", "3M", "6M", "1Y", "ALL"];
type Metric = "netWorth" | "assets" | "liabilities" | "all";
type Granularity = "snapshots" | "monthly";

const METRIC_META: Record<
  Exclude<Metric, "all">,
  { label: string; color: string; dataKey: string }
> = {
  netWorth: { label: "Net Worth", color: "var(--accent)", dataKey: "netWorth" },
  assets: { label: "Assets", color: "var(--positive)", dataKey: "assets" },
  liabilities: {
    label: "Liabilities",
    color: "var(--negative)",
    dataKey: "liabilities",
  },
};

export function TrendChart() {
  const snapshots = useWorthStore((s) => s.snapshots);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const [range, setRange] = useState<TimeRange>("6M");
  const [metric, setMetric] = useState<Metric>("netWorth");
  const [granularity, setGranularity] = useState<Granularity>("snapshots");

  const data = useMemo(() => {
    if (granularity === "monthly") {
      return filterMonthlySeriesByRange(
        buildMonthlyGrowthSeries(snapshots),
        range,
      ).map((p) => ({
        date: p.snapshotDate,
        label: p.label,
        netWorth: p.netWorth,
        assets: p.assets,
        liabilities: p.liabilities,
      }));
    }

    return filterSnapshotsByRange(snapshots, range).map((s) => ({
      date: s.date,
      label: formatDateLabel(s.date),
      netWorth: s.netWorthBaseCurrency,
      assets: s.totalAssetsBaseCurrency,
      liabilities: s.totalLiabilitiesBaseCurrency,
    }));
  }, [snapshots, range, granularity]);

  const activeKeys =
    metric === "all"
      ? (["netWorth", "assets", "liabilities"] as const)
      : ([metric] as const);

  return (
    <SectionCard title="Trend" className="animate-fade-up-delay">
      <div className="mb-3 flex flex-wrap gap-1">
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

      <div className="mb-3 flex flex-wrap gap-1">
        {(
          [
            ["snapshots", "Snapshots"],
            ["monthly", "Monthly"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip ${granularity === key ? "chip-active" : ""}`}
            onClick={() => setGranularity(key)}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 self-center text-xs" style={{ color: "var(--fg-subtle)" }}>
          ·
        </span>
        {(
          [
            ["netWorth", "Net Worth"],
            ["assets", "Assets"],
            ["liabilities", "Liabilities"],
            ["all", "All"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip ${metric === key ? "chip-active" : ""}`}
            onClick={() => setMetric(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <EmptyChart message="Take a snapshot to start your net worth history." />
      ) : (
        <div className="chart-panel h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
              {...CHART_FOCUS}
            >
              <defs>
                {activeKeys.map((key) => (
                  <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={METRIC_META[key].color}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor={METRIC_META[key].color}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
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
                formatter={(value, name) => [
                  settings.isPrivacyMode
                    ? "••••••"
                    : formatMoney(Number(value), settings.baseCurrency, currencies),
                  String(name),
                ]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
              />
              {metric === "all" && (
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "var(--fg-muted)" }}
                  iconType="circle"
                />
              )}
              {activeKeys.map((key) =>
                metric === "all" && key !== "netWorth" ? (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={METRIC_META[key].dataKey}
                    name={METRIC_META[key].label}
                    stroke={METRIC_META[key].color}
                    strokeWidth={2.5}
                    dot={false}
                    {...CHART_ANIMATION}
                  />
                ) : (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={METRIC_META[key].dataKey}
                    name={METRIC_META[key].label}
                    stroke={METRIC_META[key].color}
                    strokeWidth={3}
                    fill={`url(#fill-${key})`}
                    {...CHART_ANIMATION}
                  />
                ),
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <EmptyState message={message} className="min-h-40" />;
}
