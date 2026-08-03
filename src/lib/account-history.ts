import type { Account, AccountValueEntry, TimeRange } from "./types";

export function getAccountEntries(
  entries: AccountValueEntry[],
  accountId: string,
): AccountValueEntry[] {
  return entries
    .filter((e) => e.accountId === accountId)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );
}

export function getLatestEntry(
  entries: AccountValueEntry[],
  accountId: string,
): AccountValueEntry | null {
  const list = getAccountEntries(entries, accountId);
  return list[0] ?? null;
}

export interface ValueHistoryPoint {
  entryId: string;
  date: string;
  label: string;
  value: number;
  note?: string;
  markOnGraph: boolean;
  changeAbsolute: number | null;
  changePercent: number | null;
  /** Present when this row came from a linked ledger transaction. */
  transactionId?: string;
  delta?: number;
}

export function buildAccountHistoryPoints(
  entries: AccountValueEntry[],
  accountId: string,
): ValueHistoryPoint[] {
  const chronological = getAccountEntries(entries, accountId).slice().reverse();
  return chronological
    .map((entry, index) => {
      const prev = index > 0 ? chronological[index - 1] : null;
      const changeAbsolute =
        entry.delta != null
          ? entry.delta
          : prev
            ? entry.value - prev.value
            : null;
      const changePercent =
        changeAbsolute == null || prev == null
          ? null
          : prev.value === 0
            ? 0
            : (changeAbsolute / Math.abs(prev.value)) * 100;
      const d = new Date(`${entry.date}T00:00:00`);
      return {
        entryId: entry.id,
        date: entry.date,
        label: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        value: entry.value,
        note: entry.note,
        markOnGraph: entry.markOnGraph,
        changeAbsolute,
        changePercent,
        transactionId: entry.transactionId,
        delta: entry.delta,
      };
    })
    .reverse();
}

export function filterHistoryByRange(
  points: ValueHistoryPoint[],
  range: TimeRange | "YTD" | "2Y" | "4Y" | "8Y",
): ValueHistoryPoint[] {
  if (range === "ALL" || points.length === 0) return points;
  const now = new Date();
  let cutoff = new Date(now);
  if (range === "YTD") {
    cutoff = new Date(now.getFullYear(), 0, 1);
  } else {
    const days =
      range === "1M"
        ? 30
        : range === "3M"
          ? 90
          : range === "6M"
            ? 180
            : range === "1Y"
              ? 365
              : range === "2Y"
                ? 730
                : range === "4Y"
                  ? 1460
                  : 2920;
    cutoff.setDate(cutoff.getDate() - days);
  }
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  const filtered = points.filter((p) => p.date >= cutoffISO);
  return filtered.length > 0 ? filtered : points.slice(0, 1);
}

export function accountDisplayValue(account: Account): number {
  return account.isLiability ? -Math.abs(account.currentValue) : account.currentValue;
}

export function relativeUpdateLabel(isoDate: string): string {
  const then = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "a day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 60) return "a month ago";
  return isoDate;
}
