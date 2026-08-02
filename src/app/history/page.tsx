"use client";

import { Camera, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useWorthStore } from "@/lib/store";

export default function HistoryPage() {
  const snapshots = useWorthStore((s) => s.snapshots);
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const takeSnapshot = useWorthStore((s) => s.takeSnapshot);
  const deleteSnapshot = useWorthStore((s) => s.deleteSnapshot);

  const ordered = [...snapshots].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4 pb-4">
      <header className="animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--fg-subtle)" }}>
          Timeline
        </p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h1 className="font-display text-3xl">History</h1>
          <button
            type="button"
            className="btn-primary"
            disabled={accounts.length === 0}
            onClick={() => takeSnapshot()}
          >
            <Camera size={18} />
            Snapshot
          </button>
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          Point-in-time net worth records in {settings.baseCurrency}.
        </p>
      </header>

      {ordered.length === 0 ? (
        <div
          className="rounded-2xl px-4 py-10 text-center text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          No snapshots yet. Capture one after updating account balances.
        </div>
      ) : (
        <ul className="space-y-2 animate-fade-up-delay">
          {ordered.map((snap, index) => {
            const prev = ordered[index + 1];
            const delta = prev ? snap.netWorthBaseCurrency - prev.netWorthBaseCurrency : null;
            return (
              <li key={snap.id} className="card-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{snap.date}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--fg-subtle)" }}>
                      Assets{" "}
                      {formatMoney(snap.totalAssetsBaseCurrency, settings.baseCurrency, currencies, {
                        privacy: settings.isPrivacyMode,
                        compact: true,
                      })}
                      {" · "}
                      Liabilities{" "}
                      {formatMoney(
                        snap.totalLiabilitiesBaseCurrency,
                        settings.baseCurrency,
                        currencies,
                        { privacy: settings.isPrivacyMode, compact: true },
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">
                      {formatMoney(snap.netWorthBaseCurrency, settings.baseCurrency, currencies, {
                        privacy: settings.isPrivacyMode,
                        compact: true,
                      })}
                    </p>
                    {delta !== null && (
                      <p
                        className="mt-0.5 text-xs font-semibold tabular-nums"
                        style={{
                          color: delta >= 0 ? "var(--positive)" : "var(--negative)",
                        }}
                      >
                        {settings.isPrivacyMode
                          ? "••••"
                          : formatMoney(delta, settings.baseCurrency, currencies, {
                              showSign: true,
                              compact: true,
                            })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ color: "var(--danger)" }}
                    onClick={() => {
                      if (confirm(`Delete snapshot from ${snap.date}?`)) {
                        deleteSnapshot(snap.id);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
