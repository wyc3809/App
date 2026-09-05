import {
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";

export function isoWeekKeyFromDate(date: Date): string {
  const year = getISOWeekYear(date);
  const week = String(getISOWeek(date)).padStart(2, "0");
  return `${year}-W${week}`;
}

export function monthKeyFromDate(date: Date): string {
  return format(date, "yyyy-MM");
}

export function isoWeekRangeForDate(date: Date): { start: string; end: string } {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

export function previousIsoWeekRange(todayISO: string): {
  key: string;
  start: string;
  end: string;
} {
  const today = parseISO(todayISO);
  const prev = subWeeks(today, 1);
  const range = isoWeekRangeForDate(prev);
  return {
    key: isoWeekKeyFromDate(prev),
    ...range,
  };
}

export function currentIsoWeekKey(todayISO: string): string {
  return isoWeekKeyFromDate(parseISO(todayISO));
}

export function previousMonthRange(todayISO: string): {
  key: string;
  start: string;
  end: string;
  label: string;
} {
  const today = parseISO(todayISO);
  const prev = subMonths(today, 1);
  const start = startOfMonth(prev);
  const end = endOfMonth(prev);
  return {
    key: monthKeyFromDate(prev),
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
    label: prev.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
  };
}

export function currentMonthKey(todayISO: string): string {
  return todayISO.slice(0, 7);
}



export function currentIsoWeekRange(todayISO: string): {
  key: string;
  start: string;
  end: string;
} {
  const today = parseISO(todayISO);
  const range = isoWeekRangeForDate(today);
  return {
    key: isoWeekKeyFromDate(today),
    ...range,
  };
}

export function currentMonthRange(todayISO: string): {
  key: string;
  start: string;
  end: string;
  label: string;
} {
  const today = parseISO(todayISO);
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  return {
    key: monthKeyFromDate(today),
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
    label: today.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
  };
}
