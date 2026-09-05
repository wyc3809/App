"use client";

import { useMemo, useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { computeAllocation } from "@/lib/calculations";
import { CHART_ANIMATION, CHART_FOCUS } from "@/lib/chart-config";
import { formatMoney, formatPercent } from "@/lib/format";
import { useWorthStore } from "@/lib/store";

export function AllocationChart() {
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const [mode, setMode] = useState<"assets" | "liabilities">("assets");

  const slices = useMemo(
    () => computeAllocation(accounts, currencies, mode),
    [accounts, currencies, mode],
  );

  return (
    <SectionCard
      title="Allocation"
      className="animate-fade-up-delay-2"
      action={
        <div className="flex gap-1">
          <button
            type="button"
            className={`chip ${mode === "assets" ? "chip-active" : ""}`}
            onClick={() => setMode("assets")}
          >
            Assets
          </button>
          <button
            type="button"
            className={`chip ${mode === "liabilities" ? "chip-active" : ""}`}
            onClick={() => setMode("liabilities")}
          >
            Liabilities
          </button>
        </div>
      }
    >
      {slices.length === 0 ? (
        <EmptyState message={`Add ${mode} to see allocation.`} className="min-h-40" />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.1fr] sm:items-center">
          <div className="chart-panel mx-auto h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart {...CHART_FOCUS}>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  stroke="none"
                  {...CHART_ANIMATION}
                >
                  {slices.map((s) => (
                    <Cell key={s.category} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                  formatter={(value, name) => [
                    settings.isPrivacyMode
                      ? "••••••"
                      : formatMoney(Number(value), settings.baseCurrency, currencies, {
                          compact: true,
                        }),
                    String(name),
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="space-y-2">
            {slices.map((s) => (
              <li key={s.category} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="truncate" style={{ color: "var(--fg-muted)" }}>
                    {s.label}
                  </span>
                </div>
                <div className="shrink-0 text-right font-semibold tabular-nums">
                  <div>
                    {formatMoney(s.value, settings.baseCurrency, currencies, {
                      privacy: settings.isPrivacyMode,
                      compact: true,
                    })}
                  </div>
                  <div className="text-xs font-medium" style={{ color: "var(--fg-subtle)" }}>
                    {formatPercent(s.percent).replace("+", "")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
