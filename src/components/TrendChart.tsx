"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { filterSnapshotsByRange } from "@/lib/calculations";
import { formatDateLabel, formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { TimeRange } from "@/lib/types";

const RANGES: TimeRange[] = ["1M", "3M", "6M", "1Y", "ALL"];

export function TrendChart() {
  const snapshots = useWorthStore((s) => s.snapshots);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const [range, setRange] = useState<TimeRange>("6M");

  const data = useMemo(() => {
    return filterSnapshotsByRange(snapshots, range).map((s) => ({
      date: s.date,
      label: formatDateLabel(s.date),
      netWorth: s.netWorthBaseCurrency,
      assets: s.totalAssetsBaseCurrency,
      liabilities: s.totalLiabilitiesBaseCurrency,
    }));
  }, [snapshots, range]);

  return (
    <section className="card-surface animate-fade-up-delay p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg">Trend</h2>
        <div className="flex flex-wrap gap-1">
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
      </div>

      {data.length === 0 ? (
        <EmptyChart message="Take a snapshot to start your net worth history." />
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
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
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--fg)",
                }}
                formatter={(value) => [
                  settings.isPrivacyMode
                    ? "••••••"
                    : formatMoney(Number(value), settings.baseCurrency, currencies),
                  "Net Worth",
                ]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#nwFill)"
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div
      className="flex h-40 items-center justify-center rounded-2xl px-4 text-center text-sm"
      style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
    >
      {message}
    </div>
  );
}
