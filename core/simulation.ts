import type { GameTimestamp } from '@interfaces/game';

export const TICKS_PER_SECOND = 1;
export const TICKS_PER_DAY_REALTIME = 86400;
export const TICKS_PER_DAY_FAST = 288;
export const TICKS_PER_HOUR = 3600;
export const MONTH_LENGTH = 30;

export function ticksPerDay(fast: boolean): number {
  return fast ? TICKS_PER_DAY_FAST : TICKS_PER_DAY_REALTIME;
}

export function advanceTick(ts: GameTimestamp, fast: boolean): GameTimestamp {
  const next = { ...ts, tick: ts.tick + 1 };
  const dayTicks = ticksPerDay(fast);
  if (next.tick >= dayTicks) {
    next.tick = 0;
    next.day += 1;
    if (next.day > MONTH_LENGTH) {
      next.day = 1;
      next.month += 1;
      if (next.month > 12) {
        next.month = 1;
        next.year += 1;
      }
    }
  }
  const hourSpan = Math.max(1, Math.floor(dayTicks / 24));
  next.hour = Math.min(23, Math.floor(next.tick / hourSpan));
  return next;
}

export function characterAge(birth: GameTimestamp, now: GameTimestamp): number {
  let age = now.year - birth.year;
  if (now.month < birth.month || (now.month === birth.month && now.day < birth.day)) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function absoluteTick(ts: GameTimestamp, fast: boolean): number {
  const dayTicks = ticksPerDay(fast);
  return (
    ts.year * 12 * MONTH_LENGTH * dayTicks +
    ts.month * MONTH_LENGTH * dayTicks +
    ts.day * dayTicks +
    ts.tick
  );
}
