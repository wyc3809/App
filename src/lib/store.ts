"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_CURRENCIES,
  rebaseCurrencyRates,
  toBaseCurrency,
} from "./currencies";
import { createDemoAccounts, createDemoSnapshots } from "./demo-data";
import { todayISO } from "./format";
import type { WorthBackupPayload } from "./import-backup";
import type {
  Account,
  Currency,
  HistoricalSnapshot,
  UserSettings,
} from "./types";

function id(): string {
  return crypto.randomUUID();
}

interface WorthState {
  accounts: Account[];
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
      snapshots: [],
      currencies: DEFAULT_CURRENCIES,
      settings: defaultSettings,
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      loadDemoData: () => {
        const accounts = createDemoAccounts();
        const snapshots = createDemoSnapshots(accounts);
        set({
          accounts,
          snapshots,
          currencies: DEFAULT_CURRENCIES,
          settings: { ...defaultSettings },
        });
      },

      resetAll: () =>
        set({
          accounts: [],
          snapshots: [],
          currencies: DEFAULT_CURRENCIES,
          settings: { ...defaultSettings },
        }),

      importBackup: (payload) => {
        set({
          accounts: payload.accounts,
          snapshots: payload.snapshots,
          currencies: payload.currencies,
          settings: payload.settings,
        });
      },

      addAccount: (input) => {
        const now = new Date().toISOString();
        const account: Account = {
          ...input,
          id: id(),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ accounts: [...s.accounts, account] }));
      },

      updateAccount: (id, patch) => {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id
              ? { ...a, ...patch, updatedAt: new Date().toISOString() }
              : a,
          ),
        }));
      },

      deleteAccount: (id) => {
        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) }));
      },

      takeSnapshot: (date) => {
        const { accounts, currencies, snapshots } = get();
        const snapDate = date ?? todayISO();
        const next = buildSnapshot(accounts, currencies, snapDate);
        const withoutSameDay = snapshots.filter((s) => s.date !== snapDate);
        const merged = [...withoutSameDay, next].sort((a, b) =>
          a.date.localeCompare(b.date),
        );
        set({ snapshots: merged });
      },

      deleteSnapshot: (id) => {
        set((s) => ({ snapshots: s.snapshots.filter((x) => x.id !== id) }));
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        snapshots: state.snapshots,
        currencies: state.currencies,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
