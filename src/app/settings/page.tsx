"use client";

import { Download, Eraser, Fingerprint, Moon, Shield, Sparkles, Sun, Monitor } from "lucide-react";
import { useWorthStore } from "@/lib/store";
import type { UserSettings } from "@/lib/types";

export default function SettingsPage() {
  const settings = useWorthStore((s) => s.settings);
  const currencies = useWorthStore((s) => s.currencies);
  const accounts = useWorthStore((s) => s.accounts);
  const snapshots = useWorthStore((s) => s.snapshots);
  const updateSettings = useWorthStore((s) => s.updateSettings);
  const updateCurrencyRate = useWorthStore((s) => s.updateCurrencyRate);
  const setBaseCurrency = useWorthStore((s) => s.setBaseCurrency);
  const loadDemoData = useWorthStore((s) => s.loadDemoData);
  const resetAll = useWorthStore((s) => s.resetAll);

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      currencies,
      accounts,
      snapshots,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worthtracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const themes: { value: UserSettings["theme"]; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-4 pb-4">
      <header className="animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--fg-subtle)" }}>
          Preferences
        </p>
        <h1 className="mt-1 font-display text-3xl">Settings</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          Offline-first. Your balances never leave this browser.
        </p>
      </header>

      <section className="card-surface animate-fade-up space-y-4 p-4">
        <h2 className="font-display text-lg">Display</h2>

        <div>
          <p className="label">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-semibold"
                style={{
                  background:
                    settings.theme === value ? "var(--accent-soft)" : "var(--bg-muted)",
                  color: settings.theme === value ? "var(--accent)" : "var(--fg-muted)",
                }}
                onClick={() => updateSettings({ theme: value })}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <ToggleRow
          icon={<Shield size={18} />}
          title="Privacy mode"
          description="Mask balances with dots"
          checked={settings.isPrivacyMode}
          onChange={(v) => updateSettings({ isPrivacyMode: v })}
        />

        <ToggleRow
          icon={<Fingerprint size={18} />}
          title="Biometric lock"
          description="Preference stored locally (device unlock when available)"
          checked={settings.isBiometricEnabled}
          onChange={(v) => updateSettings({ isBiometricEnabled: v })}
        />
      </section>

      <section className="card-surface animate-fade-up-delay space-y-4 p-4">
        <h2 className="font-display text-lg">Currency</h2>

        <div>
          <label className="label" htmlFor="base-currency">
            Base currency
          </label>
          <select
            id="base-currency"
            className="field"
            value={settings.baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="label">Exchange rates → {settings.baseCurrency}</p>
          <ul className="space-y-2">
            {currencies
              .filter((c) => c.code !== settings.baseCurrency)
              .map((c) => (
                <li key={c.code} className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-sm font-semibold">{c.code}</span>
                  <input
                    className="field"
                    type="number"
                    min="0"
                    step="any"
                    value={c.exchangeRateToBase}
                    onChange={(e) => {
                      const rate = Number(e.target.value);
                      if (!Number.isNaN(rate)) updateCurrencyRate(c.code, rate);
                    }}
                    aria-label={`${c.code} exchange rate`}
                  />
                </li>
              ))}
          </ul>
          <p className="mt-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
            Rate = how many {settings.baseCurrency} equal 1 unit of that currency.
          </p>
        </div>
      </section>

      <section className="card-surface animate-fade-up-delay-2 space-y-3 p-4">
        <h2 className="font-display text-lg">Data</h2>

        <button type="button" className="btn-secondary w-full" onClick={exportJson}>
          <Download size={18} />
          Export JSON backup
        </button>

        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => {
            if (confirm("Replace current data with the demo portfolio?")) loadDemoData();
          }}
        >
          <Sparkles size={18} />
          Load demo portfolio
        </button>

        <button
          type="button"
          className="btn-secondary w-full"
          style={{ color: "var(--danger)" }}
          onClick={() => {
            if (confirm("Delete all accounts, snapshots, and reset settings?")) resetAll();
          }}
        >
          <Eraser size={18} />
          Reset all data
        </button>
      </section>

      <p className="px-1 pb-2 text-center text-xs" style={{ color: "var(--fg-subtle)" }}>
        WorthTracker v1.0 · Local-only wealth tracking
      </p>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5" style={{ color: "var(--fg-muted)" }}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className="relative h-7 w-12 shrink-0 rounded-full transition"
        style={{ background: checked ? "var(--accent)" : "var(--bg-muted)" }}
        onClick={() => onChange(!checked)}
      >
        <span
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition"
          style={{ left: checked ? "1.35rem" : "0.15rem" }}
        />
      </button>
    </div>
  );
}
