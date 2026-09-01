"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Receipt, Sparkles, TrendingUp } from "lucide-react";
import { formatMoney, todayISO } from "@/lib/format";
import { hapticSuccess, hapticTap } from "@/lib/haptic";
import {
  currentIsoWeekKey,
  currentMonthKey,
  previousIsoWeekRange,
  previousMonthRange,
} from "@/lib/report-periods";
import {
  buildMonthlyNetWorthReport,
  buildWeeklyLedgerReport,
  monthlyReportToSlides,
  weeklyReportToSlides,
  type WrappedSlide,
} from "@/lib/wrapped-reports";
import { useWorthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";

type ActiveReport = { type: "weekly" | "monthly"; slides: WrappedSlide[] };

function slideIcon(slide: WrappedSlide) {
  if (slide.kind === "intro") {
    return slide.accent === "ledger" ? Receipt : TrendingUp;
  }
  if (slide.kind === "outro") return Sparkles;
  return null;
}

export function WrappedReportFlow() {
  const { t } = useI18n();
  const transactions = useWorthStore((s) => s.transactions);
  const snapshots = useWorthStore((s) => s.snapshots);
  const accounts = useWorthStore((s) => s.accounts);
  const currencies = useWorthStore((s) => s.currencies);
  const settings = useWorthStore((s) => s.settings);
  const trigger = useWorthStore((s) => s.wrappedReportTrigger);
  const clearTrigger = useWorthStore((s) => s.clearWrappedReportTrigger);
  const markWeeklySeen = useWorthStore((s) => s.markWeeklyReportSeen);
  const markMonthlySeen = useWorthStore((s) => s.markMonthlyReportSeen);

  const [active, setActive] = useState<ActiveReport | null>(null);
  const [queue, setQueue] = useState<ActiveReport[]>([]);
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const autoChecked = useRef(false);

  const today = todayISO();

  const money = useCallback(
    (n: number, opts?: { showSign?: boolean; compact?: boolean }) =>
      formatMoney(n, settings.baseCurrency, currencies, {
        privacy: settings.isPrivacyMode,
        ...opts,
      }),
    [settings.baseCurrency, settings.isPrivacyMode, currencies],
  );

  const buildWeekly = useCallback((): ActiveReport | null => {
    const range = previousIsoWeekRange(today);
    const label = `${range.start} → ${range.end}`;
    const report = buildWeeklyLedgerReport(
      transactions,
      currencies,
      range.start,
      range.end,
      range.key,
      label,
    );
    if (!report) return null;
    return { type: "weekly", slides: weeklyReportToSlides(report, money) };
  }, [transactions, currencies, today, money]);

  const buildMonthly = useCallback((): ActiveReport | null => {
    const month = previousMonthRange(today);
    const report = buildMonthlyNetWorthReport(
      snapshots,
      accounts,
      month.start,
      month.end,
      month.key,
      month.label,
    );
    if (!report) return null;
    return { type: "monthly", slides: monthlyReportToSlides(report, money) };
  }, [snapshots, accounts, today, money]);

  const openReport = useCallback((report: ActiveReport) => {
    setActive(report);
    setStep(0);
    setAnimKey((k) => k + 1);
    hapticTap();
  }, []);

  useEffect(() => {
    if (!trigger) return;
    const report = trigger === "weekly" ? buildWeekly() : buildMonthly();
    clearTrigger();
    if (report) openReport(report);
  }, [trigger, buildWeekly, buildMonthly, clearTrigger, openReport]);

  useEffect(() => {
    if (!settings.onboardingCompleted || autoChecked.current) return;
    autoChecked.current = true;

    const pending: ActiveReport[] = [];
    const weekKey = currentIsoWeekKey(today);
    if (settings.lastWeeklyReportSeenKey !== weekKey) {
      const weekly = buildWeekly();
      if (weekly) pending.push(weekly);
    }
    const monthKey = currentMonthKey(today);
    if (settings.lastMonthlyReportSeenKey !== monthKey) {
      const monthly = buildMonthly();
      if (monthly) pending.push(monthly);
    }

    if (pending.length > 0) {
      openReport(pending[0]);
      if (pending.length > 1) setQueue(pending.slice(1));
    }
  }, [
    settings.onboardingCompleted,
    settings.lastWeeklyReportSeenKey,
    settings.lastMonthlyReportSeenKey,
    buildWeekly,
    buildMonthly,
    openReport,
    today,
  ]);

  const finishReport = useCallback(() => {
    if (!active) return;
    if (active.type === "weekly") {
      markWeeklySeen(currentIsoWeekKey(today));
    } else {
      markMonthlySeen(currentMonthKey(today));
    }
    hapticSuccess();

    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      openReport(next);
      return;
    }
    setActive(null);
    setStep(0);
  }, [active, queue, markWeeklySeen, markMonthlySeen, openReport, today]);

  const advance = useCallback(() => {
    if (!active) return;
    hapticTap();
    if (step >= active.slides.length - 1) {
      finishReport();
      return;
    }
    setStep((s) => s + 1);
    setAnimKey((k) => k + 1);
  }, [active, step, finishReport]);

  const slide = active?.slides[step];
  const progress = active ? ((step + 1) / active.slides.length) * 100 : 0;

  const toneColor = useMemo(() => {
    if (!slide || slide.kind === "intro" || slide.kind === "outro") return "var(--accent)";
    if (slide.kind === "stat" || slide.kind === "rank") {
      if (slide.tone === "positive") return "var(--positive)";
      if (slide.tone === "negative") return "var(--negative)";
    }
    return "var(--fg)";
  }, [slide]);

  if (!active || !slide) return null;

  const Icon = slideIcon(slide);

  return (
    <div
      className="fixed inset-0 z-[85] flex flex-col"
      style={{ background: "var(--bg)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wrapped-slide-title"
    >
      <header
        className="flex shrink-0 items-center justify-between px-4 pt-4"
        style={{ paddingTop: "calc(16px + var(--safe-top))" }}
      >
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--bg-muted)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "var(--accent)" }}
          />
        </div>
        <button
          type="button"
          className="btn-ghost ml-3 shrink-0 text-sm font-semibold"
          onClick={finishReport}
        >
          {t("reports.close")}
        </button>
      </header>

      <button
        type="button"
        className="flex flex-1 flex-col items-center justify-center px-8 text-center"
        onClick={advance}
        aria-label="Next slide"
      >
        <div
          key={animKey}
          className="wrapped-slide-enter mx-auto flex w-full max-w-md flex-col items-center gap-4"
        >
          {Icon ? (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <Icon size={32} strokeWidth={2} />
            </div>
          ) : null}

          {slide.kind === "intro" && (
            <>
              <h1 id="wrapped-slide-title" className="font-display text-3xl leading-tight">
                {slide.title}
              </h1>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{slide.subtitle}</p>
            </>
          )}

          {slide.kind === "stat" && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--fg-subtle)" }}>
                {slide.label}
              </p>
              <p
                className="font-display text-4xl font-bold tabular-nums tracking-tight sm:text-5xl"
                style={{ color: toneColor }}
              >
                {slide.value}
              </p>
              {slide.hint ? (
                <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{slide.hint}</p>
              ) : null}
            </>
          )}

          {slide.kind === "rank" && (
            <>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: "var(--fg-subtle)" }}
              >
                #{slide.rank}
              </p>
              <h2 id="wrapped-slide-title" className="font-display text-2xl leading-tight">
                {slide.title}
              </h2>
              {slide.subtitle ? (
                <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{slide.subtitle}</p>
              ) : null}
              <p
                className="mt-2 text-3xl font-bold tabular-nums"
                style={{ color: toneColor }}
              >
                {slide.value}
              </p>
            </>
          )}

          {slide.kind === "outro" && (
            <>
              <h2 id="wrapped-slide-title" className="font-display text-3xl leading-tight">
                {slide.title}
              </h2>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{slide.subtitle}</p>
            </>
          )}

          <p className="mt-6 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>
            {t("reports.tapContinue")}
          </p>
        </div>
      </button>

      <footer
        className="shrink-0 px-6 py-4"
        style={{ paddingBottom: "calc(16px + var(--safe-bottom))" }}
      >
        <button type="button" className="btn-primary mx-auto w-full max-w-md justify-center" onClick={advance}>
          {step >= active.slides.length - 1 ? t("reports.done") : t("reports.next")}
        </button>
      </footer>
    </div>
  );
}
