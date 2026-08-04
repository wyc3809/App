"use client";

import { useState } from "react";
import { convertAmount } from "@/lib/currencies";
import { todayISO } from "@/lib/format";
import {
  combineSignedAmount,
  flipAmountSign,
  splitSignedAmount,
  type AmountSign,
} from "@/lib/signed-amount";
import { BottomSheet } from "@/components/BottomSheet";
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

  const seed = splitSignedAmount(initial?.value ?? account.currentValue);
  const [currency, setCurrency] = useState(account.currency);
  const [magnitude, setMagnitude] = useState(seed.magnitude);
  const [sign, setSign] = useState<AmountSign>(seed.sign);
  const [asOfDate, setAsOfDate] = useState(initial?.date ?? todayISO());
  const [showDatePicker, setShowDatePicker] = useState(
    Boolean(initial && initial.date !== todayISO()),
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [markOnGraph, setMarkOnGraph] = useState(initial?.markOnGraph ?? true);

  const onCurrencyChange = (nextCode: string) => {
    if (nextCode === currency) return;
    const amount = combineSignedAmount(magnitude, sign);
    if (amount !== null) {
      const converted = convertAmount(amount, currency, nextCode, currencies);
      const next = splitSignedAmount(Number(converted.toFixed(2)));
      setMagnitude(next.magnitude);
      setSign(next.sign);
    }
    setCurrency(nextCode);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = combineSignedAmount(magnitude, sign);
    if (amount === null) return;
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

  const isNegative = sign < 0;

  return (
    <form onSubmit={submit}>
      <BottomSheet
        onClose={onClose}
        title={initial ? "Edit Value" : "Add Value"}
        titleId="add-value-title"
        headerStart={
          <button
            type="button"
            className="min-h-11 min-w-[4.5rem] rounded-xl px-3 text-sm font-semibold"
            style={{ color: "var(--fg-muted)" }}
            onClick={onClose}
          >
            Cancel
          </button>
        }
        footer={
          <>
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Save
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="entry-value">
              Value
            </label>
            <div className="grid grid-cols-[3.25rem_1fr_6.5rem] gap-2">
              <button
                type="button"
                className="field flex items-center justify-center px-0 text-lg font-bold tabular-nums"
                style={{
                  color: isNegative ? "var(--danger)" : "var(--positive)",
                  background: isNegative
                    ? "var(--danger-soft)"
                    : "var(--accent-soft)",
                }}
                aria-label={isNegative ? "Negative value" : "Positive value"}
                aria-pressed={isNegative}
                title="Toggle + / −"
                onClick={() => setSign((s) => flipAmountSign(s))}
              >
                {isNegative ? "−" : "+"}
              </button>
              <input
                id="entry-value"
                className="field"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                placeholder="Enter Value"
                value={magnitude}
                onChange={(e) => setMagnitude(e.target.value.replace(/^-/, ""))}
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
            <p className="mt-1.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
              Tap + / − to set a positive or negative balance.
            </p>
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
              className="min-h-11 px-2 text-sm font-semibold"
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

          <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={markOnGraph}
              onChange={(e) => setMarkOnGraph(e.target.checked)}
              className="h-5 w-5 accent-[var(--accent)]"
            />
            Mark on graph
          </label>
        </div>
      </BottomSheet>
    </form>
  );
}
