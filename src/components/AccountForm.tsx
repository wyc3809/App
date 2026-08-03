"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ASSET_TYPES, LIABILITY_TYPES } from "@/lib/categories";
import { useWorthStore } from "@/lib/store";
import type { Account, AccountCategory } from "@/lib/types";

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  initial?: Account | null;
  defaultLiability?: boolean;
}

export function AccountForm({
  open,
  onClose,
  initial,
  defaultLiability = false,
}: AccountFormProps) {
  if (!open) return null;

  return (
    <AccountFormDialog
      key={initial?.id ?? `new-${defaultLiability ? "liability" : "asset"}`}
      onClose={onClose}
      initial={initial}
      defaultLiability={defaultLiability}
    />
  );
}

function AccountFormDialog({
  onClose,
  initial,
  defaultLiability,
}: {
  onClose: () => void;
  initial?: Account | null;
  defaultLiability: boolean;
}) {
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const addAccount = useWorthStore((s) => s.addAccount);
  const updateAccount = useWorthStore((s) => s.updateAccount);

  const [isLiability, setIsLiability] = useState(
    initial?.isLiability ?? defaultLiability,
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<AccountCategory>(
    initial?.category ?? (defaultLiability ? "loan" : "cash"),
  );
  const [currency, setCurrency] = useState(
    initial?.currency ?? settings.baseCurrency,
  );
  const [currentValue, setCurrentValue] = useState(
    initial ? String(initial.currentValue) : "",
  );
  const [asOfDate, setAsOfDate] = useState(
    initial?.asOfDate ?? new Date().toISOString().slice(0, 10),
  );
  const [institutionName, setInstitutionName] = useState(
    initial?.institutionName ?? "",
  );
  const [note, setNote] = useState(initial?.note ?? "");

  const categories = isLiability ? LIABILITY_TYPES : ASSET_TYPES;
  const resolvedCategory = categories.some((t) => t.value === category)
    ? category
    : categories[0].value;

  const setLiabilityMode = (next: boolean) => {
    setIsLiability(next);
    const types = next ? LIABILITY_TYPES : ASSET_TYPES;
    if (!types.some((t) => t.value === category)) {
      setCategory(types[0].value);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(currentValue);
    if (!name.trim() || Number.isNaN(value) || value < 0) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) return;

    const payload = {
      name: name.trim(),
      category: resolvedCategory,
      isLiability,
      currency,
      currentValue: value,
      asOfDate,
      institutionName: institutionName.trim() || undefined,
      note: note.trim() || undefined,
    };

    if (initial) updateAccount(initial.id, payload);
    else addAccount(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-form-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="account-form-title" className="font-display text-xl">
            {initial ? "Edit Account" : "Add Account"}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-xl px-3 py-3 text-sm font-semibold"
              style={{
                background: !isLiability ? "var(--accent-soft)" : "var(--bg-muted)",
                color: !isLiability ? "var(--accent)" : "var(--fg-muted)",
              }}
              onClick={() => setLiabilityMode(false)}
            >
              Asset
            </button>
            <button
              type="button"
              className="rounded-xl px-3 py-3 text-sm font-semibold"
              style={{
                background: isLiability ? "var(--danger-soft)" : "var(--bg-muted)",
                color: isLiability ? "var(--danger)" : "var(--fg-muted)",
              }}
              onClick={() => setLiabilityMode(true)}
            >
              Liability
            </button>
          </div>

          <div>
            <label className="label" htmlFor="account-name">
              Name
            </label>
            <input
              id="account-name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HSBC Savings"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="account-category">
                Category
              </label>
              <select
                id="account-category"
                className="field"
                value={resolvedCategory}
                onChange={(e) => setCategory(e.target.value as AccountCategory)}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="account-currency">
                Currency
              </label>
              <select
                id="account-currency"
                className="field"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="account-value">
                Current Value
              </label>
              <input
                id="account-value"
                className="field"
                type="number"
                min="0"
                step="any"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="account-asof">
                日期 / As of
              </label>
              <input
                id="account-asof"
                className="field"
                type="date"
                value={asOfDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setAsOfDate(e.target.value)}
                required
              />
            </div>
          </div>
          <p className="-mt-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
            此金額對應的日期；儲存後會更新該日淨資產紀錄。
          </p>

          <div>
            <label className="label" htmlFor="account-institution">
              Institution
            </label>
            <input
              id="account-institution"
              className="field"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="label" htmlFor="account-note">
              Note
            </label>
            <textarea
              id="account-note"
              className="field min-h-20 resize-y"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <button type="submit" className="btn-primary w-full">
            {initial ? "Save Changes" : "Add Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
