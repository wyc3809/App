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
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { formatLastBackupLabel } from "@/lib/backup-meta";
import { readBackupFile, type WorthBackupPayload } from "@/lib/import-backup";
import {
  CSV_ACCOUNT_TEMPLATE,
  CSV_LEDGER_TEMPLATE,
  readCsvFile,
  type CsvAccountRow,
  type CsvTransactionRow,
} from "@/lib/import-csv";
import { useWorthStore } from "@/lib/store";
import type { UserSettings } from "@/lib/types";

type PendingConfirm =
  | { kind: "demo" }
  | { kind: "reset" }
  | {
      kind: "import-json";
      data: WorthBackupPayload;
      summary: string;
    }
  | {
      kind: "import-csv";
      accounts: CsvAccountRow[];
      transactions: CsvTransactionRow[];
      resultKind: "accounts" | "ledger";
      skipped: number;
      summary: string;
    };

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
  const markBackupNow = useWorthStore((s) => s.markBackupNow);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [pending, setPending] = useState<PendingConfirm | null>(null);

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
    markBackupNow();
    setImportMessage("Backup downloaded. Last backup time updated.");
    setImportError(null);
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

    const summary = `Import ${result.data.accounts.length} accounts, ${result.data.snapshots.length} snapshots, and ${result.data.transactions?.length ?? 0} ledger entries? This replaces your current local data.`;
    setPending({ kind: "import-json", data: result.data, summary });
    setImporting(false);
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

    const summary =
      result.kind === "accounts"
        ? `Import ${result.accounts.length} account(s) from CSV? Existing accounts with the same name are skipped (merge).`
        : `Import ${result.transactions.length} ledger row(s) from CSV? Rows are added to your current ledger. Account names are linked when they match.`;
    setPending({
      kind: "import-csv",
      accounts: result.accounts,
      transactions: result.transactions,
      resultKind: result.kind === "accounts" ? "accounts" : "ledger",
      skipped: result.skipped,
      summary,
    });
    setImporting(false);
  };

  const runPending = () => {
    if (!pending) return;
    if (pending.kind === "demo") {
      loadDemoData();
      setImportMessage("Demo portfolio loaded.");
    } else if (pending.kind === "reset") {
      resetAll();
      setImportMessage("All local data cleared.");
    } else if (pending.kind === "import-json") {
      importBackup(pending.data);
      setImportMessage(
        `Imported ${pending.data.accounts.length} accounts, ${pending.data.snapshots.length} snapshots, and ${pending.data.transactions?.length ?? 0} ledger entries.`,
      );
      if (jsonInputRef.current) jsonInputRef.current.value = "";
    } else if (pending.kind === "import-csv") {
      const { accountsAdded, transactionsAdded } = importCsvData({
        accounts: pending.accounts,
        transactions: pending.transactions,
      });
      const skipNote =
        pending.skipped > 0 ? ` · ${pending.skipped} row(s) skipped` : "";
      setImportMessage(
        pending.resultKind === "accounts"
          ? `Added ${accountsAdded} account(s) from CSV${skipNote}.`
          : `Added ${transactionsAdded} ledger entr${transactionsAdded === 1 ? "y" : "ies"} from CSV${skipNote}.`,
      );
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
    setImportError(null);
    setPending(null);
  };

  const confirmCopy = (() => {
    if (!pending) {
      return { title: "", message: "", confirmLabel: "Confirm", danger: false };
    }
    if (pending.kind === "demo") {
      return {
        title: "Load demo portfolio?",
        message: "Demo data replaces your current local data.",
        confirmLabel: "Load demo",
        danger: false,
      };
    }
    if (pending.kind === "reset") {
      return {
        title: "Reset all data?",
        message:
          "Delete all accounts, ledger entries, snapshots, and reset settings on this device.",
        confirmLabel: "Reset everything",
        danger: true,
      };
    }
    if (pending.kind === "import-json") {
      return {
        title: "Import JSON backup?",
        message: pending.summary,
        confirmLabel: "Import & replace",
        danger: true,
      };
    }
    return {
      title: "Import CSV?",
      message: pending.summary,
      confirmLabel: "Import",
      danger: false,
    };
  })();

  const themes: { value: UserSettings["theme"]; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="space-y-4 pb-4">
      <ConfirmSheet
        open={pending !== null}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirmLabel}
        danger={confirmCopy.danger}
        onConfirm={runPending}
        onClose={() => {
          setPending(null);
          if (jsonInputRef.current) jsonInputRef.current.value = "";
          if (csvInputRef.current) csvInputRef.current.value = "";
        }}
      />

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
        <div
          className="rounded-xl px-3 py-2.5 text-sm"
          style={{ background: "var(--bg-muted)" }}
        >
          <p className="font-semibold" style={{ color: "var(--fg)" }}>
            Last backup
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--fg-muted)" }}>
            {formatLastBackupLabel(settings.lastBackupAt)}
            {settings.lastBackupAt
              ? ` · ${new Date(settings.lastBackupAt).toLocaleString()}`
              : ""}
          </p>
        </div>

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
          onClick={() => setPending({ kind: "demo" })}
        >
          <Sparkles size={18} />
          Load demo portfolio
        </button>

        <button
          type="button"
          className="btn-secondary w-full"
          style={{ color: "var(--danger)" }}
          onClick={() => setPending({ kind: "reset" })}
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
