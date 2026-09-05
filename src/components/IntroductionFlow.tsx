"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
];

const FEATURE_COPY: Record<
  (typeof FEATURES)[number]["key"],
  { title: TranslationKey; desc: TranslationKey }
> = {
  home: { title: "intro.features.home.title", desc: "intro.features.home.desc" },
  accounts: { title: "intro.features.accounts.title", desc: "intro.features.accounts.desc" },
  ledger: { title: "intro.features.ledger.title", desc: "intro.features.ledger.desc" },
  insights: { title: "intro.features.insights.title", desc: "intro.features.insights.desc" },
};

const LEDGER_STEPS: TranslationKey[] = [
  "intro.ledger.step1",
  "intro.ledger.step2",
  "intro.ledger.step3",
  "intro.ledger.step4",
];

export function IntroductionFlow() {
  const router = useRouter();
  const { t } = useI18n();
  const accounts = useWorthStore((s) => s.accounts);
  const settings = useWorthStore((s) => s.settings);
  const completeOnboarding = useWorthStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);

  const open =
    !settings.onboardingCompleted && accounts.length === 0;

  if (!open) return null;

  const finish = () => completeOnboarding();

  const goLedger = () => {
    finish();
    router.push("/history/");
  };

  return (
    <div
      /* Above bottom sheets (z≈100) so Skip / CTAs stay tappable during first-run. */
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

      <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-4 pt-6">
        {step === 0 && (
          <div className="animate-fade-up mx-auto flex w-full max-w-md flex-col">
            <p
              className="text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--accent)" }}
            >
              WorthBook
            </p>
            <h1 id="intro-title" className="mt-2 font-display text-3xl leading-tight">
              {t("intro.welcome.title")}
            </h1>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
              {t("intro.welcome.subtitle")}
            </p>
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
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    <Icon size={20} strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{t(FEATURE_COPY[key].title)}</p>
                    <p className="mt-0.5 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
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
                    style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                  >
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed" style={{ color: "var(--fg)" }}>
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
                className="btn-primary flex w-full items-center justify-start gap-2"
                onClick={finish}
              >
                <Plus size={18} />
                {t("intro.start.addAccount")}
              </Link>
              <button
                type="button"
                className="btn-secondary w-full justify-start"
                onClick={goLedger}
              >
                <Receipt size={18} />
                {t("intro.start.openLedger")}
              </button>
              <button
                type="button"
                className="btn-ghost w-full"
                onClick={finish}
              >
                {t("intro.start.skip")}
              </button>
            </div>
          </div>
        )}
      </div>

      {step < 3 && (
        <footer
          className="shrink-0 border-t px-6 py-4"
          style={{
            borderColor: "var(--border)",
            paddingBottom: "calc(16px + var(--safe-bottom))",
          }}
        >
          <div className="mx-auto flex max-w-md gap-3">
            {step > 0 ? (
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setStep((s) => s - 1)}
              >
                {t("intro.back")}
              </button>
            ) : (
              <div className="flex-1" />
            )}
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={() => setStep((s) => s + 1)}
            >
              {t("intro.next")}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
