"use client";

import { useState } from "react";
import { ASSET_TYPES, LIABILITY_TYPES } from "@/lib/categories";
import { BottomSheet } from "@/components/BottomSheet";
import { todayISO } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";
import { hapticSuccess } from "@/lib/haptic";
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
  const { t } = useI18n();

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
    initial?.asOfDate ?? todayISO(),
  );
  const [institutionName, setInstitutionName] = useState(
    initial?.institutionName ?? "",
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [errors, setErrors] = useState<{ name?: string; value?: string; date?: string }>({});

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
    const nextErrors: typeof errors = {};
    const value = Number(currentValue);
    if (!name.trim()) nextErrors.name = t("accountForm.nameRequired");
    if (Number.isNaN(value) || value < 0) nextErrors.value = t("accountForm.valueRequired");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) nextErrors.date = t("common.invalidDate");
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

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
    hapticSuccess();
    onClose();
  };

  return (
    <BottomSheet
      onClose={onClose}
      onSubmit={submit}
      title={initial ? t("accountForm.editTitle") : t("accountForm.addTitle")}
      titleId="account-form-title"
      headerStart={
        <button
          type="button"
          className="min-h-11 min-w-[4.5rem] rounded-xl px-3 text-sm font-semibold"
          style={{ color: "var(--fg-muted)" }}
          onClick={onClose}
        >
          {t("common.cancel")}
        </button>
      }
      footer={
        <button
          type="submit"
          className="btn-primary min-h-11 w-full justify-center"
        >
          {initial ? t("common.saveChanges") : t("accountForm.addTitle")}
        </button>
      }
    >
        <div className="space-y-4">
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
              {t("accountForm.asset")}
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
              {t("accountForm.liability")}
            </button>
          </div>

          <div>
            <label className="label" htmlFor="account-name">
              {t("accountForm.name")}
            </label>
            <input
              id="account-name"
              className="field"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder={t("accountForm.namePlaceholder")}
              aria-invalid={Boolean(errors.name)}
              required
            />
            {errors.name ? <p className="field-error">{errors.name}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="label" htmlFor="account-category">
                {t("accountForm.category")}
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
            <div className="min-w-0">
              <label className="label" htmlFor="account-currency">
                {t("accountForm.currency")}
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

          {/* Date inputs have a large intrinsic min-width on iOS — keep them
              full-bleed instead of half-width so they cannot spill past the sheet. */}
          <div>
            <label className="label" htmlFor="account-value">
              {t("accountForm.currentValue")}
            </label>
            <input
              id="account-value"
              className="field"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={currentValue}
              onChange={(e) => {
                setCurrentValue(e.target.value);
                if (errors.value) setErrors((prev) => ({ ...prev, value: undefined }));
              }}
              placeholder="0"
              aria-invalid={Boolean(errors.value)}
              required
            />
            {errors.value ? <p className="field-error">{errors.value}</p> : null}
          </div>

          <div className="min-w-0">
            <label className="label" htmlFor="account-asof">
              {t("accountForm.asOfDate")}
            </label>
            <input
              id="account-asof"
              className="field field-date"
              type="date"
              value={asOfDate}
              max={todayISO()}
              onChange={(e) => {
                setAsOfDate(e.target.value);
                if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
              }}
              aria-invalid={Boolean(errors.date)}
              required
            />
            {errors.date ? <p className="field-error">{errors.date}</p> : null}
          </div>
          <p className="-mt-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
            {t("accountForm.asOfHint")}
          </p>

          <div>
            <label className="label" htmlFor="account-institution">
              {t("accountForm.institution")}
            </label>
            <input
              id="account-institution"
              className="field"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder={t("accountForm.optional")}
            />
          </div>

          <div>
            <label className="label" htmlFor="account-note">
              {t("accountForm.note")}
            </label>
            <textarea
              id="account-note"
              className="field min-h-20 resize-y"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("accountForm.optional")}
            />
          </div>
        </div>
    </BottomSheet>
  );
}
