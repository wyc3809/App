import type { MessageTree } from "../types";

export const en: MessageTree = {
  nav: {
    home: "Home",
    accounts: "Accounts",
    ledger: "Ledger",
    insights: "Insights",
  },
  loading: "Loading your portfolio…",
  intro: {
    skip: "Skip",
    next: "Next",
    back: "Back",
    welcome: {
      title: "Welcome to WorthBook",
      subtitle:
        "Track net worth, accounts, and day-to-day ledger entries — offline and private on this device.",
      loadDemo: "Load demo portfolio",
    },
    features: {
      title: "What you can do",
      subtitle: "Four tabs cover your full wealth picture.",
      home: {
        title: "Home",
        desc: "See total net worth, trends, and your account list at a glance.",
      },
      accounts: {
        title: "Accounts",
        desc: "Add assets and liabilities with balances, categories, and history.",
      },
      ledger: {
        title: "Ledger",
        desc: "Record income and expenses — optionally linked to an account.",
      },
      insights: {
        title: "Insights",
        desc: "Charts for growth, allocation, cashflow, and categories.",
      },
    },
    ledger: {
      title: "Your first ledger entry",
      subtitle: "Bookkeeping takes about 30 seconds.",
      step1: "Open the Ledger tab at the bottom.",
      step2: "Choose Expense or Income, then pick a category (e.g. Food).",
      step3: "Enter the amount on the keypad and tap Done.",
      step4: "Optionally link an account so the balance updates automatically.",
    },
    start: {
      title: "Ready to start?",
      subtitle: "Pick any path — you can change everything later in Settings.",
      addAccount: "Add your first account",
      openLedger: "Open Ledger",
      loadDemo: "Load demo portfolio",
      skip: "Start empty",
    },
  },
  settings: {
    eyebrow: "Preferences",
    title: "Settings",
    subtitle: "Offline-first. Your balances never leave this browser.",
    display: "Display",
    language: "Language",
    languageEn: "English",
    languageZhHant: "繁體中文",
    languageZhHans: "简体中文",
    theme: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeLightHint: "Clean white + green accent",
    themeDarkHint: "Dark shell + bright green accent",
    privacyTitle: "Privacy mode",
    privacyDesc: "Mask balances with dots",
  },
};
