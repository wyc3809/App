import {
  ledgerDeltaForDisplay,
  storedBalanceAsSigned,
} from "./ledger";
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

function resolveInitialLiabilityState(
  chronological: AccountValueEntry[],
  currentIsLiability: boolean,
): boolean {
  let isLiability = currentIsLiability;
  for (let i = chronological.length - 1; i >= 0; i -= 1) {
    const flip = chronological[i].typeFlip;
    if (flip) isLiability = flip.fromIsLiability;
  }
  return isLiability;
}

export function buildAccountHistoryPoints(
  entries: AccountValueEntry[],
  accountId: string,
  currentIsLiability = false,
): ValueHistoryPoint[] {
  const chronological = getAccountEntries(entries, accountId).slice().reverse();
  let isLiability = resolveInitialLiabilityState(chronological, currentIsLiability);

  const points = chronological.map((entry, index) => {
    const prev = index > 0 ? chronological[index - 1] : null;
    const prevSigned = prev
      ? storedBalanceAsSigned(prev.value, isLiability)
      : null;
    const changeAbsolute =
      entry.delta != null
        ? ledgerDeltaForDisplay(entry.delta, isLiability)
        : prevSigned != null
          ? storedBalanceAsSigned(entry.value, isLiability) - prevSigned
          : null;
    const changePercent =
      changeAbsolute == null || prevSigned == null
        ? null
        : prevSigned === 0
          ? 0
          : (changeAbsolute / Math.abs(prevSigned)) * 100;
    const d = new Date(`${entry.date}T00:00:00`);
    const point: ValueHistoryPoint = {
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
    if (entry.typeFlip) {
      isLiability = entry.typeFlip.toIsLiability;
    }
    return point;
  });

  return points.reverse();
}

export function filterHistoryByRange(
  points: ValueHistoryPoint[],
  range: TimeRange | "YTD" | "2Y" | "4Y" | "5Y" | "8Y",
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
                  : range === "5Y"
                    ? 1825
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
