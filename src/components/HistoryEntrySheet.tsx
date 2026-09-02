"use client";

import { Pencil, Receipt, Trash2 } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { formatMoney, formatPercent } from "@/lib/format";
import { ledgerCategoryLabel } from "@/lib/ledger";
import type { Account, Currency, Transaction, UserSettings } from "@/lib/types";
import type { ValueHistoryPoint } from "@/lib/account-history";

interface HistoryEntrySheetProps {
  open: boolean;
  account: Account;
  point: ValueHistoryPoint;
  linkedTx: Transaction | null;
  currencies: Currency[];
  settings: UserSettings;
  canDelete: boolean;
  onClose: () => void;
  onEditLedger: (tx: Transaction) => void;
  onDeleteLedger: (tx: Transaction) => void;
  onEditValue: () => void;
  onDeleteValue: () => void;
}

export function HistoryEntrySheet({
  open,
  account,
  point,
  linkedTx,
  currencies,
  settings,
  canDelete,
  onClose,
  onEditLedger,
  onDeleteLedger,
  onEditValue,
  onDeleteValue,
}: HistoryEntrySheetProps) {
  if (!open) return null;

  const pointSigned = point.signedValue;
  const showSign = pointSigned < 0;
  const good = account.isLiability
    ? (point.changeAbsolute ?? 0) <= 0
    : (point.changeAbsolute ?? 0) >= 0;

  return (
    <BottomSheet onClose={onClose} title="History" titleId="history-entry-title">
      <div className="space-y-4">
        <section
          className="rounded-2xl p-4"
          style={{ background: "var(--bg-muted)" }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--fg-subtle)" }}
          >
            Balance on {point.label}
          </p>
          <p
            className="mt-1 font-display text-2xl tabular-nums"
            style={{
              color: account.isLiability ? "var(--negative)" : "var(--fg)",
            }}
          >
            {formatMoney(pointSigned, account.currency, currencies, {
              privacy: settings.isPrivacyMode,
              showSign,
            })}
          </p>
          {point.changeAbsolute != null && (
            <p
              className="mt-1 text-sm font-semibold tabular-nums"
              style={{ color: good ? "var(--positive)" : "var(--negative)" }}
            >
              {settings.isPrivacyMode
                ? "••••"
                : `${
                    point.changePercent != null
                      ? `${formatPercent(Math.abs(point.changePercent)).replace("+", "")} `
                      : ""
                  }${good ? "↑" : "↓"} ${formatMoney(
                    Math.abs(point.changeAbsolute),
                    account.currency,
                    currencies,
                    { compact: true },
                  )}`}
            </p>
          )}
          {point.note && !linkedTx && (
            <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
              {point.note}
            </p>
          )}
        </section>

        {linkedTx ? (
          <section
            className="rounded-2xl border p-4"
            style={{ borderColor: "var(--accent)", background: "var(--accent-soft)" }}
          >
            <p
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: "var(--accent)" }}
            >
              <Receipt size={12} />
              Linked ledger
            </p>
            <p className="mt-2 text-lg font-semibold">{linkedTx.title}</p>
            <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
              {linkedTx.type === "income" ? "Income" : "Expense"}
              {" · "}
              {ledgerCategoryLabel(linkedTx.category)}
              {" · "}
              {linkedTx.date}
            </p>
            <p
              className="mt-2 text-base font-semibold tabular-nums"
              style={{
                color:
                  linkedTx.type === "income"
                    ? "var(--positive)"
                    : "var(--negative)",
              }}
            >
              {settings.isPrivacyMode
                ? "••••"
                : formatMoney(
                    linkedTx.type === "income"
                      ? linkedTx.amount
                      : -linkedTx.amount,
                    linkedTx.currency,
                    currencies,
                    { showSign: true },
                  )}
            </p>
            {linkedTx.note && (
              <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
                {linkedTx.note}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => onEditLedger(linkedTx)}
              >
                <Pencil size={16} />
                Edit ledger
              </button>
              {canDelete && (
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  style={{ color: "var(--danger)" }}
                  onClick={() => onDeleteLedger(linkedTx)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          </section>
        ) : (
          <section
            className="rounded-2xl p-4"
            style={{ background: "var(--bg-muted)" }}
          >
            <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
              No ledger linked to this history row. This is a manual balance
              update.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={onEditValue}
              >
                <Pencil size={16} />
                Edit value
              </button>
              {canDelete && (
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  style={{ color: "var(--danger)" }}
                  onClick={onDeleteValue}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </BottomSheet>
  );
}
