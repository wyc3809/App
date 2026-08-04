"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Briefcase,
  Bus,
  Calendar,
  Clapperboard,
  Delete,
  Gift,
  HeartPulse,
  Home,
  Link2,
  PiggyBank,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  Zap,
} from "lucide-react";
import {
  appendKey,
  appendOperator,
  backspace,
  evaluateExpression,
  formatKeypadDisplay,
} from "@/lib/keypad";
import { todayISO } from "@/lib/format";
import { ledgerCategoriesFor } from "@/lib/ledger";
import { useWorthStore } from "@/lib/store";
import type { LedgerCategory, TransactionType } from "@/lib/types";

type EntryMode = TransactionType; // expense | income

const CATEGORY_META: Record<
  LedgerCategory,
  { icon: typeof UtensilsCrossed; tint: string; short: string }
> = {
  food: { icon: UtensilsCrossed, tint: "#f59e0b", short: "Food" },
  transport: { icon: Bus, tint: "#3b82f6", short: "Transport" },
  housing: { icon: Home, tint: "#8b5cf6", short: "Housing" },
  shopping: { icon: ShoppingBag, tint: "#ec4899", short: "Shopping" },
  entertainment: { icon: Clapperboard, tint: "#ef4444", short: "Fun" },
  health: { icon: HeartPulse, tint: "#10b981", short: "Health" },
  utilities: { icon: Zap, tint: "#06b6d4", short: "Utilities" },
  salary: { icon: Briefcase, tint: "#0f7a4c", short: "Salary" },
  bonus: { icon: Sparkles, tint: "#f59e0b", short: "Bonus" },
  investment_return: { icon: PiggyBank, tint: "#3b82f6", short: "Invest" },
  gift: { icon: Gift, tint: "#ec4899", short: "Gift" },
  transfer: { icon: Wallet, tint: "#64748b", short: "Transfer" },
  other: { icon: Sparkles, tint: "#94a3b8", short: "Other" },
};

const NUM_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "00"] as const;

export function LedgerQuickEntry() {
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const addTransaction = useWorthStore((s) => s.addTransaction);

  const [type, setType] = useState<EntryMode>("expense");
  const [category, setCategory] = useState<LedgerCategory>("food");
  const [expr, setExpr] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [accountId, setAccountId] = useState("");
  const [includeInStats, setIncludeInStats] = useState(true);
  const [pickingAccount, setPickingAccount] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const categories = ledgerCategoriesFor(type);
  const linkedAccount = accounts.find((a) => a.id === accountId);
  const currency =
    linkedAccount?.currency ?? settings.baseCurrency;
  const currencyMeta = currencies.find((c) => c.code === currency);
  const symbol = currencyMeta?.symbol ?? currency;

  const amountValue = useMemo(() => evaluateExpression(expr), [expr]);

  const onTypeChange = (next: EntryMode) => {
    setType(next);
    const nextCats = ledgerCategoriesFor(next);
    if (!nextCats.some((c) => c.value === category)) {
      setCategory(nextCats[0]?.value ?? "other");
    }
  };

  const onAccountPick = (id: string) => {
    setAccountId(id);
    setPickingAccount(false);
  };

  const resetForm = () => {
    setExpr("");
    setNote("");
    setFlash(null);
  };

  const submit = () => {
    const value = amountValue;
    if (value === null || value <= 0) {
      setFlash("Enter an amount");
      return;
    }

    const catLabel =
      CATEGORY_META[category]?.short ??
      categories.find((c) => c.value === category)?.label ??
      (type === "income" ? "Income" : "Expense");

    addTransaction({
      type,
      amount: value,
      currency,
      date,
      title: note.trim() || catLabel,
      category,
      accountId: accountId || undefined,
      note: note.trim() || undefined,
    });

    setFlash("Saved");
    resetForm();
    window.setTimeout(() => setFlash(null), 1200);
  };

  const timeLabel = useMemo(() => {
    try {
      return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
  }, [date]);

  return (
    <section
      className="overflow-hidden rounded-[1.5rem] animate-fade-up"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
      aria-label="Quick ledger entry"
    >
      {/* Type tabs */}
      <div className="px-3 pt-3">
        <div
          className="grid grid-cols-2 gap-1 rounded-2xl p-1"
          style={{ background: "var(--bg-muted)" }}
          role="tablist"
          aria-label="Entry type"
        >
          {([
            ["expense", "Expense"],
            ["income", "Income"],
          ] as const).map(([value, label]) => {
            const active = type === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold transition"
                style={{
                  background: active
                    ? value === "income"
                      ? "var(--accent)"
                      : "color-mix(in srgb, var(--accent) 82%, #1a3a2a)"
                    : "transparent",
                  color: active ? "#04140c" : "var(--fg-muted)",
                }}
                onClick={() => onTypeChange(value)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category grid */}
      <div className="px-3 pt-3 pb-2">
        <div className="grid grid-cols-4 gap-2">
          {categories.map((c) => {
            const meta = CATEGORY_META[c.value];
            const Icon = meta.icon;
            const selected = category === c.value;
            return (
              <button
                key={c.value}
                type="button"
                className="flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 transition"
                style={{
                  background: selected
                    ? "color-mix(in srgb, var(--accent-soft) 70%, transparent)"
                    : "transparent",
                  outline: selected
                    ? "1.5px solid color-mix(in srgb, var(--accent) 55%, transparent)"
                    : "1.5px solid transparent",
                }}
                onClick={() => setCategory(c.value)}
                aria-pressed={selected}
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background: `color-mix(in srgb, ${meta.tint} 18%, var(--bg-muted))`,
                    color: meta.tint,
                  }}
                >
                  <Icon size={22} strokeWidth={2.1} />
                </span>
                <span
                  className="max-w-full truncate text-[11px] font-medium"
                  style={{ color: "var(--fg-muted)" }}
                >
                  {meta.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-2 px-3 pb-2">
        <label
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: "var(--bg-muted)", color: "var(--fg-muted)" }}
        >
          <Calendar size={13} />
          {timeLabel}
          <input
            type="date"
            className="sr-only"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Entry date"
          />
        </label>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{
            background: accountId ? "var(--accent-soft)" : "var(--bg-muted)",
            color: accountId ? "var(--accent)" : "var(--fg-muted)",
          }}
          onClick={() => setPickingAccount((v) => !v)}
        >
          <Link2 size={13} />
          {linkedAccount?.name ?? "Account"}
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{
            background: includeInStats ? "var(--accent-soft)" : "var(--bg-muted)",
            color: includeInStats ? "var(--accent)" : "var(--fg-muted)",
          }}
          onClick={() => setIncludeInStats((v) => !v)}
          aria-pressed={includeInStats}
        >
          Stats {includeInStats ? "On" : "Off"}
        </button>
      </div>

      {pickingAccount && (
        <div className="mx-3 mb-2 max-h-36 overflow-y-auto rounded-2xl p-2" style={{ background: "var(--bg-muted)" }}>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold"
            style={{ color: "var(--fg-muted)" }}
            onClick={() => onAccountPick("")}
          >
            No link (ledger only)
          </button>
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold"
              style={{
                background:
                  accountId === a.id ? "var(--bg-elevated)" : "transparent",
                color: "var(--fg)",
              }}
              onClick={() => onAccountPick(a.id)}
            >
              {a.name}
              {a.isLiability ? " · liability" : ""} · {a.currency}
            </button>
          ))}
        </div>
      )}

      {/* Note + amount bar */}
      <div className="px-3 pb-2">
        <div
          className="flex items-center gap-2 rounded-2xl px-3 py-3"
          style={{ background: "var(--bg-muted)" }}
        >
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--fg)" }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note…"
            aria-label="Note"
          />
          <span
            className="shrink-0 text-base font-semibold tabular-nums"
            style={{
              color: type === "income" ? "var(--positive)" : "var(--negative)",
            }}
          >
            {formatKeypadDisplay(expr, symbol)}
          </span>
        </div>
        {flash && (
          <p
            className="mt-1.5 text-center text-xs font-semibold"
            style={{
              color: flash === "Saved" ? "var(--positive)" : "var(--danger)",
            }}
          >
            {flash}
          </p>
        )}
      </div>

      {/* Keypad */}
      <div
        className="px-2 pb-2 pt-1"
        style={{
          background:
            "color-mix(in srgb, var(--accent-soft) 55%, var(--bg-muted))",
        }}
      >
        <div className="grid grid-cols-4 gap-1.5">
          {NUM_KEYS.slice(0, 3).map((k) => (
            <KeypadKey key={k} label={k} onPress={() => setExpr((e) => appendKey(e, k))} />
          ))}
          <KeypadKey
            label={<Delete size={18} />}
            ariaLabel="Backspace"
            onPress={() => setExpr((e) => backspace(e))}
          />

          {NUM_KEYS.slice(3, 6).map((k) => (
            <KeypadKey key={k} label={k} onPress={() => setExpr((e) => appendKey(e, k))} />
          ))}
          <KeypadKey
            label="＋－×÷"
            className="text-[11px] tracking-tight"
            onPress={() => {
              // cycle operator on trailing op, else add +
              setExpr((e) => {
                const last = e.slice(-1);
                const cycle: Record<string, "+" | "-" | "*" | "/"> = {
                  "+": "-",
                  "-": "*",
                  "*": "/",
                  "/": "+",
                };
                if (last in cycle) return `${e.slice(0, -1)}${cycle[last]}`;
                return appendOperator(e, "+");
              });
            }}
          />

          {NUM_KEYS.slice(6, 9).map((k) => (
            <KeypadKey key={k} label={k} onPress={() => setExpr((e) => appendKey(e, k))} />
          ))}
          <KeypadKey label="AC" onPress={() => setExpr("")} />

          {NUM_KEYS.slice(9).map((k) => (
            <KeypadKey key={k} label={k} onPress={() => setExpr((e) => appendKey(e, k))} />
          ))}
          <KeypadKey
            label="Done"
            primary
            onPress={submit}
          />
        </div>
      </div>
    </section>
  );
}

function KeypadKey({
  label,
  onPress,
  primary,
  className = "",
  ariaLabel,
}: {
  label: ReactNode;
  onPress: () => void;
  primary?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`flex h-12 items-center justify-center rounded-xl text-lg font-semibold transition active:scale-[0.97] ${className}`}
      style={{
        background: primary ? "var(--accent)" : "var(--bg-elevated)",
        color: primary ? "#04140c" : "var(--fg)",
        boxShadow: primary ? "none" : "0 1px 0 rgba(0,0,0,0.04)",
      }}
      onClick={onPress}
    >
      {label}
    </button>
  );
}
