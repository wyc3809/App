"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  Briefcase,
  Bus,
  Clapperboard,
  Gift,
  HeartPulse,
  Home,
  PiggyBank,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  Zap,
} from "lucide-react";
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
import {
  buildLedgerCategoryBreakdown,
  categoryBarsForChart,
  type CategoryBreakdownRow,
} from "@/lib/ledger-category-breakdown";
import { formatMoney } from "@/lib/format";
import {
  ledgerPeriodShortLabel,
  type LedgerSummaryPeriod,
} from "@/lib/ledger";
import { useWorthStore } from "@/lib/store";
import type { LedgerCategory, TransactionType } from "@/lib/types";

const PERIODS: { value: LedgerSummaryPeriod; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "ytd", label: "YTD" },
];

const ICONS: Record<LedgerCategory, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  food: UtensilsCrossed,
  transport: Bus,
  housing: Home,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  health: HeartPulse,
  utilities: Zap,
  salary: Briefcase,
  bonus: Sparkles,
  investment_return: PiggyBank,
  gift: Gift,
  transfer: Wallet,
  other: Sparkles,
};

/**
 * Insights view: pastel category cards (Ledger taxonomy) + horizontal bar chart.
 */
export function LedgerCategoryInsight() {
  const transactions = useWorthStore((s) => s.transactions);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const privacy = settings.isPrivacyMode;

  const [period, setPeriod] = useState<LedgerSummaryPeriod>("month");
  const [focus, setFocus] = useState<TransactionType>("expense");

  const breakdown = useMemo(
    () => buildLedgerCategoryBreakdown(transactions, currencies, period),
    [transactions, currencies, period],
  );

  const chartBars = useMemo(
    () => categoryBarsForChart(breakdown, focus),
    [breakdown, focus],
  );

  const money = (n: number) =>
    formatMoney(n, settings.baseCurrency, currencies, {
      privacy,
      compact: Math.abs(n) >= 10_000,
    });

  const total = focus === "expense" ? breakdown.expenseTotal : breakdown.incomeTotal;
  const hasAny =
    breakdown.expenseTotal > 0 || breakdown.incomeTotal > 0 || transactions.length > 0;

  return (
    <section className="space-y-4">
      <div className="card-surface space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg">Ledger categories</h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
              Same categories as Ledger · {ledgerPeriodShortLabel(period)} window
            </p>
          </div>
          <div
            className="flex gap-1 rounded-full p-0.5"
            style={{ background: "var(--bg-muted)" }}
            role="tablist"
            aria-label="Category period"
          >
            {PERIODS.map((p) => {
              const active = period === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: active ? "var(--bg-elevated)" : "transparent",
                    color: active ? "var(--fg)" : "var(--fg-muted)",
                  }}
                  onClick={() => setPeriod(p.value)}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-1 rounded-xl p-0.5"
          style={{ background: "var(--bg-muted)" }}
          role="tablist"
          aria-label="Category chart focus"
        >
          {(
            [
              ["expense", "Expense", breakdown.expenseTotal],
              ["income", "Income", breakdown.incomeTotal],
            ] as const
          ).map(([value, label, amount]) => {
            const active = focus === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                className="rounded-lg px-3 py-2 text-left"
                style={{
                  background: active ? "var(--bg-elevated)" : "transparent",
                }}
                onClick={() => setFocus(value)}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--fg-subtle)" }}
                >
                  {label}
                </p>
                <p
                  className="mt-0.5 text-sm font-semibold tabular-nums"
                  style={{
                    color:
                      value === "income" ? "var(--positive)" : "var(--negative)",
                  }}
                >
                  {money(amount)}
                </p>
              </button>
            );
          })}
        </div>

        {!hasAny || chartBars.length === 0 ? (
          <div
            className="flex h-40 items-center justify-center rounded-2xl px-4 text-center text-sm"
            style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
          >
            {transactions.length === 0
              ? "Add ledger income or expense to see category breakdown."
              : `No ${focus} in this ${ledgerPeriodShortLabel(period).toLowerCase()} window.`}
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartBars}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--fg-subtle)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    privacy
                      ? "••"
                      : Math.abs(v) >= 1000
                        ? `${(v / 1000).toFixed(0)}K`
                        : String(Math.round(v))
                  }
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={68}
                  tick={{ fill: "var(--fg-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--bg-muted)" }}
                  contentStyle={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--fg)",
                  }}
                  formatter={(value) => [
                    privacy
                      ? "••••••"
                      : formatMoney(Number(value), settings.baseCurrency, currencies, {
                          compact: true,
                        }),
                    focus === "income" ? "Income" : "Expense",
                  ]}
                />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={22}>
                  {chartBars.map((entry) => (
                    <Cell key={entry.key} fill={entry.tint} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {total > 0 && !privacy ? (
          <p className="text-center text-[11px]" style={{ color: "var(--fg-subtle)" }}>
            {chartBars.length} categor{chartBars.length === 1 ? "y" : "ies"} ·{" "}
            {money(total)} total
          </p>
        ) : null}
      </div>

      <CategorySection
        title="Expense"
        totalLabel={money(breakdown.expenseTotal)}
        rows={breakdown.expense}
        money={money}
        privacy={privacy}
      />
      <CategorySection
        title="Income"
        totalLabel={money(breakdown.incomeTotal)}
        rows={breakdown.income}
        money={money}
        privacy={privacy}
      />
    </section>
  );
}

function CategorySection({
  title,
  totalLabel,
  rows,
  money,
  privacy,
}: {
  title: string;
  totalLabel: string;
  rows: CategoryBreakdownRow[];
  money: (n: number) => string;
  privacy: boolean;
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5">
        <h3 className="font-display text-xl tracking-tight">
          {title}{" "}
          <span className="text-base font-normal tabular-nums" style={{ color: "var(--fg-muted)" }}>
            {totalLabel}
          </span>
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {rows.map((row) => {
          const Icon = ICONS[row.category];
          const soft = `color-mix(in srgb, ${row.tint} 14%, var(--bg-elevated))`;
          return (
            <div
              key={`${title}-${row.category}`}
              className="flex flex-col items-center rounded-2xl px-2 py-3 text-center"
              style={{
                background: soft,
                border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
              }}
            >
              <p
                className="text-[11px] font-semibold leading-tight"
                style={{ color: "var(--fg)" }}
              >
                {row.short}
              </p>
              <span
                className="mt-2 flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: `color-mix(in srgb, ${row.tint} 22%, white)`,
                  color: row.tint,
                }}
              >
                <Icon size={20} strokeWidth={2.1} />
              </span>
              <p
                className="mt-2 text-xs font-semibold tabular-nums"
                style={{ color: "var(--fg)" }}
              >
                {money(row.amount)}
              </p>
              {!privacy && row.amount > 0 ? (
                <p className="mt-0.5 text-[10px]" style={{ color: "var(--fg-subtle)" }}>
                  {row.percent.toFixed(0)}%
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
