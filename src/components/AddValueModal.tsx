"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { convertAmount } from "@/lib/currencies";
import { todayISO } from "@/lib/format";
import { useWorthStore } from "@/lib/store";
import type { Account, AccountValueEntry } from "@/lib/types";

interface AddValueModalProps {
  open: boolean;
  account: Account;
  initial?: AccountValueEntry | null;
  onClose: () => void;
}

export function AddValueModal({
  open,
  account,
  initial = null,
  onClose,
}: AddValueModalProps) {
  if (!open) return null;

  return (
    <AddValueDialog
      key={initial?.id ?? `new-${account.id}-${account.asOfDate}`}
      account={account}
      initial={initial}
      onClose={onClose}
    />
  );
}

function AddValueDialog({
  account,
  initial,
  onClose,
}: {
  account: Account;
  initial: AccountValueEntry | null;
  onClose: () => void;
}) {
  const upsertValueEntry = useWorthStore((s) => s.upsertValueEntry);
  const changeAccountCurrency = useWorthStore((s) => s.changeAccountCurrency);
  const currencies = useWorthStore((s) => s.currencies);

  const [currency, setCurrency] = useState(account.currency);
  const [value, setValue] = useState(String(initial?.value ?? account.currentValue));
  const [asOfDate, setAsOfDate] = useState(initial?.date ?? todayISO());
  const [showDatePicker, setShowDatePicker] = useState(
    Boolean(initial && initial.date !== todayISO()),
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [markOnGraph, setMarkOnGraph] = useState(initial?.markOnGraph ?? true);

  const onCurrencyChange = (nextCode: string) => {
    if (nextCode === currency) return;
    const amount = Number(value);
    if (!Number.isNaN(amount) && amount >= 0) {
      const converted = convertAmount(amount, currency, nextCode, currencies);
      setValue(String(Number(converted.toFixed(2))));
    }
    setCurrency(nextCode);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(value);
    if (Number.isNaN(amount) || amount < 0) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(asOfDate)) return;

    if (currency !== account.currency) {
      changeAccountCurrency(account.id, currency);
    }

    upsertValueEntry({
      entryId: initial?.id,
      accountId: account.id,
      date: asOfDate,
      value: amount,
      note: note.trim() || undefined,
      markOnGraph,
    });
    onClose();
  };

  const dateLabel =
    asOfDate === todayISO()
      ? "Today"
      : new Date(`${asOfDate}T00:00:00`).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-t-3xl p-5 sm:rounded-3xl"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-value-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <h2 id="add-value-title" className="font-display text-lg">
            {initial ? "Edit Value" : "Add Value"}
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="label" htmlFor="entry-value">
              Value
            </label>
            <div className="grid grid-cols-[1fr_6.5rem] gap-2">
              <input
                id="entry-value"
                className="field"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="Enter Value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                autoFocus
              />
              <label className="sr-only" htmlFor="entry-currency">
                Currency
              </label>
              <select
                id="entry-currency"
                className="field px-2"
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value)}
                aria-label="Currency"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol}
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
            {currency !== account.currency && (
              <p className="mt-1.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                Saving sets this account to {currency} and converts existing
                history with your FX rates.
              </p>
            )}
          </div>

          <div
            className="flex items-center justify-between rounded-xl px-3 py-3"
            style={{ background: "var(--bg-muted)" }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--fg-subtle)" }}
              >
                As of
              </p>
              <p className="mt-0.5 font-semibold">{dateLabel}</p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold"
              style={{ color: "var(--accent)" }}
              onClick={() => setShowDatePicker((v) => !v)}
            >
              Change
            </button>
          </div>

          {showDatePicker && (
            <input
              className="field"
              type="date"
              value={asOfDate}
              max={todayISO()}
              onChange={(e) => setAsOfDate(e.target.value)}
              required
            />
          )}

          <div>
            <label className="label" htmlFor="entry-note">
              Note
            </label>
            <div className="relative">
              <input
                id="entry-note"
                className="field pr-14"
                value={note}
                maxLength={60}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional)"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "var(--fg-subtle)" }}
              >
                {note.length}/60
              </span>
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={markOnGraph}
              onChange={(e) => setMarkOnGraph(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Mark on graph
          </label>

          <div className="flex gap-2 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
