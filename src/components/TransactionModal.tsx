"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { todayISO } from "@/lib/format";
import { ledgerCategoriesFor } from "@/lib/ledger";
import { useWorthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";
import { hapticSuccess } from "@/lib/haptic";
import type { LedgerCategory, Transaction, TransactionType } from "@/lib/types";

interface TransactionModalProps {
  open: boolean;
  initial?: Transaction | null;
  /** Pre-select this account when creating a new entry. */
  defaultAccountId?: string;
  onClose: () => void;
}

export function TransactionModal({
  open,
  initial = null,
  defaultAccountId,
  onClose,
}: TransactionModalProps) {
  if (!open) return null;

  return (
    <TransactionDialog
      key={initial?.id ?? `new-tx-${defaultAccountId ?? "none"}`}
      initial={initial}
      defaultAccountId={defaultAccountId}
      onClose={onClose}
    />
  );
}

function TransactionDialog({
  initial,
  defaultAccountId,
  onClose,
}: {
  initial: Transaction | null;
  defaultAccountId?: string;
  onClose: () => void;
}) {
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const addTransaction = useWorthStore((s) => s.addTransaction);
  const updateTransaction = useWorthStore((s) => s.updateTransaction);
  const { t } = useI18n();

  const presetAccountId = initial?.accountId ?? defaultAccountId ?? "";
  const presetAccount = accounts.find((a) => a.id === presetAccountId);

  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [currency, setCurrency] = useState(
    initial?.currency ?? presetAccount?.currency ?? settings.baseCurrency,
  );
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [category, setCategory] = useState<LedgerCategory>(
    initial?.category ?? (initial?.type === "income" ? "salary" : "food"),
  );
  const [accountId, setAccountId] = useState(presetAccountId);
  const [note, setNote] = useState(initial?.note ?? "");
  const [errors, setErrors] = useState<{ amount?: string; date?: string }>({});

  const categories = ledgerCategoriesFor(type);
  const linkedAccount = accounts.find((a) => a.id === accountId);

  const onTypeChange = (next: TransactionType) => {
    setType(next);
    const nextCats = ledgerCategoriesFor(next);
    if (!nextCats.some((c) => c.value === category)) {
      setCategory(nextCats[0]?.value ?? "other");
    }
  };

  const onAccountChange = (id: string) => {
    setAccountId(id);
    if (id) {
      const acc = accounts.find((a) => a.id === id);
      if (acc) setCurrency(acc.currency);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    const nextErrors: typeof errors = {};
    if (Number.isNaN(value) || value <= 0) nextErrors.amount = t("txForm.amountRequired");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) nextErrors.date = t("common.invalidDate");
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    const payload = {
      type,
      amount: value,
      currency,
      date,
      title: title.trim() || (type === "income" ? "Income" : "Expense"),
      category,
      accountId: accountId || undefined,
      note: note.trim() || undefined,
    };

    if (initial) {
      updateTransaction(initial.id, payload);
    } else {
      addTransaction(payload);
    }
    hapticSuccess();
    onClose();
  };

  return (
    <BottomSheet
      onClose={onClose}
      onSubmit={submit}
      title={initial ? t("txForm.editTitle") : t("txForm.addTitle")}
      titleId="tx-modal-title"
      footer={
        <button type="submit" className="btn-primary min-h-11 w-full justify-center">
          {initial ? t("common.saveChanges") : t("txForm.addTitle")}
        </button>
      }
    >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className="rounded-xl px-3 py-3 text-sm font-semibold capitalize"
                style={{
                  background:
                    type === t
                      ? t === "income"
                        ? "var(--accent-soft)"
                        : "var(--danger-soft)"
                      : "var(--bg-muted)",
                  color:
                    type === t
                      ? t === "income"
                        ? "var(--positive)"
                        : "var(--negative)"
                      : "var(--fg-muted)",
                }}
                onClick={() => onTypeChange(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="tx-title">
              Title
            </label>
            <input
              id="tx-title"
              className="field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "income" ? "Salary, gift…" : "Lunch, rent…"}
              /* Optional — submit() defaults empty titles to Income/Expense.
                 Keeping `required` blocked Save with a silent HTML5 failure. */
            />
          </div>

          <div className="grid grid-cols-[1.4fr_0.8fr] gap-2">
            <div className="min-w-0">
              <label className="label" htmlFor="tx-amount">
                Amount
              </label>
              <input
                id="tx-amount"
                className="field"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                aria-invalid={Boolean(errors.amount)}
                placeholder="0"
                required
              />
              {errors.amount ? <p className="field-error">{errors.amount}</p> : null}
            </div>
            <div className="min-w-0">
              <label className="label" htmlFor="tx-currency">
                Currency
              </label>
              <select
                id="tx-currency"
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

          <div>
            <label className="label" htmlFor="tx-date">
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              className="field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="tx-category">
              Category
            </label>
            <select
              id="tx-category"
              className="field"
              value={category}
              onChange={(e) => setCategory(e.target.value as LedgerCategory)}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="tx-account">
              <span className="inline-flex items-center gap-1.5">
                <Link2 size={14} />
                Link to account
              </span>
            </label>
            <select
              id="tx-account"
              className="field"
              value={accountId}
              onChange={(e) => onAccountChange(e.target.value)}
            >
              <option value="">No link (ledger only)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.isLiability ? " · liability" : ""} · {a.currency}
                </option>
              ))}
            </select>
            {linkedAccount && (
              <p className="mt-1.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                {linkedAccount.isLiability
                  ? type === "expense"
                    ? "Expense increases this debt. Overshoot stays a larger liability."
                    : "Payment reduces debt. Paying past zero turns this into an asset."
                  : type === "income"
                    ? "Income increases this account balance."
                    : "Expense decreases balance. Going past zero turns this into a liability."}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="tx-note">
              Note (optional)
            </label>
            <input
              id="tx-note"
              className="field"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional detail"
            />
          </div>
        </div>
    </BottomSheet>
  );
}
