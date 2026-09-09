import { describe, expect, it } from "vitest";
import {
  calendarDaysBetween,
  DEFAULT_STREAK,
  hasCheckedInToday,
  recordDailyActivity,
  weekActivityDates,
} from "./streak";

describe("calendarDaysBetween", () => {
  it("counts inclusive calendar gaps", () => {
    expect(calendarDaysBetween("2026-09-01", "2026-09-01")).toBe(0);
    expect(calendarDaysBetween("2026-09-01", "2026-09-02")).toBe(1);
    expect(calendarDaysBetween("2026-09-01", "2026-09-03")).toBe(2);
  });
});

describe("recordDailyActivity", () => {
  it("starts a streak on first activity", () => {
    const result = recordDailyActivity(DEFAULT_STREAK, "2026-09-09");
    expect(result.extended).toBe(true);
    expect(result.streak.currentStreak).toBe(1);
    expect(result.streak.lastActivityDate).toBe("2026-09-09");
  });

  it("is a no-op on the same day", () => {
    const first = recordDailyActivity(DEFAULT_STREAK, "2026-09-09");
    const second = recordDailyActivity(first.streak, "2026-09-09");
    expect(second.extended).toBe(false);
    expect(second.streak.currentStreak).toBe(1);
  });

  it("extends consecutive days", () => {
    let streak = DEFAULT_STREAK;
    for (const day of ["2026-09-07", "2026-09-08", "2026-09-09"]) {
      const result = recordDailyActivity(streak, day);
      expect(result.extended).toBe(true);
      streak = result.streak;
    }
    expect(streak.currentStreak).toBe(3);
    expect(streak.milestonesUnlocked).toContain(3);
  });

  it("uses a freeze to bridge one missed day", () => {
    const started = recordDailyActivity(DEFAULT_STREAK, "2026-09-07");
    const bridged = recordDailyActivity(started.streak, "2026-09-09");
    expect(bridged.extended).toBe(true);
    expect(bridged.usedFreeze).toBe(true);
    expect(bridged.broken).toBe(false);
    expect(bridged.streak.currentStreak).toBe(2);
    expect(bridged.streak.freezesRemaining).toBe(1);
  });

  it("resets when the gap exceeds freezes", () => {
    const started = {
      ...DEFAULT_STREAK,
      currentStreak: 5,
      longestStreak: 5,
      lastActivityDate: "2026-09-01",
      freezesRemaining: 1,
    };
    // Missed Sep 2–8 = 7 days; only 1 freeze → reset
    const result = recordDailyActivity(started, "2026-09-09");
    expect(result.broken).toBe(true);
    expect(result.streak.currentStreak).toBe(1);
    expect(result.streak.freezesRemaining).toBe(1);
  });
});

describe("hasCheckedInToday / weekActivityDates", () => {
  it("reports today check-in", () => {
    const streak = {
      ...DEFAULT_STREAK,
      currentStreak: 2,
      lastActivityDate: "2026-09-09",
    };
    expect(hasCheckedInToday(streak, "2026-09-09")).toBe(true);
    expect(hasCheckedInToday(streak, "2026-09-10")).toBe(false);
  });

  it("builds a Mon–Sun week strip from streak length", () => {
    // 2026-09-09 is Wednesday
    const streak = {
      ...DEFAULT_STREAK,
      currentStreak: 3,
      lastActivityDate: "2026-09-09",
    };
    const week = weekActivityDates(streak, "2026-09-09");
    expect(week).toHaveLength(7);
    expect(week[0].date).toBe("2026-09-07"); // Monday
    expect(week.map((d) => d.active)).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(week[2].isToday).toBe(true);
  });
});
