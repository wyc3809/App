"use client";

import { Eye, EyeOff, TrendingDown, TrendingUp } from "lucide-react";
import { computeTotals, netWorthChange } from "@/lib/calculations";
import { computeMonthlyGrowth } from "@/lib/growth";
import { formatMoney, formatPercent } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { Currency } from "@/lib/types";

export function NetWorthHero() {
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const snapshots = useWorthStore((s) => s.snapshots);
  const settings = useWorthStore((s) => s.settings);
  const updateSettings = useWorthStore((s) => s.updateSettings);

  const totals = computeTotals(accounts, currencies);
  const allTime = netWorthChange(snapshots);
  const monthly = computeMonthlyGrowth(snapshots);
  const privacy = settings.isPrivacyMode;

  return (
    <section className="card-surface animate-fade-up overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--fg-subtle)" }}
          >
            WorthBook
          </p>
          <h1 className="mt-1 font-display text-2xl" style={{ color: "var(--fg)" }}>
            Net Worth
          </h1>
        </div>
        <button
          type="button"
          className="btn-ghost"
          aria-label={privacy ? "Show balances" : "Hide balances"}
          onClick={() => updateSettings({ isPrivacyMode: !privacy })}
        >
          {privacy ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <p
        className="font-display text-4xl tabular-nums tracking-tight sm:text-5xl"
        style={{ color: "var(--fg)" }}
      >
        {formatMoney(totals.netWorth, settings.baseCurrency, currencies, {
          privacy,
          compact: Math.abs(totals.netWorth) >= 1_000_000,
        })}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {monthly && (
          <GrowthPill
            label="this month"
            absolute={monthly.absolute}
            percent={monthly.percent}
            privacy={privacy}
            baseCurrency={settings.baseCurrency}
            currencies={currencies}
          />
        )}
        {allTime && (
          <GrowthPill
            label="all time"
            absolute={allTime.absolute}
            percent={allTime.percent}
            privacy={privacy}
            baseCurrency={settings.baseCurrency}
            currencies={currencies}
            muted
          />
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3" style={{ background: "var(--accent-soft)" }}>
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--fg-subtle)" }}
          >
            Assets
          </p>
          <p
            className="mt-1 text-lg font-semibold tabular-nums"
            style={{ color: "var(--positive)" }}
          >
            {formatMoney(totals.totalAssets, settings.baseCurrency, currencies, {
              privacy,
              compact: true,
            })}
          </p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: "var(--danger-soft)" }}>
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--fg-subtle)" }}
          >
            Liabilities
          </p>
          <p
            className="mt-1 text-lg font-semibold tabular-nums"
            style={{ color: "var(--negative)" }}
          >
            {formatMoney(totals.totalLiabilities, settings.baseCurrency, currencies, {
              privacy,
              compact: true,
            })}
          </p>
        </div>
      </div>
    </section>
  );
}

function GrowthPill({
  label,
  absolute,
  percent,
  privacy,
  baseCurrency,
  currencies,
  muted = false,
}: {
  label: string;
  absolute: number;
  percent: number;
  privacy: boolean;
  baseCurrency: string;
  currencies: Currency[];
  muted?: boolean;
}) {
  const positive = absolute >= 0;
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
      style={{
        background: muted
          ? "var(--bg-muted)"
          : positive
            ? "var(--accent-soft)"
            : "var(--danger-soft)",
        color: muted
          ? "var(--fg-muted)"
          : positive
            ? "var(--positive)"
            : "var(--negative)",
      }}
    >
      {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
      <span>
        {privacy
          ? "••••"
          : `${formatMoney(absolute, baseCurrency, currencies, {
              showSign: true,
              compact: true,
            })} (${formatPercent(percent)})`}
      </span>
      <span className="font-medium opacity-70">{label}</span>
    </div>
  );
}
