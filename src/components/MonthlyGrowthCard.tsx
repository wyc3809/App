"use client";

import { CalendarRange, TrendingDown, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  buildMonthlyGrowthSeries,
  computeMonthlyGrowth,
  filterMonthlySeriesByRange,
} from "@/lib/growth";
import { formatMoney, formatPercent } from "@/lib/format";
import { CHART_ANIMATION } from "@/lib/chart-config";
import { useWorthStore } from "@/lib/store";

export function MonthlyGrowthCard() {
  const snapshots = useWorthStore((s) => s.snapshots);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const privacy = settings.isPrivacyMode;

  const growth = useMemo(() => computeMonthlyGrowth(snapshots), [snapshots]);
  const series = useMemo(
    () => filterMonthlySeriesByRange(buildMonthlyGrowthSeries(snapshots), "1Y"),
    [snapshots],
  );

  const chartData = series
    .filter((p) => p.absoluteChange !== null)
    .map((p) => ({
      label: p.label,
      month: p.month,
      change: p.absoluteChange as number,
      percent: p.percentChange as number,
    }));

  if (!growth && chartData.length === 0) {
    return (
      <SectionCard
        title="Monthly Growth"
        className="animate-fade-up-delay"
        action={<CalendarRange size={18} style={{ color: "var(--accent)" }} />}
      >
        <EmptyState message="Need at least two months of snapshots to calculate growth." />
      </SectionCard>
    );
  }

  const positive = (growth?.absolute ?? 0) >= 0;

  return (
    <SectionCard
      title="Monthly Growth"
      className="animate-fade-up-delay"
      action={
        growth ? (
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: positive ? "var(--accent-soft)" : "var(--danger-soft)",
              color: positive ? "var(--positive)" : "var(--negative)",
            }}
          >
            {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {privacy
              ? "••••"
              : `${formatMoney(growth.absolute, settings.baseCurrency, currencies, {
                  showSign: true,
                  compact: true,
                })} (${formatPercent(growth.percent)})`}
          </div>
        ) : (
          <CalendarRange size={18} style={{ color: "var(--accent)" }} />
        )
      }
    >
      {growth && (
        <p className="-mt-1 mb-3 text-xs" style={{ color: "var(--fg-subtle)" }}>
          {growth.fromDate} → {growth.toDate}
        </p>
      )}

      {chartData.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          MoM change will appear after you have snapshots across multiple months.
        </p>
      ) : (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--fg-subtle)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
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
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--fg)",
                }}
                formatter={(value, _name, item) => {
                  const percent = item?.payload?.percent as number | undefined;
                  const money = privacy
                    ? "••••••"
                    : formatMoney(Number(value), settings.baseCurrency, currencies, {
                        showSign: true,
                        compact: true,
                      });
                  const pct =
                    privacy || percent == null ? "" : ` (${formatPercent(percent)})`;
                  return [`${money}${pct}`, "MoM change"];
                }}
              />
              <Bar dataKey="change" radius={[8, 8, 0, 0]} {...CHART_ANIMATION}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.month}
                    fill={entry.change >= 0 ? "var(--positive)" : "var(--negative)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
