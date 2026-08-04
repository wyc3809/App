"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonthlyCalendarDays } from "@/lib/graph-series";
import { formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function LedgerCalendarHeatmap() {
  const transactions = useWorthStore((s) => s.transactions);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(
    () => buildMonthlyCalendarDays(transactions, currencies, year, monthIndex),
    [transactions, currencies, year, monthIndex],
  );

  const monthTitle = useMemo(
    () =>
      new Date(year, monthIndex, 1).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [year, monthIndex],
  );

  const monthTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const c of cells) {
      if (!c.inMonth) continue;
      income += c.income;
      expense += c.expense;
    }
    return { income, expense, net: income - expense };
  }, [cells]);

  const selectedCell = cells.find((c) => c.date === selected) ?? null;
  const hasActivity = cells.some((c) => c.inMonth && (c.expense > 0 || c.income > 0));

  const shiftMonth = (delta: number) => {
    const d = new Date(year, monthIndex + delta, 1);
    setYear(d.getFullYear());
    setMonthIndex(d.getMonth());
    setSelected(null);
  };

  return (
    <section className="card-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg">Monthly calendar</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-ghost min-h-10 min-w-10"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[8.5rem] text-center text-sm font-semibold">
            {monthTitle}
          </span>
          <button
            type="button"
            className="btn-ghost min-h-10 min-w-10"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl px-2 py-2" style={{ background: "var(--bg-muted)" }}>
          <p style={{ color: "var(--fg-subtle)" }}>Income</p>
          <p className="mt-0.5 font-semibold tabular-nums" style={{ color: "var(--positive)" }}>
            {formatMoney(monthTotals.income, settings.baseCurrency, currencies, {
              privacy: settings.isPrivacyMode,
              compact: true,
            })}
          </p>
        </div>
        <div className="rounded-xl px-2 py-2" style={{ background: "var(--bg-muted)" }}>
          <p style={{ color: "var(--fg-subtle)" }}>Expense</p>
          <p className="mt-0.5 font-semibold tabular-nums" style={{ color: "var(--negative)" }}>
            {formatMoney(monthTotals.expense, settings.baseCurrency, currencies, {
              privacy: settings.isPrivacyMode,
              compact: true,
            })}
          </p>
        </div>
        <div className="rounded-xl px-2 py-2" style={{ background: "var(--bg-muted)" }}>
          <p style={{ color: "var(--fg-subtle)" }}>Net</p>
          <p
            className="mt-0.5 font-semibold tabular-nums"
            style={{
              color: monthTotals.net >= 0 ? "var(--positive)" : "var(--negative)",
            }}
          >
            {formatMoney(monthTotals.net, settings.baseCurrency, currencies, {
              privacy: settings.isPrivacyMode,
              compact: true,
              showSign: true,
            })}
          </p>
        </div>
      </div>

      {!hasActivity ? (
        <div
          className="flex h-28 items-center justify-center rounded-2xl px-4 text-center text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          No ledger activity this month. Switch months or add entries in Ledger.
        </div>
      ) : null}

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-[10px] font-semibold"
            style={{ color: "var(--fg-subtle)" }}
          >
            {d}
          </div>
        ))}
        {cells.map((cell) => {
          const dayNum = Number(cell.date.slice(8, 10));
          const active = selected === cell.date;
          const level = cell.intensity;
          const bg =
            !cell.inMonth
              ? "transparent"
              : cell.expense <= 0 && cell.income <= 0
                ? "var(--bg-muted)"
                : cell.expense > 0
                  ? `color-mix(in srgb, var(--negative) ${Math.max(16, Math.round(level * 80))}%, var(--bg-muted))`
                  : "color-mix(in srgb, var(--positive) 22%, var(--bg-muted))";
          return (
            <button
              key={cell.date}
              type="button"
              disabled={!cell.inMonth}
              title={cell.date}
              aria-label={`${cell.date}: expense ${cell.expense}`}
              className="flex aspect-square flex-col items-center justify-center rounded-xl text-[11px] font-semibold transition disabled:cursor-default"
              style={{
                background: bg,
                color: cell.inMonth ? "var(--fg)" : "var(--fg-subtle)",
                opacity: cell.inMonth ? 1 : 0.35,
                outline: active
                  ? "1.5px solid var(--accent)"
                  : "1px solid transparent",
              }}
              onClick={() => {
                if (!cell.inMonth) return;
                setSelected((d) => (d === cell.date ? null : cell.date));
              }}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {selectedCell && selectedCell.inMonth && (
        <p className="mt-3 text-sm" style={{ color: "var(--fg-muted)" }}>
          <span className="font-semibold" style={{ color: "var(--fg)" }}>
            {selectedCell.date}
          </span>
          {" · "}
          Expense{" "}
          {formatMoney(selectedCell.expense, settings.baseCurrency, currencies, {
            privacy: settings.isPrivacyMode,
            compact: true,
          })}
          {" · "}
          Income{" "}
          {formatMoney(selectedCell.income, settings.baseCurrency, currencies, {
            privacy: settings.isPrivacyMode,
            compact: true,
          })}
        </p>
      )}
    </section>
  );
}
