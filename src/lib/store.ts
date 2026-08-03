"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_CURRENCIES,
  rebaseCurrencyRates,
  toBaseCurrency,
} from "./currencies";
import {
  createDemoAccounts,
  createDemoSnapshots,
  createDemoValueEntries,
} from "./demo-data";
import { todayISO } from "./format";
import type { WorthBackupPayload } from "./import-backup";
import type {
  Account,
  AccountValueEntry,
  Currency,
  HistoricalSnapshot,
  UserSettings,
} from "./types";

function id(): string {
  return crypto.randomUUID();
}

interface WorthState {
  accounts: Account[];
  valueEntries: AccountValueEntry[];
  snapshots: HistoricalSnapshot[];
  currencies: Currency[];
  settings: UserSettings;
  hydrated: boolean;

  setHydrated: (value: boolean) => void;
  loadDemoData: () => void;
  resetAll: () => void;
  importBackup: (payload: WorthBackupPayload) => void;

  addAccount: (input: Omit<Account, "id" | "createdAt" | "updatedAt">) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  upsertValueEntry: (input: {
    accountId: string;
    date: string;
    value: number;
    note?: string;
    markOnGraph?: boolean;
  }) => void;
  deleteValueEntry: (entryId: string) => void;

  takeSnapshot: (date?: string) => void;
  deleteSnapshot: (id: string) => void;

  updateSettings: (patch: Partial<UserSettings>) => void;
  updateCurrencyRate: (code: string, rate: number) => void;
  setBaseCurrency: (code: string) => void;
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
    .sort((a, b) => b.date.localeCompare(a.date));
  if (mine.length === 0) return account;
  const latest = mine[0];
  return {
    ...account,
    currentValue: latest.value,
    asOfDate: latest.date,
    updatedAt: new Date().toISOString(),
  };
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

const defaultSettings: UserSettings = {
  baseCurrency: "HKD",
  isPrivacyMode: false,
  isBiometricEnabled: false,
  theme: "system",
};

export const useWorthStore = create<WorthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      valueEntries: [],
      snapshots: [],
      currencies: DEFAULT_CURRENCIES,
      settings: defaultSettings,
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      loadDemoData: () => {
        const accounts = createDemoAccounts();
        const valueEntries = createDemoValueEntries(accounts);
        const snapshots = createDemoSnapshots(accounts);
        set({
          accounts,
          valueEntries,
          snapshots,
          currencies: DEFAULT_CURRENCIES,
          settings: { ...defaultSettings },
        });
      },

      resetAll: () =>
        set({
          accounts: [],
          valueEntries: [],
          snapshots: [],
          currencies: DEFAULT_CURRENCIES,
          settings: { ...defaultSettings },
        }),

      importBackup: (payload) => {
        const valueEntries =
          payload.valueEntries && payload.valueEntries.length > 0
            ? payload.valueEntries
            : payload.accounts.map(seedEntryForAccount);
        set({
          accounts: payload.accounts,
          valueEntries,
          snapshots: payload.snapshots,
          currencies: payload.currencies,
          settings: payload.settings,
        });
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
        }));
      },

      upsertValueEntry: ({ accountId, date, value, note, markOnGraph = true }) => {
        set((s) => {
          const account = s.accounts.find((a) => a.id === accountId);
          if (!account) return s;

          const existing = s.valueEntries.find(
            (e) => e.accountId === accountId && e.date === date,
          );
          const valueEntries = existing
            ? s.valueEntries.map((e) =>
                e.id === existing.id
                  ? {
                      ...e,
                      value,
                      note: note?.trim() || undefined,
                      markOnGraph,
                    }
                  : e,
              )
            : [
                ...s.valueEntries,
                {
                  id: id(),
                  accountId,
                  date,
                  value,
                  note: note?.trim() || undefined,
                  markOnGraph,
                  createdAt: new Date().toISOString(),
                },
              ];

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
        set((s) => {
          const entry = s.valueEntries.find((e) => e.id === entryId);
          if (!entry) return s;
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
    }),
    {
      name: "worthtracker-v1",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        valueEntries: state.valueEntries,
        snapshots: state.snapshots,
        currencies: state.currencies,
        settings: state.settings,
      }),
      migrate: (persisted, version) => {
        const state = persisted as {
          accounts?: Account[];
          valueEntries?: AccountValueEntry[];
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

        return state as never;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
