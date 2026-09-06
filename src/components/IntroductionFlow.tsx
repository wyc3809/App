"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChartNoAxesColumnIncreasing, Plus, Receipt, Sparkles, WalletCards } from "lucide-react";
import { AccountForm } from "@/components/AccountForm";
import { TransactionModal } from "@/components/TransactionModal";
import { useI18n } from "@/lib/i18n/context";
import { useWorthStore } from "@/lib/store";
import type { UserSettings } from "@/lib/types";

type OnboardingStep = NonNullable<UserSettings["onboardingStep"]>;

const TOUR_STEPS: OnboardingStep[] = [
  "welcome",
  "add_asset",
  "add_expense",
  "view_insights",
  "sample_report",
];

function subscribe() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/**
 * Guided first-run tour:
 * welcome → first asset → first expense → Insights charts → sample Wrapped report.
 * Portaled to document.body so it is never clipped by AppShell overflow.
 */
export function IntroductionFlow() {
  const { t } = useI18n();
  const accounts = useWorthStore((s) => s.accounts);
  const transactions = useWorthStore((s) => s.transactions);
  const settings = useWorthStore((s) => s.settings);
  const completeOnboarding = useWorthStore((s) => s.completeOnboarding);
  const setOnboardingStep = useWorthStore((s) => s.setOnboardingStep);
  const updateSettings = useWorthStore((s) => s.updateSettings);
  const requestSampleWrappedReport = useWorthStore(
    (s) => s.requestSampleWrappedReport,
  );

  const step: OnboardingStep = settings.onboardingStep ?? "welcome";
  const open = !settings.onboardingCompleted;
  const isClient = useIsClient();

  const [displayName, setDisplayName] = useState(settings.displayName ?? "");
  const [assetFormOpen, setAssetFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);

  useEffect(() => {
    if (!open || !isClient) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isClient]);

  if (!open || !isClient) return null;

  const saveDisplayName = () => {
    const name = displayName.trim().slice(0, 40);
    if (name) updateSettings({ displayName: name });
  };

  const finish = () => {
    saveDisplayName();
    completeOnboarding();
  };

  const nextAfterWelcome = () => {
    saveDisplayName();
    const hasExpense = transactions.some((tx) => tx.type === "expense");
    if (accounts.length > 0 && hasExpense) {
      setOnboardingStep("view_insights");
    } else if (accounts.length > 0) {
      setOnboardingStep("add_expense");
    } else {
      setOnboardingStep("add_asset");
    }
  };

  const skipAsset = () => setOnboardingStep("add_expense");
  const skipExpense = () => setOnboardingStep("view_insights");
  const continueFromInsights = () => setOnboardingStep("sample_report");

  const openSampleReport = () => {
    // Sample report opens at z-130 above this tour (z-120).
    requestSampleWrappedReport();
  };

  const stepIndex = Math.max(0, TOUR_STEPS.indexOf(step));

  const overlay = (
    <div
      className="fixed inset-0 z-[120] flex flex-col"
      style={{ background: "var(--bg)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
    >
      <header
        className="flex shrink-0 items-center justify-between px-4 pt-4"
        style={{ paddingTop: "calc(16px + var(--safe-top))" }}
      >
        <div className="flex gap-1.5" aria-hidden>
          {TOUR_STEPS.map((key, i) => (
            <span
              key={key}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === stepIndex ? "1.25rem" : "0.375rem",
                background: i === stepIndex ? "var(--accent)" : "var(--bg-muted)",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn-ghost px-3 py-1.5 text-sm font-semibold"
          onClick={finish}
        >
          {t("intro.skip")}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-4 pt-6">
        {step === "welcome" && (
          <div className="animate-fade-up mx-auto flex w-full max-w-md flex-col">
            <p
              className="text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--accent)" }}
            >
              WorthBook
            </p>
            <h1
              id="intro-title"
              className="mt-2 font-display text-3xl leading-tight"
            >
              {t("intro.welcome.title")}
            </h1>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "var(--fg-muted)" }}
            >
              {t("intro.welcome.subtitle")}
            </p>
            <label className="mt-8 block">
              <span className="label">{t("intro.welcome.nameLabel")}</span>
              <input
                type="text"
                className="field mt-1.5"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("intro.welcome.namePlaceholder")}
                autoComplete="nickname"
                autoFocus
                maxLength={40}
                enterKeyHint="next"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    nextAfterWelcome();
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="btn-primary mt-6 min-h-12 w-full"
              onClick={nextAfterWelcome}
            >
              {t("intro.next")}
            </button>
          </div>
        )}

        {step === "add_asset" && (
          <div className="animate-fade-up mx-auto flex w-full max-w-md flex-col">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <WalletCards size={24} strokeWidth={2.25} />
            </span>
            <h1
              id="intro-title"
              className="mt-4 font-display text-3xl leading-tight"
            >
              {t("intro.asset.title")}
            </h1>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "var(--fg-muted)" }}
            >
              {t("intro.asset.subtitle")}
            </p>
            <ul
              className="mt-6 space-y-2 text-sm leading-relaxed"
              style={{ color: "var(--fg)" }}
            >
              <li>• {t("intro.asset.tip1")}</li>
              <li>• {t("intro.asset.tip2")}</li>
              <li>• {t("intro.asset.tip3")}</li>
            </ul>
            <button
              type="button"
              className="btn-primary mt-8 flex min-h-12 w-full items-center justify-center gap-2"
              onClick={() => setAssetFormOpen(true)}
            >
              <Plus size={18} />
              {t("intro.asset.cta")}
            </button>
            <button
              type="button"
              className="btn-ghost mt-2 min-h-11 w-full"
              onClick={skipAsset}
            >
              {t("intro.asset.skip")}
            </button>
          </div>
        )}

        {step === "add_expense" && (
          <div className="animate-fade-up mx-auto flex w-full max-w-md flex-col">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <Receipt size={24} strokeWidth={2.25} />
            </span>
            <h1
              id="intro-title"
              className="mt-4 font-display text-3xl leading-tight"
            >
              {t("intro.expense.title")}
            </h1>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "var(--fg-muted)" }}
            >
              {t("intro.expense.subtitle")}
            </p>
            <ul
              className="mt-6 space-y-2 text-sm leading-relaxed"
              style={{ color: "var(--fg)" }}
            >
              <li>• {t("intro.expense.tip1")}</li>
              <li>• {t("intro.expense.tip2")}</li>
              <li>• {t("intro.expense.tip3")}</li>
            </ul>
            <button
              type="button"
              className="btn-primary mt-8 flex min-h-12 w-full items-center justify-center gap-2"
              onClick={() => setExpenseFormOpen(true)}
            >
              <Plus size={18} />
              {t("intro.expense.cta")}
            </button>
            <button
              type="button"
              className="btn-ghost mt-2 min-h-11 w-full"
              onClick={skipExpense}
            >
              {t("intro.expense.skip")}
            </button>
          </div>
        )}

        {step === "view_insights" && (
          <div className="animate-fade-up mx-auto flex w-full max-w-md flex-col">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <ChartNoAxesColumnIncreasing size={24} strokeWidth={2.25} />
            </span>
            <h1
              id="intro-title"
              className="mt-4 font-display text-3xl leading-tight"
            >
              {t("intro.insights.title")}
            </h1>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "var(--fg-muted)" }}
            >
              {t("intro.insights.subtitle")}
            </p>
            <ul
              className="mt-6 space-y-2 text-sm leading-relaxed"
              style={{ color: "var(--fg)" }}
            >
              <li>• {t("intro.insights.tip1")}</li>
              <li>• {t("intro.insights.tip2")}</li>
              <li>• {t("intro.insights.tip3")}</li>
            </ul>
            <button
              type="button"
              className="btn-primary mt-8 flex min-h-12 w-full items-center justify-center gap-2"
              onClick={continueFromInsights}
            >
              <ChartNoAxesColumnIncreasing size={18} />
              {t("intro.insights.cta")}
            </button>
            <button
              type="button"
              className="btn-ghost mt-2 min-h-11 w-full"
              onClick={continueFromInsights}
            >
              {t("intro.insights.skip")}
            </button>
          </div>
        )}

        {step === "sample_report" && (
          <div className="animate-fade-up mx-auto flex w-full max-w-md flex-col">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              <Sparkles size={24} strokeWidth={2.25} />
            </span>
            <h1
              id="intro-title"
              className="mt-4 font-display text-3xl leading-tight"
            >
              {t("intro.report.title")}
            </h1>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "var(--fg-muted)" }}
            >
              {t("intro.report.subtitle")}
            </p>
            <button
              type="button"
              className="btn-primary mt-8 flex min-h-12 w-full items-center justify-center gap-2"
              onClick={openSampleReport}
            >
              <Sparkles size={18} />
              {t("intro.report.cta")}
            </button>
            <button
              type="button"
              className="btn-ghost mt-2 min-h-11 w-full"
              onClick={finish}
            >
              {t("intro.report.skip")}
            </button>
          </div>
        )}
      </div>

      <AccountForm
        open={assetFormOpen}
        onClose={() => setAssetFormOpen(false)}
        defaultLiability={false}
        zIndex={140}
        onSaved={() => {
          setAssetFormOpen(false);
          setOnboardingStep("add_expense");
        }}
      />

      <TransactionModal
        open={expenseFormOpen}
        onClose={() => setExpenseFormOpen(false)}
        defaultType="expense"
        defaultAccountId={accounts[0]?.id}
        zIndex={140}
        onSaved={() => {
          setExpenseFormOpen(false);
          setOnboardingStep("view_insights");
        }}
      />
    </div>
  );

  return createPortal(overlay, document.body);
}
