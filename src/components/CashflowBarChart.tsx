"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_FOCUS } from "@/lib/chart-config";
import { buildMonthlyCashflowBars } from "@/lib/graph-series";
import { formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";

export function CashflowBarChart() {
  const transactions = useWorthStore((s) => s.transactions);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const [months, setMonths] = useState<6 | 12>(6);

  const data = useMemo(
    () => buildMonthlyCashflowBars(transactions, currencies, months),
    [transactions, currencies, months],
  );

  const hasActivity = data.some((d) => d.income > 0 || d.expense > 0);

  return (
    <section className="card-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg">Income vs Expense</h2>
        <div className="flex gap-1">
          {([6, 12] as const).map((m) => (
            <button
              key={m}
              type="button"
              className={`chip ${months === m ? "chip-active" : ""}`}
              onClick={() => setMonths(m)}
            >
              {m}M
            </button>
          ))}
        </div>
      </div>

      {!hasActivity ? (
        <div
          className="flex h-40 items-center justify-center rounded-2xl px-4 text-center text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          Add ledger income or expense to see the bar chart.
        </div>
      ) : (
        <div className="chart-panel h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
              {...CHART_FOCUS}
            >
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
                width={44}
                tickFormatter={(v) =>
                  Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--fg)",
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
              <Legend
                wrapperStyle={{ fontSize: 12, color: "var(--fg-muted)" }}
                iconType="circle"
              />
              <Bar
                dataKey="income"
                name="Income"
                fill="var(--positive)"
                radius={[6, 6, 0, 0]}
                maxBarSize={22}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="var(--negative)"
                radius={[6, 6, 0, 0]}
                maxBarSize={22}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
