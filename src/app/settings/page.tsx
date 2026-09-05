"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Download,
  Eraser,
  FileSpreadsheet,
  Fingerprint,
  Info,
  Moon,
  Monitor,
  Receipt,
  Shield,
  Sparkles,
  Sun,
  TrendingUp,
  Upload,
} from "lucide-react";
import { ConfirmSheet } from "@/components/ConfirmSheet";
import { SegmentControl } from "@/components/ui/SegmentControl";
import { formatLastBackupLabel } from "@/lib/backup-meta";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n";
import { exportTextFile } from "@/lib/backup-export";
import {
  authenticateBiometric,
  getBiometricAvailability,
  type BiometricAvailability,
} from "@/lib/biometric";
import { isNativePlatform } from "@/lib/platform";
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
  const { t, locale, setLocale } = useI18n();
  const settings = useWorthStore((s) => s.settings);
  const currencies = useWorthStore((s) => s.currencies);
  const accounts = useWorthStore((s) => s.accounts);
  const snapshots = useWorthStore((s) => s.snapshots);
  const valueEntries = useWorthStore((s) => s.valueEntries);
  const transactions = useWorthStore((s) => s.transactions);
  const updateSettings = useWorthStore((s) => s.updateSettings);
  const updateCurrencyRate = useWorthStore((s) => s.updateCurrencyRate);
  const setBaseCurrency = useWorthStore((s) => s.setBaseCurrency);
  const resetAll = useWorthStore((s) => s.resetAll);
  const importBackup = useWorthStore((s) => s.importBackup);
  const importCsvData = useWorthStore((s) => s.importCsvData);
  const markBackupNow = useWorthStore((s) => s.markBackupNow);
  const requestWrappedReport = useWorthStore((s) => s.requestWrappedReport);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [rateErrors, setRateErrors] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [bioAvail, setBioAvail] = useState<BiometricAvailability | null>(null);
  const [bioBusy, setBioBusy] = useState(false);

  useEffect(() => {
    void getBiometricAvailability().then(setBioAvail);
  }, []);

  const exportText = async (filename: string, content: string, mime: string) => {
    const result = await exportTextFile({ filename, content, mime });
    if (!result.ok) {
      setImportError(result.error);
      setImportMessage(null);
      return false;
    }
    return true;
  };

  const exportJson = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      currencies,
      accounts,
      snapshots,
      valueEntries,
      transactions,
    };
    const filename = `worthbook-export-${new Date().toISOString().slice(0, 10)}.json`;
    const ok = await exportText(
      filename,
      JSON.stringify(payload, null, 2),
      "application/json",
    );
    if (!ok) return;
    markBackupNow();
    setImportMessage(
      isNativePlatform()
        ? "Backup shared. Last backup time updated."
        : "Backup downloaded. Last backup time updated.",
    );
    setImportError(null);
  };

  const onBiometricToggle = async (next: boolean) => {
    if (!next) {
      updateSettings({ isBiometricEnabled: false });
      return;
    }
    setBioBusy(true);
    const avail = bioAvail ?? (await getBiometricAvailability());
    setBioAvail(avail);
    if (!avail.available) {
      setImportError(avail.reason);
      setBioBusy(false);
      return;
    }
    const ok = await authenticateBiometric(`Enable ${avail.biometryType} lock`);
    setBioBusy(false);
    if (!ok) {
      setImportError("Biometric verification failed. Lock was not enabled.");
      return;
    }
    updateSettings({ isBiometricEnabled: true });
    setImportMessage(`${avail.biometryType} lock enabled.`);
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
    if (pending.kind === "reset") {
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

  const themeValue: "light" | "dark" | "system" =
    settings.theme === "dark"
      ? "dark"
      : settings.theme === "system"
        ? "system"
        : "light";

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
          {t("settings.eyebrow")}
        </p>
        <h1 className="mt-1 font-display text-3xl">{t("settings.title")}</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          {t("settings.subtitle")}
        </p>
      </header>

      <section className="card-surface animate-fade-up space-y-4 p-4">
        <h2 className="font-display text-lg">{t("settings.display")}</h2>

        <div>
          <p className="label">{t("settings.language")}</p>
          <SegmentControl
            value={locale}
            options={[
              { value: "en" as Locale, label: t("settings.languageEn") },
              { value: "zh-Hant" as Locale, label: t("settings.languageZhHant") },
              { value: "zh-Hans" as Locale, label: t("settings.languageZhHans") },
            ]}
            onChange={setLocale}
          />
        </div>

        <div>
          <p className="label">{t("settings.theme")}</p>
          <SegmentControl
            value={themeValue}
            options={[
              { value: "light", label: t("settings.themeLight") },
              { value: "dark", label: t("settings.themeDark") },
              { value: "system", label: t("settings.themeSystem") },
            ]}
            onChange={(value) =>
              updateSettings({ theme: value as UserSettings["theme"] })
            }
          />
          <p className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
            {themeValue === "light" ? (
              <Sun size={14} />
            ) : themeValue === "dark" ? (
              <Moon size={14} />
            ) : (
              <Monitor size={14} />
            )}
            {themeValue === "light"
              ? t("settings.themeLightHint")
              : themeValue === "dark"
                ? t("settings.themeDarkHint")
                : t("settings.themeSystemHint")}
          </p>
        </div>

        <ToggleRow
          icon={<Shield size={18} />}
          title={t("settings.privacyTitle")}
          description={t("settings.privacyDesc")}
          checked={settings.isPrivacyMode}
          onChange={(v) => updateSettings({ isPrivacyMode: v })}
        />

        <ToggleRow
          icon={<Fingerprint size={18} />}
          title="Biometric lock"
          description={
            bioAvail?.available
              ? `Require ${bioAvail.biometryType} when opening WorthBook`
              : bioAvail
                ? bioAvail.reason
                : "Checking device support…"
          }
          checked={settings.isBiometricEnabled}
          disabled={bioBusy || (bioAvail !== null && !bioAvail.available)}
          onChange={(v) => void onBiometricToggle(v)}
        />
      </section>

      <section className="card-surface animate-fade-up-delay space-y-3 p-4">
        <h2 className="font-display text-lg">{t("settings.reportsTitle")}</h2>
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          {t("settings.reportsDesc")}
        </p>
        <button
          type="button"
          className="btn-secondary w-full justify-start"
          onClick={() => requestWrappedReport()}
        >
          <Sparkles size={18} />
          {t("settings.viewRecap")}
        </button>
        <ToggleRow
          icon={<Receipt size={18} />}
          title={t("settings.weeklyNotifications")}
          description={t("settings.weeklyNotificationsDesc")}
          checked={settings.weeklyReportNotifications ?? true}
          onChange={(v) => updateSettings({ weeklyReportNotifications: v })}
        />
        <ToggleRow
          icon={<TrendingUp size={18} />}
          title={t("settings.monthlyNotifications")}
          description={t("settings.monthlyNotificationsDesc")}
          checked={settings.monthlyReportNotifications ?? true}
          onChange={(v) => updateSettings({ monthlyReportNotifications: v })}
        />
        <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
          {t("settings.reportsNativeHint")}
        </p>
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
                <li key={c.code}>
                  <div className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-sm font-semibold">{c.code}</span>
                    <input
                      className="field flex-1"
                      type="number"
                      min="0"
                      step="any"
                      value={c.exchangeRateToBase}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        if (Number.isNaN(rate) || rate <= 0) {
                          setRateErrors((prev) => ({
                            ...prev,
                            [c.code]: t("settings.rateInvalid"),
                          }));
                          return;
                        }
                        setRateErrors((prev) => {
                          const next = { ...prev };
                          delete next[c.code];
                          return next;
                        });
                        updateCurrencyRate(c.code, rate);
                      }}
                      aria-invalid={Boolean(rateErrors[c.code])}
                      aria-label={`${c.code} exchange rate`}
                    />
                  </div>
                  {rateErrors[c.code] ? (
                    <p className="field-error ml-[3.75rem]">{rateErrors[c.code]}</p>
                  ) : null}
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

        <button type="button" className="btn-secondary w-full" onClick={() => void exportJson()}>
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
              void exportText(
                "worthbook-accounts-template.csv",
                CSV_ACCOUNT_TEMPLATE,
                "text/csv",
              )
            }
          >
            Accounts CSV template
          </button>
          <button
            type="button"
            className="btn-ghost justify-center text-xs"
            onClick={() =>
              void exportText(
                "worthbook-ledger-template.csv",
                CSV_LEDGER_TEMPLATE,
                "text/csv",
              )
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
          style={{ color: "var(--danger)" }}
          onClick={() => setPending({ kind: "reset" })}
        >
          <Eraser size={18} />
          Reset all data
        </button>
      </section>

      <p className="px-1 pb-2 text-center text-xs" style={{ color: "var(--fg-subtle)" }}>
        WorthBook v1.2 · Local-only wealth tracking
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
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3${disabled ? " opacity-60" : ""}`}>
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
        aria-label={title}
        disabled={disabled}
        className="relative h-7 w-12 shrink-0 rounded-full transition"
        style={{ background: checked ? "var(--accent)" : "var(--bg-muted)" }}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
      >
        <span
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition"
          style={{ left: checked ? "1.35rem" : "0.15rem" }}
        />
      </button>
    </div>
  );
}
