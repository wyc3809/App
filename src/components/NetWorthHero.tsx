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
    <section className="hero-card animate-fade-up overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--hero-muted)" }}>
            Net Worth Profile
          </p>
          <h1 className="mt-1 text-lg font-bold" style={{ color: "var(--hero-fg)" }}>
            Total Balance
          </h1>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition"
          style={{ background: "rgba(255,255,255,0.16)", color: "var(--hero-fg)" }}
          aria-label={privacy ? "Show balances" : "Hide balances"}
          onClick={() => updateSettings({ isPrivacyMode: !privacy })}
        >
          {privacy ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <p
        className="text-[2.75rem] font-bold leading-none tracking-tight tabular-nums sm:text-5xl"
        style={{ color: "var(--hero-fg)" }}
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
        <div
          className="rounded-2xl p-3"
          style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--hero-muted)" }}>
            Assets
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: "var(--hero-fg)" }}>
            {formatMoney(totals.totalAssets, settings.baseCurrency, currencies, {
              privacy,
              compact: true,
            })}
          </p>
        </div>
        <div
          className="rounded-2xl p-3"
          style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--hero-muted)" }}>
            Liabilities
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: "var(--hero-fg)" }}>
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
        background: muted ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.2)",
        color: "var(--hero-fg)",
      }}
    >
      {positive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
      <span>
        {privacy
          ? "••••"
          : `${formatMoney(absolute, baseCurrency, currencies, {
              showSign: true,
              compact: true,
            })} (${formatPercent(percent)})`}
      </span>
      <span className="font-medium opacity-75">{label}</span>
    </div>
  );
}
