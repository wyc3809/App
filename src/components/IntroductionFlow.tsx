"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChartNoAxesColumnIncreasing,
  LayoutDashboard,
  Plus,
  Receipt,
  WalletCards,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n";
import { useWorthStore } from "@/lib/store";

const STEPS = 4;

const FEATURES = [
  { key: "home" as const, icon: LayoutDashboard },
  { key: "accounts" as const, icon: WalletCards },
  { key: "ledger" as const, icon: Receipt },
  { key: "insights" as const, icon: ChartNoAxesColumnIncreasing },
] as const;

const FEATURE_COPY: Record<
  (typeof FEATURES)[number]["key"],
  { title: TranslationKey; desc: TranslationKey }
> = {
  home: { title: "intro.features.home.title", desc: "intro.features.home.desc" },
  accounts: {
    title: "intro.features.accounts.title",
    desc: "intro.features.accounts.desc",
  },
  ledger: {
    title: "intro.features.ledger.title",
    desc: "intro.features.ledger.desc",
  },
  insights: {
    title: "intro.features.insights.title",
    desc: "intro.features.insights.desc",
  },
};

const LEDGER_STEPS: TranslationKey[] = [
  "intro.ledger.step1",
  "intro.ledger.step2",
  "intro.ledger.step3",
  "intro.ledger.step4",
];

/**
 * First-run onboarding overlay.
 * Portaled to document.body so it is never clipped by AppShell's
 * overflow:hidden main / tab bar — otherwise the Next footer disappears.
 */
export function IntroductionFlow() {
  const router = useRouter();
  const { t } = useI18n();
  const accounts = useWorthStore((s) => s.accounts);
  const settings = useWorthStore((s) => s.settings);
  const completeOnboarding = useWorthStore((s) => s.completeOnboarding);
  const updateSettings = useWorthStore((s) => s.updateSettings);

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(settings.displayName ?? "");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const open = !settings.onboardingCompleted && accounts.length === 0;

  useEffect(() => {
    if (!open || !mounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, mounted]);

  if (!open || !mounted) return null;

  const saveDisplayName = () => {
    const name = displayName.trim().slice(0, 40);
    if (name) updateSettings({ displayName: name });
  };

  const finish = () => {
    saveDisplayName();
    completeOnboarding();
  };

  const goNext = () => {
    if (step === 0) saveDisplayName();
    setStep((s) => Math.min(s + 1, STEPS - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const goLedger = () => {
    finish();
    router.push("/history/");
  };

  const showStepFooter = step < STEPS - 1;

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
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === step ? "1.25rem" : "0.375rem",
                background: i === step ? "var(--accent)" : "var(--bg-muted)",
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
        {step === 0 && (
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
                    goNext();
                  }
                }}
              />
            </label>
            {/* Inline Next so the CTA stays visible when the iOS keyboard is open */}
            <button
              type="button"
              className="btn-primary mt-6 min-h-12 w-full"
              onClick={goNext}
            >
              {t("intro.next")}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up mx-auto w-full max-w-md">
            <h1 id="intro-title" className="font-display text-3xl leading-tight">
              {t("intro.features.title")}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
              {t("intro.features.subtitle")}
            </p>
            <ul className="mt-6 space-y-3">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li
                  key={key}
                  className="card-surface flex items-start gap-3 p-4"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}
                  >
                    <Icon size={20} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {t(FEATURE_COPY[key].title)}
                    </p>
                    <p
                      className="mt-0.5 text-sm leading-relaxed"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {t(FEATURE_COPY[key].desc)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up mx-auto w-full max-w-md">
            <h1 id="intro-title" className="font-display text-3xl leading-tight">
              {t("intro.ledger.title")}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
              {t("intro.ledger.subtitle")}
            </p>
            <ol className="mt-6 space-y-4">
              {LEDGER_STEPS.map((stepKey, index) => (
                <li key={stepKey} className="flex gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent)",
                    }}
                  >
                    {index + 1}
                  </span>
                  <p
                    className="pt-1 text-sm leading-relaxed"
                    style={{ color: "var(--fg)" }}
                  >
                    {t(stepKey)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up mx-auto w-full max-w-md">
            <h1 id="intro-title" className="font-display text-3xl leading-tight">
              {t("intro.start.title")}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
              {t("intro.start.subtitle")}
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href="/accounts/?new=1"
                className="btn-primary flex min-h-12 w-full items-center justify-start gap-2"
                onClick={finish}
              >
                <Plus size={18} />
                {t("intro.start.addAccount")}
              </Link>
              <button
                type="button"
                className="btn-secondary min-h-12 w-full justify-start"
                onClick={goLedger}
              >
                <Receipt size={18} />
                {t("intro.start.openLedger")}
              </button>
              <button
                type="button"
                className="btn-ghost min-h-12 w-full"
                onClick={finish}
              >
                {t("intro.start.skip")}
              </button>
            </div>
          </div>
        )}
      </div>

      {showStepFooter && (
        <footer
          className="shrink-0 border-t px-6 pt-3"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg)",
            paddingBottom: "calc(12px + var(--safe-bottom))",
          }}
        >
          <div className="mx-auto flex max-w-md gap-3">
            {step > 0 ? (
              <button
                type="button"
                className="btn-secondary min-h-12 flex-1"
                onClick={goBack}
              >
                {t("intro.back")}
              </button>
            ) : null}
            <button
              type="button"
              className="btn-primary min-h-12 flex-1"
              onClick={goNext}
            >
              {t("intro.next")}
            </button>
          </div>
        </footer>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
}
