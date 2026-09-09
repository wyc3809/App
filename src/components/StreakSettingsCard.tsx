"use client";

import { Flame, Snowflake } from "lucide-react";
import { todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n/context";
import { hapticTap } from "@/lib/haptic";
import {
  hasCheckedInToday,
  STREAK_MILESTONES,
  weekActivityDates,
} from "@/lib/streak";
import { useWorthStore } from "@/lib/store";

const WEEKDAY_KEYS = [
  "streak.weekdayMon",
  "streak.weekdayTue",
  "streak.weekdayWed",
  "streak.weekdayThu",
  "streak.weekdayFri",
  "streak.weekdaySat",
  "streak.weekdaySun",
] as const;

/**
 * Compact optional habits card for Settings only — keeps Home / Accounts clean.
 */
export function StreakSettingsCard() {
  const { t } = useI18n();
  const streak = useWorthStore((s) => s.streak);
  const recordStreakActivity = useWorthStore((s) => s.recordStreakActivity);
  const today = todayISO();
  const checkedIn = hasCheckedInToday(streak, today);
  const week = weekActivityDates(streak, today);

  return (
    <section
      className="animate-fade-up-delay space-y-3 rounded-2xl border px-3.5 py-3.5"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg-muted)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--fg-subtle)" }}
          >
            {t("streak.sectionEyebrow")}
          </p>
          <h2 className="mt-0.5 text-base font-semibold">{t("streak.sectionTitle")}</h2>
          <p className="mt-1 text-xs leading-snug" style={{ color: "var(--fg-muted)" }}>
            {t("streak.sectionDesc")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1">
            <Flame size={16} style={{ color: "#ea580c" }} />
            <span className="text-lg font-bold tabular-nums">{streak.currentStreak}</span>
          </div>
          <p className="text-[10px]" style={{ color: "var(--fg-subtle)" }}>
            {t("streak.best").replace("{n}", String(streak.longestStreak))}
          </p>
        </div>
      </div>

      <div className="flex justify-between gap-1">
        {week.map((day, i) => (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[9px] font-medium" style={{ color: "var(--fg-subtle)" }}>
              {t(WEEKDAY_KEYS[i])}
            </span>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold"
              style={{
                background: day.active
                  ? "color-mix(in srgb, var(--accent) 22%, transparent)"
                  : "var(--bg-elevated)",
                color: day.active ? "var(--accent)" : "var(--fg-subtle)",
                outline: day.isToday ? "2px solid var(--accent)" : undefined,
                outlineOffset: 1,
              }}
              aria-label={day.date}
            >
              {day.active ? "✓" : ""}
            </span>
          </div>
        ))}
      </div>

      <div
        className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2"
        style={{ background: "var(--bg-elevated)" }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--fg-muted)" }}>
          <Snowflake size={14} style={{ color: "#38bdf8" }} />
          <span>
            {t("streak.freezesLeft").replace("{n}", String(streak.freezesRemaining))}
          </span>
        </div>
        <button
          type="button"
          className="min-h-9 rounded-lg px-3 text-xs font-semibold disabled:opacity-50"
          style={{
            background: checkedIn ? "var(--bg-muted)" : "var(--accent-soft)",
            color: checkedIn ? "var(--fg-muted)" : "var(--accent)",
          }}
          disabled={checkedIn}
          onClick={() => {
            hapticTap();
            recordStreakActivity();
          }}
        >
          {checkedIn ? t("streak.checkedIn") : t("streak.checkIn")}
        </button>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg-subtle)" }}>
          {t("streak.milestones")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {STREAK_MILESTONES.map((m) => {
            const unlocked = streak.milestonesUnlocked.includes(m);
            return (
              <span
                key={m}
                className="rounded-md px-2 py-1 text-[11px] font-semibold tabular-nums"
                style={{
                  background: unlocked
                    ? "color-mix(in srgb, var(--accent) 16%, transparent)"
                    : "var(--bg-elevated)",
                  color: unlocked ? "var(--accent)" : "var(--fg-subtle)",
                }}
              >
                {unlocked ? "★ " : ""}
                {t("streak.milestoneDays").replace("{n}", String(m))}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
