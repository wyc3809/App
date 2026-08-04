"use client";

import { useMemo, useState } from "react";
import { buildLedgerCalendarDays } from "@/lib/graph-series";
import { formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function LedgerCalendarHeatmap() {
  const transactions = useWorthStore((s) => s.transactions);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const [weeks, setWeeks] = useState<12 | 16>(12);
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(
    () => buildLedgerCalendarDays(transactions, currencies, weeks),
    [transactions, currencies, weeks],
  );

  const columns = useMemo(() => {
    const cols: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      cols.push(cells.slice(i, i + 7));
    }
    return cols;
  }, [cells]);

  const selectedCell = cells.find((c) => c.date === selected) ?? null;
  const hasActivity = cells.some((c) => c.expense > 0 || c.income > 0);

  return (
    <section className="card-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg">Spending calendar</h2>
        <div className="flex gap-1">
          {([12, 16] as const).map((w) => (
            <button
              key={w}
              type="button"
              className={`chip ${weeks === w ? "chip-active" : ""}`}
              onClick={() => setWeeks(w)}
            >
              {w}w
            </button>
          ))}
        </div>
      </div>

      {!hasActivity ? (
        <div
          className="flex h-28 items-center justify-center rounded-2xl px-4 text-center text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          Ledger expenses will light up this calendar.
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <div
              className="grid shrink-0 grid-rows-7 gap-1 pr-1 text-[9px] font-semibold"
              style={{ color: "var(--fg-subtle)" }}
            >
              {WEEKDAYS.map((d, i) => (
                <span key={`${d}-${i}`} className="flex h-3.5 items-center">
                  {d}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {columns.map((col, ci) => (
                <div key={ci} className="grid grid-rows-7 gap-1">
                  {col.map((cell) => {
                    const active = selected === cell.date;
                    const level = cell.intensity;
                    const bg =
                      cell.expense <= 0
                        ? "var(--bg-muted)"
                        : `color-mix(in srgb, var(--negative) ${Math.max(18, Math.round(level * 85))}%, var(--bg-muted))`;
                    return (
                      <button
                        key={cell.date}
                        type="button"
                        title={cell.date}
                        aria-label={`${cell.date}: expense ${cell.expense}`}
                        className="h-3.5 w-3.5 rounded-[3px] transition"
                        style={{
                          background: bg,
                          outline: active
                            ? "1.5px solid var(--accent)"
                            : "1px solid transparent",
                        }}
                        onClick={() =>
                          setSelected((d) => (d === cell.date ? null : cell.date))
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 text-[10px]" style={{ color: "var(--fg-subtle)" }}>
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 0.25, 0.5, 0.75, 1].map((level) => (
                <span
                  key={level}
                  className="h-3 w-3 rounded-[3px]"
                  style={{
                    background:
                      level === 0
                        ? "var(--bg-muted)"
                        : `color-mix(in srgb, var(--negative) ${Math.round(level * 85)}%, var(--bg-muted))`,
                  }}
                />
              ))}
            </div>
            <span>More</span>
          </div>

          {selectedCell && (
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
        </>
      )}
    </section>
  );
}
