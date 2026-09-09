/** Local-only daily habit streak (Duolingo-style, optional helper). */

export const STREAK_MILESTONES = [3, 7, 30, 100] as const;

export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** YYYY-MM-DD of the last day that counted toward the streak. */
  lastActivityDate: string | null;
  /** Remaining streak freezes (each covers one missed calendar day). */
  freezesRemaining: number;
  /** Milestone day counts already unlocked. */
  milestonesUnlocked: number[];
}

export interface RecordActivityResult {
  streak: StreakState;
  /** True when this call counted a new calendar day and grew the streak. */
  extended: boolean;
  /** True when freezes covered a gap before extending. */
  usedFreeze: boolean;
  /** True when the streak reset to 1 after a multi-day gap. */
  broken: boolean;
  /** Milestones newly crossed on this extension. */
  newMilestones: number[];
}

export const DEFAULT_STREAK: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  freezesRemaining: 2,
  milestonesUnlocked: [],
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Inclusive calendar-day difference (UTC date parts of ISO YYYY-MM-DD). */
export function calendarDaysBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / DAY_MS);
}

export function normalizeStreakState(
  partial?: Partial<StreakState> | null,
): StreakState {
  return {
    ...DEFAULT_STREAK,
    ...partial,
    milestonesUnlocked: Array.isArray(partial?.milestonesUnlocked)
      ? [...new Set(partial.milestonesUnlocked.filter((n) => Number.isFinite(n)))]
      : [],
    freezesRemaining: Math.max(
      0,
      Math.floor(partial?.freezesRemaining ?? DEFAULT_STREAK.freezesRemaining),
    ),
    currentStreak: Math.max(0, Math.floor(partial?.currentStreak ?? 0)),
    longestStreak: Math.max(0, Math.floor(partial?.longestStreak ?? 0)),
    lastActivityDate:
      typeof partial?.lastActivityDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(partial.lastActivityDate)
        ? partial.lastActivityDate
        : null,
  };
}

export function hasCheckedInToday(
  streak: StreakState,
  todayISO: string,
): boolean {
  return streak.lastActivityDate === todayISO;
}

/** Mon→Sun week strip dates ending on the week that contains `todayISO`. */
export function weekActivityDates(
  streak: StreakState,
  todayISO: string,
): { date: string; active: boolean; isToday: boolean }[] {
  const [y, m, d] = todayISO.split("-").map(Number);
  const today = new Date(Date.UTC(y, m - 1, d));
  // JS: 0=Sun … 6=Sat → convert to Mon=0 … Sun=6
  const dow = (today.getUTCDay() + 6) % 7;
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - dow);

  const last = streak.lastActivityDate;
  const streakLen = streak.currentStreak;

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    const date = day.toISOString().slice(0, 10);
    let active = false;
    if (last && streakLen > 0) {
      const dist = calendarDaysBetween(date, last);
      active = dist >= 0 && dist < streakLen;
    }
    return { date, active, isToday: date === todayISO };
  });
}

/**
 * Record a qualifying activity for `todayISO`.
 * Same-day repeats are no-ops. Gaps of N days consume N freezes when available.
 */
export function recordDailyActivity(
  streak: StreakState,
  todayISO: string,
): RecordActivityResult {
  const prev = normalizeStreakState(streak);

  if (prev.lastActivityDate === todayISO) {
    return {
      streak: prev,
      extended: false,
      usedFreeze: false,
      broken: false,
      newMilestones: [],
    };
  }

  let currentStreak = 1;
  let freezesRemaining = prev.freezesRemaining;
  let usedFreeze = false;
  let broken = false;

  if (prev.lastActivityDate) {
    const gap = calendarDaysBetween(prev.lastActivityDate, todayISO);
    if (gap <= 0) {
      // Clock skew / backdated — treat as already counted if not after last.
      return {
        streak: prev,
        extended: false,
        usedFreeze: false,
        broken: false,
        newMilestones: [],
      };
    }
    const missed = gap - 1;
    if (missed === 0) {
      currentStreak = prev.currentStreak + 1;
    } else if (freezesRemaining >= missed) {
      freezesRemaining -= missed;
      usedFreeze = true;
      currentStreak = prev.currentStreak + 1;
    } else {
      broken = prev.currentStreak > 0;
      currentStreak = 1;
    }
  }

  const longestStreak = Math.max(prev.longestStreak, currentStreak);
  const unlocked = new Set(prev.milestonesUnlocked);
  const newMilestones: number[] = [];
  for (const m of STREAK_MILESTONES) {
    if (currentStreak >= m && !unlocked.has(m)) {
      unlocked.add(m);
      newMilestones.push(m);
    }
  }

  return {
    streak: {
      currentStreak,
      longestStreak,
      lastActivityDate: todayISO,
      freezesRemaining,
      milestonesUnlocked: [...unlocked].sort((a, b) => a - b),
    },
    extended: true,
    usedFreeze,
    broken,
    newMilestones,
  };
}
