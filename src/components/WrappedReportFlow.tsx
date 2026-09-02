"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  combinedReportToSlides,
  type WrappedRankItem,
  type WrappedSlide,
  type WrappedStatItem,
} from "@/lib/wrapped-reports";
import { useWorthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";

type ActiveReport = { slides: WrappedSlide[] };

function renderSlideIcon(slide: WrappedSlide) {
  if (slide.kind === "intro") {
    if (slide.accent === "ledger") return <Receipt size={32} strokeWidth={2} />;
    if (slide.accent === "networth") return <TrendingUp size={32} strokeWidth={2} />;
    return <Sparkles size={32} strokeWidth={2} />;
  }
  if (slide.kind === "outro") return <Sparkles size={32} strokeWidth={2} />;
  return null;
}

function toneColor(
  tone: WrappedStatItem["tone"] | WrappedRankItem["tone"] | undefined,
): string {
  if (tone === "positive") return "var(--positive)";
  if (tone === "negative") return "var(--negative)";
  return "var(--fg)";
}

function StatGroupSlide({ slide }: { slide: WrappedSlide & { kind: "statsGroup" } }) {
  return (
    <div className="w-full max-w-md space-y-1">
      {slide.heading ? (
        <p
          className="mb-4 text-xs font-bold uppercase tracking-[0.14em]"
          style={{ color: "var(--fg-subtle)" }}
        >
          {slide.heading}
        </p>
      ) : null}
      <div
        className="rounded-2xl px-4 py-3"
        style={{ background: "var(--bg-muted)" }}
      >
        {slide.items.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex items-baseline justify-between gap-3 py-3"
            style={{
              borderBottom:
                index < slide.items.length - 1
                  ? "1px solid var(--border-subtle)"
                  : undefined,
            }}
          >
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium" style={{ color: "var(--fg-muted)" }}>
                {item.label}
              </p>
              {item.hint ? (
                <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>{item.hint}</p>
              ) : null}
            </div>
            <p
              className="shrink-0 text-xl font-bold tabular-nums tracking-tight"
              style={{ color: toneColor(item.tone) }}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankListSlide({
  slide,
  animKey,
}: {
  slide: WrappedSlide & { kind: "rankList" };
  animKey: number;
}) {
  return (
    <div className="w-full max-w-md text-left">
      <h2 id="wrapped-slide-title" className="font-display mb-5 text-2xl leading-tight">
        {slide.heading}
      </h2>
      <ul className="space-y-2" aria-label={slide.heading}>
        {slide.items.map((item, index) => (
          <li
            key={`${animKey}-${item.rank}-${item.title}`}
            className="wrapped-rank-line wrapped-rank-line-visible flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{
              background: "var(--bg-muted)",
              animationDelay: `${0.12 + index * 0.38}s`,
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}
            >
              #{item.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{item.title}</p>
              {item.subtitle ? (
                <p className="truncate text-xs" style={{ color: "var(--fg-muted)" }}>
                  {item.subtitle}
                </p>
              ) : null}
            </div>
            <p
              className="shrink-0 text-sm font-bold tabular-nums"
              style={{ color: toneColor(item.tone) }}
            >
              {item.value}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
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

  const buildCombined = useCallback((): ActiveReport | null => {
    const weekRange = previousIsoWeekRange(today);
    const weekLabel = `${weekRange.start} → ${weekRange.end}`;
    const weekly = buildWeeklyLedgerReport(
      transactions,
      currencies,
      weekRange.start,
      weekRange.end,
      weekRange.key,
      weekLabel,
    );

    const month = previousMonthRange(today);
    const monthly = buildMonthlyNetWorthReport(
      snapshots,
      accounts,
      month.start,
      month.end,
      month.key,
      month.label,
    );

    const slides = combinedReportToSlides(weekly, monthly, money);
    if (!slides) return null;
    return { slides };
  }, [transactions, currencies, snapshots, accounts, today, money]);

  const openReport = useCallback((report: ActiveReport) => {
    setActive(report);
    setStep(0);
    setAnimKey((k) => k + 1);
    hapticTap();
  }, []);

  useEffect(() => {
    if (!trigger) return;
    const report = buildCombined();
    clearTrigger();
    if (report) openReport(report);
  }, [trigger, buildCombined, clearTrigger, openReport]);

  useEffect(() => {
    if (!settings.onboardingCompleted || autoChecked.current) return;
    autoChecked.current = true;

    const weekKey = currentIsoWeekKey(today);
    const monthKey = currentMonthKey(today);
    const weekPending = settings.lastWeeklyReportSeenKey !== weekKey;
    const monthPending = settings.lastMonthlyReportSeenKey !== monthKey;

    if (!weekPending && !monthPending) return;

    const combined = buildCombined();
    if (combined) openReport(combined);
  }, [
    settings.onboardingCompleted,
    settings.lastWeeklyReportSeenKey,
    settings.lastMonthlyReportSeenKey,
    buildCombined,
    openReport,
    today,
  ]);

  const finishReport = useCallback(() => {
    if (!active) return;
    markWeeklySeen(currentIsoWeekKey(today));
    markMonthlySeen(currentMonthKey(today));
    hapticSuccess();
    setActive(null);
    setStep(0);
  }, [active, markWeeklySeen, markMonthlySeen, today]);

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

  if (!active || !slide) return null;

  const slideIcon = renderSlideIcon(slide);
  const isRankList = slide.kind === "rankList";

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
        className={`flex flex-1 flex-col px-6 py-4 ${
          isRankList ? "items-stretch justify-start overflow-y-auto" : "items-center justify-center text-center"
        }`}
        onClick={advance}
        aria-label="Next slide"
      >
        <div
          key={animKey}
          className={`wrapped-slide-enter mx-auto flex w-full max-w-md flex-col gap-4 ${
            isRankList ? "items-stretch" : "items-center"
          }`}
        >
          {slideIcon ? (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl self-center"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {slideIcon}
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

          {slide.kind === "statsGroup" && <StatGroupSlide slide={slide} />}

          {slide.kind === "rankList" && <RankListSlide slide={slide} animKey={animKey} />}

          {slide.kind === "outro" && (
            <>
              <h2 id="wrapped-slide-title" className="font-display text-3xl leading-tight">
                {slide.title}
              </h2>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{slide.subtitle}</p>
            </>
          )}

          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              isRankList ? "mt-4 text-center" : "mt-6"
            }`}
            style={{ color: "var(--fg-subtle)" }}
          >
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
