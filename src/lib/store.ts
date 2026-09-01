"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  convertAmount,
  DEFAULT_CURRENCIES,
  rebaseCurrencyRates,
  toBaseCurrency,
} from "./currencies";
import {
  createDemoAccounts,
  createDemoSnapshots,
  createDemoTransactions,
  createDemoValueEntries,
} from "./demo-data";
import { todayISO } from "./format";
import type { WorthBackupPayload } from "./import-backup";
import type { CsvAccountRow, CsvTransactionRow } from "./import-csv";
import {
  applyLedgerDeltaToBalance,
  balanceOnDate,
  isEntryAfter,
  oppositeTransactionType,
} from "./ledger";
import { categoryAfterTypeFlip } from "./categories";
import type {
  Account,
  AccountValueEntry,
  Currency,
  HistoricalSnapshot,
  Transaction,
  UserSettings,
} from "./types";

function id(): string {
  return crypto.randomUUID();
}

type TransactionInput = Omit<Transaction, "id" | "createdAt">;

interface WorthState {
  accounts: Account[];
  valueEntries: AccountValueEntry[];
  transactions: Transaction[];
  snapshots: HistoricalSnapshot[];
  currencies: Currency[];
  settings: UserSettings;
  hydrated: boolean;

  setHydrated: (value: boolean) => void;
  resyncAccounts: () => void;
  loadDemoData: () => void;
  resetAll: () => void;
  importBackup: (payload: WorthBackupPayload) => void;
  /** Merge accounts / ledger rows from CSV into the current portfolio. */
  importCsvData: (input: {
    accounts: CsvAccountRow[];
    transactions: CsvTransactionRow[];
  }) => { accountsAdded: number; transactionsAdded: number };

  addAccount: (input: Omit<Account, "id" | "createdAt" | "updatedAt">) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  /** Convert an account + its value history into another currency. */
  changeAccountCurrency: (accountId: string, nextCurrency: string) => void;

  upsertValueEntry: (input: {
    entryId?: string;
    accountId: string;
    date: string;
    value: number;
    note?: string;
    markOnGraph?: boolean;
  }) => void;
  deleteValueEntry: (entryId: string) => void;

  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, patch: Partial<TransactionInput>) => void;
  deleteTransaction: (id: string) => void;

  takeSnapshot: (date?: string) => void;
  deleteSnapshot: (id: string) => void;

  updateSettings: (patch: Partial<UserSettings>) => void;
  /** Stamp last successful JSON export for backup reminders. */
  markBackupNow: () => void;
  completeOnboarding: () => void;
  updateCurrencyRate: (code: string, rate: number) => void;
  setBaseCurrency: (code: string) => void;

  /** Ephemeral — open wrapped report from Settings (not persisted). */
  wrappedReportTrigger: "weekly" | "monthly" | null;
  requestWrappedReport: (type: "weekly" | "monthly") => void;
  clearWrappedReportTrigger: () => void;
  markWeeklyReportSeen: (weekKey: string) => void;
  markMonthlyReportSeen: (monthKey: string) => void;
}

function buildSnapshot(
  accounts: Account[],
  currencies: Currency[],
  date: string,
): HistoricalSnapshot {
  let totalAssets = 0;
  let totalLiabilities = 0;
  const accountBalances = accounts.map((a) => {
    const base = toBaseCurrency(a.currentValue, a.currency, currencies);
    if (a.isLiability) totalLiabilities += base;
    else totalAssets += base;
    return {
      accountId: a.id,
      balance: a.currentValue,
      currency: a.currency,
    };
  });

  return {
    id: id(),
    date,
    totalAssetsBaseCurrency: totalAssets,
    totalLiabilitiesBaseCurrency: totalLiabilities,
    netWorthBaseCurrency: totalAssets - totalLiabilities,
    accountBalances,
  };
}

function upsertSnapshot(
  snapshots: HistoricalSnapshot[],
  accounts: Account[],
  currencies: Currency[],
  date: string,
): HistoricalSnapshot[] {
  const next = buildSnapshot(accounts, currencies, date);
  return [...snapshots.filter((s) => s.date !== date), next].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function syncAccountFromEntries(
  account: Account,
  entries: AccountValueEntry[],
): Account {
  const mine = entries
    .filter((e) => e.accountId === account.id)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
  if (mine.length === 0) return account;
  const latest = mine[0];
  return {
    ...account,
    currentValue: latest.value,
    asOfDate: latest.date,
    updatedAt: new Date().toISOString(),
  };
}

/** Keep account.currentValue aligned with the newest value-history row. */
function resyncAllAccounts(
  accounts: Account[],
  valueEntries: AccountValueEntry[],
): Account[] {
  return accounts.map((a) => syncAccountFromEntries(a, valueEntries));
}

function seedEntryForAccount(account: Account): AccountValueEntry {
  return {
    id: id(),
    accountId: account.id,
    date: account.asOfDate || todayISO(),
    value: account.currentValue,
    note: account.note,
    markOnGraph: true,
    createdAt: new Date().toISOString(),
  };
}

function writeValueOnDate(
  valueEntries: AccountValueEntry[],
  accountId: string,
  date: string,
  value: number,
  note?: string,
): AccountValueEntry[] {
  const existing = valueEntries.find(
    (e) => e.accountId === accountId && e.date === date && !e.transactionId,
  );
  if (existing) {
    return valueEntries.map((e) =>
      e.id === existing.id
        ? { ...e, value, note: note ?? e.note, markOnGraph: true }
        : e,
    );
  }
  return [
    ...valueEntries,
    {
      id: id(),
      accountId,
      date,
      value,
      note,
      markOnGraph: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

function cascadeAdjustAfterRemoval(
  entries: AccountValueEntry[],
  removed: AccountValueEntry,
): AccountValueEntry[] {
  const delta = removed.delta ?? 0;
  if (delta === 0) {
    return entries.filter((e) => e.id !== removed.id);
  }
  return entries
    .filter((e) => e.id !== removed.id)
    .map((e) => {
      if (e.accountId !== removed.accountId) return e;
      if (!isEntryAfter(e, removed)) return e;
      return {
        ...e,
        value: Math.max(0, Number((e.value - delta).toFixed(2))),
      };
    });
}

/**
 * Apply or reverse a ledger entry against a linked account's value history.
 * Each linked ledger creates its own Value History row (not merged by date).
 * Crossing zero flips the account between asset and liability.
 */
function applyTransactionLink(
  accounts: Account[],
  valueEntries: AccountValueEntry[],
  snapshots: HistoricalSnapshot[],
  currencies: Currency[],
  tx: Pick<
    Transaction,
    "id" | "type" | "amount" | "currency" | "date" | "accountId" | "title"
  >,
  mode: "apply" | "reverse",
): {
  accounts: Account[];
  valueEntries: AccountValueEntry[];
  snapshots: HistoricalSnapshot[];
} {
  if (!tx.accountId) {
    return { accounts, valueEntries, snapshots };
  }

  const account = accounts.find((a) => a.id === tx.accountId);
  if (!account) {
    return { accounts, valueEntries, snapshots };
  }

  let nextEntries = valueEntries;
  let workingAccount = account;

  if (mode === "reverse") {
    const linked = valueEntries.find((e) => e.transactionId === tx.id);
    if (linked) {
      nextEntries = cascadeAdjustAfterRemoval(valueEntries, linked);
      if (linked.typeFlip) {
        workingAccount = {
          ...account,
          isLiability: linked.typeFlip.fromIsLiability,
          category: linked.typeFlip.fromCategory,
        };
      }
    } else {
      const amountInAccount = convertAmount(
        tx.amount,
        tx.currency,
        account.currency,
        currencies,
      );
      const base = balanceOnDate(
        valueEntries,
        account.id,
        tx.date,
        account.currentValue,
      );
      const result = applyLedgerDeltaToBalance(
        base,
        account.isLiability,
        oppositeTransactionType(tx.type),
        amountInAccount,
      );
      nextEntries = writeValueOnDate(
        valueEntries,
        account.id,
        tx.date,
        result.value,
        undefined,
      );
      if (result.flipped) {
        workingAccount = {
          ...account,
          isLiability: result.isLiability,
          category: categoryAfterTypeFlip(result.isLiability),
        };
      }
    }
  } else {
    const withoutSelf = valueEntries.filter((e) => e.transactionId !== tx.id);
    const amountInAccount = convertAmount(
      tx.amount,
      tx.currency,
      account.currency,
      currencies,
    );
    const base = balanceOnDate(
      withoutSelf,
      account.id,
      tx.date,
      account.currentValue,
    );
    const result = applyLedgerDeltaToBalance(
      base,
      account.isLiability,
      tx.type,
      amountInAccount,
    );
    const delta = result.signedDelta;
    const kind = tx.type === "income" ? "Income" : "Expense";
    const flipNote = result.flipped
      ? result.isLiability
        ? " · became liability"
        : " · became asset"
      : "";
    const createdAt = new Date().toISOString();
    const toCategory = result.flipped
      ? categoryAfterTypeFlip(result.isLiability)
      : account.category;
    const newEntry: AccountValueEntry = {
      id: id(),
      accountId: account.id,
      date: tx.date,
      value: result.value,
      note: `${kind} · ${tx.title}${flipNote}`,
      markOnGraph: true,
      createdAt,
      transactionId: tx.id,
      delta,
      typeFlip: result.flipped
        ? {
            fromIsLiability: account.isLiability,
            fromCategory: account.category,
            toIsLiability: result.isLiability,
            toCategory,
          }
        : undefined,
    };
    nextEntries = [
      ...withoutSelf.map((e) => {
        if (e.accountId !== account.id) return e;
        if (e.date <= tx.date) return e;
        return {
          ...e,
          value: Math.max(0, Number((e.value + delta).toFixed(2))),
        };
      }),
      newEntry,
    ];
    if (result.flipped) {
      workingAccount = {
        ...account,
        isLiability: result.isLiability,
        category: toCategory,
      };
    }
  }

  const synced = syncAccountFromEntries(workingAccount, nextEntries);
  const nextAccounts = accounts.map((a) =>
    a.id === account.id ? synced : a,
  );

  return {
    accounts: nextAccounts,
    valueEntries: nextEntries,
    snapshots: upsertSnapshot(snapshots, nextAccounts, currencies, tx.date),
  };
}

const defaultSettings: UserSettings = {
  baseCurrency: "HKD",
  isPrivacyMode: false,
  isBiometricEnabled: false,
  theme: "system",
  locale: "en",
  lastBackupAt: null,
  onboardingCompleted: false,
  lastWeeklyReportSeenKey: null,
  lastMonthlyReportSeenKey: null,
  weeklyReportNotifications: true,
  monthlyReportNotifications: true,
};

export const useWorthStore = create<WorthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      valueEntries: [],
      transactions: [],
      snapshots: [],
      currencies: DEFAULT_CURRENCIES,
      settings: defaultSettings,
      hydrated: false,
      wrappedReportTrigger: null,

      setHydrated: (value) => set({ hydrated: value }),

      resyncAccounts: () => {
        set((s) => ({
          accounts: resyncAllAccounts(s.accounts, s.valueEntries),
        }));
      },

      loadDemoData: () => {
        const accounts = createDemoAccounts();
        const valueEntries = createDemoValueEntries(accounts);
        const snapshots = createDemoSnapshots(accounts);
        set({
          accounts,
          valueEntries,
          transactions: [],
          snapshots,
          currencies: DEFAULT_CURRENCIES,
          settings: { ...defaultSettings, onboardingCompleted: true },
        });
        for (const input of createDemoTransactions(accounts)) {
          get().addTransaction(input);
        }
        get().resyncAccounts();
      },

      resetAll: () =>
        set({
          accounts: [],
          valueEntries: [],
          transactions: [],
          snapshots: [],
          currencies: DEFAULT_CURRENCIES,
          settings: { ...defaultSettings },
        }),

      importBackup: (payload) => {
        const valueEntries =
          payload.valueEntries && payload.valueEntries.length > 0
            ? payload.valueEntries
            : payload.accounts.map(seedEntryForAccount);
        const accounts = resyncAllAccounts(payload.accounts, valueEntries);
        set({
          accounts,
          valueEntries,
          transactions: payload.transactions ?? [],
          snapshots: payload.snapshots,
          currencies: payload.currencies,
          settings: payload.settings,
        });
      },

      importCsvData: ({ accounts: accountRows, transactions: txRows }) => {
        const nameToId = new Map<string, string>(
          get().accounts.map((a) => [a.name.trim().toLowerCase(), a.id]),
        );
        let accountsAdded = 0;
        let transactionsAdded = 0;

        for (const row of accountRows) {
          const key = row.name.trim().toLowerCase();
          if (nameToId.has(key)) continue;
          get().addAccount({
            name: row.name.trim(),
            category: row.category,
            isLiability: row.isLiability,
            currency: row.currency,
            currentValue: row.currentValue,
            asOfDate: row.asOfDate,
            institutionName: row.institutionName,
            note: row.note,
          });
          const created = get().accounts.find(
            (a) => a.name.trim().toLowerCase() === key,
          );
          if (created) {
            nameToId.set(key, created.id);
            accountsAdded++;
          }
        }

        // Refresh map after adds
        for (const a of get().accounts) {
          nameToId.set(a.name.trim().toLowerCase(), a.id);
        }

        for (const row of txRows) {
          const accountId = row.accountName
            ? nameToId.get(row.accountName.trim().toLowerCase())
            : undefined;
          get().addTransaction({
            type: row.type,
            amount: row.amount,
            currency: row.currency,
            date: row.date,
            title: row.title,
            category: row.category,
            accountId,
            note: row.note,
          });
          transactionsAdded++;
        }

        return { accountsAdded, transactionsAdded };
      },

      addAccount: (input) => {
        const now = new Date().toISOString();
        const asOfDate = input.asOfDate || todayISO();
        const account: Account = {
          ...input,
          asOfDate,
          id: id(),
          createdAt: now,
          updatedAt: now,
        };
        const entry = seedEntryForAccount(account);
        set((s) => {
          const accounts = [...s.accounts, account];
          const valueEntries = [...s.valueEntries, entry];
          return {
            accounts,
            valueEntries,
            snapshots: upsertSnapshot(s.snapshots, accounts, s.currencies, asOfDate),
          };
        });
      },

      updateAccount: (accountId, patch) => {
        set((s) => {
          const accounts = s.accounts.map((a) =>
            a.id === accountId
              ? {
                  ...a,
                  ...patch,
                  asOfDate: patch.asOfDate ?? a.asOfDate ?? todayISO(),
                  updatedAt: new Date().toISOString(),
                }
              : a,
          );
          const target = accounts.find((a) => a.id === accountId);
          if (!target) return { accounts };

          let valueEntries = s.valueEntries;
          if (patch.currentValue !== undefined || patch.asOfDate) {
            const date = target.asOfDate;
            const value = target.currentValue;
            const existing = valueEntries.find(
              (e) => e.accountId === accountId && e.date === date,
            );
            if (existing) {
              valueEntries = valueEntries.map((e) =>
                e.id === existing.id ? { ...e, value, note: patch.note ?? e.note } : e,
              );
            } else {
              valueEntries = [
                ...valueEntries,
                {
                  id: id(),
                  accountId,
                  date,
                  value,
                  note: patch.note,
                  markOnGraph: true,
                  createdAt: new Date().toISOString(),
                },
              ];
            }
          }

          return {
            accounts,
            valueEntries,
            snapshots: upsertSnapshot(
              s.snapshots,
              accounts,
              s.currencies,
              target.asOfDate,
            ),
          };
        });
      },

      deleteAccount: (accountId) => {
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== accountId),
          valueEntries: s.valueEntries.filter((e) => e.accountId !== accountId),
          transactions: s.transactions.map((t) =>
            t.accountId === accountId ? { ...t, accountId: undefined } : t,
          ),
        }));
      },

      changeAccountCurrency: (accountId, nextCurrency) => {
        set((s) => {
          const account = s.accounts.find((a) => a.id === accountId);
          if (!account || account.currency === nextCurrency) return s;
          if (!s.currencies.some((c) => c.code === nextCurrency)) return s;

          const valueEntries = s.valueEntries.map((e) => {
            if (e.accountId !== accountId) return e;
            const value = Number(
              convertAmount(
                e.value,
                account.currency,
                nextCurrency,
                s.currencies,
              ).toFixed(2),
            );
            const delta =
              e.delta == null
                ? undefined
                : Number(
                    convertAmount(
                      e.delta,
                      account.currency,
                      nextCurrency,
                      s.currencies,
                    ).toFixed(2),
                  );
            return { ...e, value, delta };
          });

          const currentValue = Number(
            convertAmount(
              account.currentValue,
              account.currency,
              nextCurrency,
              s.currencies,
            ).toFixed(2),
          );

          const accounts = s.accounts.map((a) =>
            a.id === accountId
              ? {
                  ...a,
                  currency: nextCurrency,
                  currentValue,
                  updatedAt: new Date().toISOString(),
                }
              : a,
          );
          const synced = resyncAllAccounts(accounts, valueEntries);

          return {
            accounts: synced,
            valueEntries,
            snapshots: upsertSnapshot(
              s.snapshots,
              synced,
              s.currencies,
              todayISO(),
            ),
          };
        });
      },

      upsertValueEntry: ({
        entryId,
        accountId,
        date,
        value,
        note,
        markOnGraph = true,
      }) => {
        set((s) => {
          const account = s.accounts.find((a) => a.id === accountId);
          if (!account) return s;

          let valueEntries = [...s.valueEntries];
          const noteValue = note?.trim() || undefined;

          if (entryId) {
            valueEntries = valueEntries.filter(
              (e) => e.id === entryId || !(e.accountId === accountId && e.date === date),
            );
            valueEntries = valueEntries.map((e) =>
              e.id === entryId
                ? { ...e, date, value, note: noteValue, markOnGraph }
                : e,
            );
          } else {
            const existing = valueEntries.find(
              (e) => e.accountId === accountId && e.date === date,
            );
            valueEntries = existing
              ? valueEntries.map((e) =>
                  e.id === existing.id
                    ? { ...e, value, note: noteValue, markOnGraph }
                    : e,
                )
              : [
                  ...valueEntries,
                  {
                    id: id(),
                    accountId,
                    date,
                    value,
                    note: noteValue,
                    markOnGraph,
                    createdAt: new Date().toISOString(),
                  },
                ];
          }

          const synced = syncAccountFromEntries(account, valueEntries);
          const accounts = s.accounts.map((a) =>
            a.id === accountId ? synced : a,
          );

          return {
            accounts,
            valueEntries,
            snapshots: upsertSnapshot(s.snapshots, accounts, s.currencies, date),
          };
        });
      },

      deleteValueEntry: (entryId) => {
        const entry = get().valueEntries.find((e) => e.id === entryId);
        if (!entry) return;
        // Ledger-linked rows are owned by the transaction — reverse via ledger delete.
        if (entry.transactionId) {
          get().deleteTransaction(entry.transactionId);
          return;
        }
        set((s) => {
          const valueEntries = s.valueEntries.filter((e) => e.id !== entryId);
          const account = s.accounts.find((a) => a.id === entry.accountId);
          if (!account) return { valueEntries };
          const synced = syncAccountFromEntries(account, valueEntries);
          const accounts = s.accounts.map((a) =>
            a.id === account.id ? synced : a,
          );
          return {
            accounts,
            valueEntries,
            snapshots: upsertSnapshot(
              s.snapshots,
              accounts,
              s.currencies,
              synced.asOfDate || todayISO(),
            ),
          };
        });
      },

      addTransaction: (input) => {
        const tx: Transaction = {
          ...input,
          amount: Math.abs(input.amount),
          title: input.title.trim() || (input.type === "income" ? "Income" : "Expense"),
          note: input.note?.trim() || undefined,
          accountId: input.accountId || undefined,
          id: id(),
          createdAt: new Date().toISOString(),
        };
        set((s) => {
          const linked = applyTransactionLink(
            s.accounts,
            s.valueEntries,
            s.snapshots,
            s.currencies,
            tx,
            "apply",
          );
          return {
            ...linked,
            transactions: [tx, ...s.transactions],
          };
        });
      },

      updateTransaction: (txId, patch) => {
        set((s) => {
          const existing = s.transactions.find((t) => t.id === txId);
          if (!existing) return s;

          const next: Transaction = {
            ...existing,
            ...patch,
            amount:
              patch.amount !== undefined
                ? Math.abs(patch.amount)
                : existing.amount,
            title:
              patch.title !== undefined
                ? patch.title.trim() || existing.title
                : existing.title,
            note:
              patch.note !== undefined
                ? patch.note.trim() || undefined
                : existing.note,
            accountId:
              patch.accountId !== undefined
                ? patch.accountId || undefined
                : existing.accountId,
          };

          let accounts = s.accounts;
          let valueEntries = s.valueEntries;
          let snapshots = s.snapshots;

          const reversed = applyTransactionLink(
            accounts,
            valueEntries,
            snapshots,
            s.currencies,
            existing,
            "reverse",
          );
          accounts = reversed.accounts;
          valueEntries = reversed.valueEntries;
          snapshots = reversed.snapshots;

          const applied = applyTransactionLink(
            accounts,
            valueEntries,
            snapshots,
            s.currencies,
            next,
            "apply",
          );

          return {
            accounts: applied.accounts,
            valueEntries: applied.valueEntries,
            snapshots: applied.snapshots,
            transactions: s.transactions.map((t) => (t.id === txId ? next : t)),
          };
        });
      },

      deleteTransaction: (txId) => {
        set((s) => {
          const existing = s.transactions.find((t) => t.id === txId);
          if (!existing) return s;
          const linked = applyTransactionLink(
            s.accounts,
            s.valueEntries,
            s.snapshots,
            s.currencies,
            existing,
            "reverse",
          );
          return {
            ...linked,
            transactions: s.transactions.filter((t) => t.id !== txId),
          };
        });
      },

      takeSnapshot: (date) => {
        const { accounts, currencies, snapshots } = get();
        const snapDate = date ?? todayISO();
        set({
          snapshots: upsertSnapshot(snapshots, accounts, currencies, snapDate),
        });
      },

      deleteSnapshot: (snapId) => {
        set((s) => ({ snapshots: s.snapshots.filter((x) => x.id !== snapId) }));
      },

      updateSettings: (patch) => {
        set((s) => ({ settings: { ...s.settings, ...patch } }));
      },

      markBackupNow: () => {
        set((s) => ({
          settings: {
            ...s.settings,
            lastBackupAt: new Date().toISOString(),
          },
        }));
      },

      completeOnboarding: () => {
        set((s) => ({
          settings: { ...s.settings, onboardingCompleted: true },
        }));
      },

      updateCurrencyRate: (code, rate) => {
        if (rate <= 0) return;
        set((s) => ({
          currencies: s.currencies.map((c) =>
            c.code === code ? { ...c, exchangeRateToBase: rate } : c,
          ),
        }));
      },

      setBaseCurrency: (code) => {
        const { currencies, settings } = get();
        if (code === settings.baseCurrency) return;
        set({
          currencies: rebaseCurrencyRates(currencies, code),
          settings: { ...settings, baseCurrency: code },
        });
      },

      requestWrappedReport: (type) => set({ wrappedReportTrigger: type }),
      clearWrappedReportTrigger: () => set({ wrappedReportTrigger: null }),
      markWeeklyReportSeen: (weekKey) => {
        set((s) => ({
          settings: { ...s.settings, lastWeeklyReportSeenKey: weekKey },
        }));
      },
      markMonthlyReportSeen: (monthKey) => {
        set((s) => ({
          settings: { ...s.settings, lastMonthlyReportSeenKey: monthKey },
        }));
      },
    }),
    {
      name: "worthtracker-v1",
      version: 8,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        valueEntries: state.valueEntries,
        transactions: state.transactions,
        snapshots: state.snapshots,
        currencies: state.currencies,
        settings: state.settings,
      }),
      migrate: (persisted, version) => {
        const state = persisted as {
          accounts?: Account[];
          valueEntries?: AccountValueEntry[];
          transactions?: Transaction[];
          snapshots?: HistoricalSnapshot[];
          currencies?: Currency[];
          settings?: UserSettings;
        };

        if (version < 2 && Array.isArray(state.accounts)) {
          state.accounts = state.accounts.map((a) => ({
            ...a,
            asOfDate:
              typeof a.asOfDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.asOfDate)
                ? a.asOfDate
                : (a.createdAt?.slice(0, 10) ?? todayISO()),
          }));
        }

        if (version < 3) {
          const accounts = state.accounts ?? [];
          if (!Array.isArray(state.valueEntries) || state.valueEntries.length === 0) {
            state.valueEntries = accounts.map((a) => ({
              id: crypto.randomUUID(),
              accountId: a.id,
              date: a.asOfDate || a.createdAt?.slice(0, 10) || todayISO(),
              value: a.currentValue,
              note: a.note,
              markOnGraph: true,
              createdAt: a.updatedAt || new Date().toISOString(),
            }));
          }
        }

        if (version < 4) {
          if (!Array.isArray(state.transactions)) {
            state.transactions = [];
          }
        }

        if (version < 5) {
          // Fix same-day history: currentValue must follow newest createdAt.
          if (Array.isArray(state.accounts) && Array.isArray(state.valueEntries)) {
            state.accounts = resyncAllAccounts(state.accounts, state.valueEntries);
          }
        }

        if (version < 6) {
          state.settings = {
            ...defaultSettings,
            ...state.settings,
            lastBackupAt: state.settings?.lastBackupAt ?? null,
            // Existing users skip the welcome sheet.
            onboardingCompleted: state.settings?.onboardingCompleted ?? true,
          };
        }

        if (version < 7) {
          state.settings = {
            ...defaultSettings,
            ...state.settings,
            locale:
              state.settings?.locale === "zh-Hant" ||
              state.settings?.locale === "zh-Hans" ||
              state.settings?.locale === "en"
                ? state.settings.locale
                : "en",
          };
        }

        if (version < 8) {
          state.settings = {
            ...defaultSettings,
            ...state.settings,
            lastWeeklyReportSeenKey: state.settings?.lastWeeklyReportSeenKey ?? null,
            lastMonthlyReportSeenKey: state.settings?.lastMonthlyReportSeenKey ?? null,
            weeklyReportNotifications: state.settings?.weeklyReportNotifications ?? true,
            monthlyReportNotifications: state.settings?.monthlyReportNotifications ?? true,
          };
        }

        return state as never;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
