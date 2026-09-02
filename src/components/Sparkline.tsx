"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import { buildAccountHistoryPoints } from "@/lib/account-history";
import type { AccountValueEntry } from "@/lib/types";

export function Sparkline({
  entries,
  accountId,
  isLiability,
}: {
  entries: AccountValueEntry[];
  accountId: string;
  isLiability?: boolean;
}) {
  const points = buildAccountHistoryPoints(entries, accountId, isLiability ?? false)
    .slice()
    .reverse()
    .map((p) => ({
      v: isLiability ? -Math.abs(p.value) : p.value,
    }));

  if (points.length < 2) {
    return (
      <div
        className="h-8 w-12 rounded"
        style={{ background: "var(--bg-muted)" }}
      />
    );
  }

  const first = points[0].v;
  const last = points[points.length - 1].v;
  const up = last >= first;
  // Liabilities: falling balance is good (green)
  const good = isLiability ? last >= first : up;
  const stroke = good ? "var(--positive)" : "var(--negative)";

  return (
    <div className="h-8 w-12">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.8}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
