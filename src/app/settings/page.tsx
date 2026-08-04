"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  Download,
  Eraser,
  FileSpreadsheet,
  Fingerprint,
  Info,
  Moon,
  Monitor,
  Shield,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import { readBackupFile } from "@/lib/import-backup";
import {
  CSV_ACCOUNT_TEMPLATE,
  CSV_LEDGER_TEMPLATE,
  readCsvFile,
} from "@/lib/import-csv";
import { useWorthStore } from "@/lib/store";
import type { UserSettings } from "@/lib/types";

export default function SettingsPage() {
  const settings = useWorthStore((s) => s.settings);
  const currencies = useWorthStore((s) => s.currencies);
  const accounts = useWorthStore((s) => s.accounts);
  const snapshots = useWorthStore((s) => s.snapshots);
  const valueEntries = useWorthStore((s) => s.valueEntries);
  const transactions = useWorthStore((s) => s.transactions);
  const updateSettings = useWorthStore((s) => s.updateSettings);
  const updateCurrencyRate = useWorthStore((s) => s.updateCurrencyRate);
  const setBaseCurrency = useWorthStore((s) => s.setBaseCurrency);
  const loadDemoData = useWorthStore((s) => s.loadDemoData);
  const resetAll = useWorthStore((s) => s.resetAll);
  const importBackup = useWorthStore((s) => s.importBackup);
  const importCsvData = useWorthStore((s) => s.importCsvData);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const downloadText = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      currencies,
      accounts,
      snapshots,
      valueEntries,
      transactions,
    };
    downloadText(
      `worthbook-export-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(payload, null, 2),
      "application/json",
    );
  };

  const onImportJson = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    setImportError(null);

    const result = await readBackupFile(file);
    if (!result.ok) {
      setImportError(result.error);
      setImporting(false);
      return;
    }

    const replace = confirm(
      `Import ${result.data.accounts.length} accounts, ${result.data.snapshots.length} snapshots, and ${result.data.transactions?.length ?? 0} ledger entries?\n\nThis replaces your current local data.`,
    );
    if (!replace) {
      setImporting(false);
      return;
    }

    importBackup(result.data);
    setImportMessage(
      `Imported ${result.data.accounts.length} accounts, ${result.data.snapshots.length} snapshots, and ${result.data.transactions?.length ?? 0} ledger entries.`,
    );
    setImporting(false);
    if (jsonInputRef.current) jsonInputRef.current.value = "";
  };

  const onImportCsv = async (file: File | null) => {
    if (!file) return;
    setImporting(true);
    setImportMessage(null);
    setImportError(null);

    const result = await readCsvFile(file);
    if (!result.ok) {
      setImportError(result.error);
      setImporting(false);
      return;
    }

    const ok = confirm(
      result.kind === "accounts"
        ? `Import ${result.accounts.length} account(s) from CSV?\n\nExisting accounts with the same name are skipped (merge).`
        : `Import ${result.transactions.length} ledger row(s) from CSV?\n\nRows are added to your current ledger. Account names are linked when they match.`,
    );
    if (!ok) {
      setImporting(false);
      return;
    }

    const { accountsAdded, transactionsAdded } = importCsvData({
      accounts: result.accounts,
      transactions: result.transactions,
    });
    const skipNote =
      result.skipped > 0 ? ` · ${result.skipped} row(s) skipped` : "";
    setImportMessage(
      result.kind === "accounts"
        ? `Added ${accountsAdded} account(s) from CSV${skipNote}.`
        : `Added ${transactionsAdded} ledger entr${transactionsAdded === 1 ? "y" : "ies"} from CSV${skipNote}.`,
    );
    setImporting(false);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const themes: { value: UserSettings["theme"]; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-4 pb-4">
      <header className="animate-fade-up">
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--fg-subtle)" }}
        >
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
          description="Saved as a preference only — device Face ID / Touch ID unlock ships with the iOS app build"
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
        <h2 className="font-display text-lg">Privacy & data</h2>
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Portfolio data stays in this browser. Use export before clearing site
          data or switching devices.
        </p>
        <Link href="/privacy/" className="btn-secondary w-full">
          <Info size={18} />
          Privacy policy
        </Link>
      </section>

      <section className="card-surface animate-fade-up-delay-2 space-y-3 p-4">
        <h2 className="font-display text-lg">Backup</h2>

        <button type="button" className="btn-secondary w-full" onClick={exportJson}>
          <Download size={18} />
          Export JSON backup
        </button>

        <input
          ref={jsonInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onImportJson(e.target.files?.[0] ?? null)}
        />

        <button
          type="button"
          className="btn-secondary w-full"
          disabled={importing}
          onClick={() => jsonInputRef.current?.click()}
        >
          <Upload size={18} />
          {importing ? "Importing…" : "Import JSON backup"}
        </button>

        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => void onImportCsv(e.target.files?.[0] ?? null)}
        />

        <button
          type="button"
          className="btn-secondary w-full"
          disabled={importing}
          onClick={() => csvInputRef.current?.click()}
        >
          <FileSpreadsheet size={18} />
          {importing ? "Importing…" : "Import CSV"}
        </button>

        <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
          CSV merges into current data. Use accounts columns (
          <code className="text-[11px]">name, type, category, currency, value</code>
          ) or ledger columns (
          <code className="text-[11px]">date, type, amount, title, category, account</code>
          ).
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="btn-ghost justify-center text-xs"
            onClick={() =>
              downloadText("worthbook-accounts-template.csv", CSV_ACCOUNT_TEMPLATE, "text/csv")
            }
          >
            Accounts CSV template
          </button>
          <button
            type="button"
            className="btn-ghost justify-center text-xs"
            onClick={() =>
              downloadText("worthbook-ledger-template.csv", CSV_LEDGER_TEMPLATE, "text/csv")
            }
          >
            Ledger CSV template
          </button>
        </div>

        {importMessage && (
          <p className="text-sm font-medium" style={{ color: "var(--positive)" }}>
            {importMessage}
          </p>
        )}
        {importError && (
          <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>
            {importError}
          </p>
        )}

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
            if (confirm("Delete all accounts, ledger entries, snapshots, and reset settings?")) resetAll();
          }}
        >
          <Eraser size={18} />
          Reset all data
        </button>
      </section>

      <p className="px-1 pb-2 text-center text-xs" style={{ color: "var(--fg-subtle)" }}>
        WorthBook v1.1 · Local-only wealth tracking
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
