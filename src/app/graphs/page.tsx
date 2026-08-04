"use client";

import { AllocationChart } from "@/components/AllocationChart";
import { CashflowBarChart } from "@/components/CashflowBarChart";
import { LedgerCalendarHeatmap } from "@/components/LedgerCalendarHeatmap";
import { MonthlyGrowthCard } from "@/components/MonthlyGrowthCard";
import { TrendChart } from "@/components/TrendChart";

export default function GraphsPage() {
  return (
    <div className="space-y-4 pb-4">
      <header className="animate-fade-up">
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--fg-subtle)" }}
        >
          Insights
        </p>
        <h1 className="mt-1 font-display text-3xl">Graphs</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          Allocation, cashflow, trends, and spending calendar.
        </p>
      </header>

      <div className="space-y-4 animate-fade-up-delay">
        <AllocationChart />
        <CashflowBarChart />
        <LedgerCalendarHeatmap />
        <MonthlyGrowthCard />
        <TrendChart />
      </div>
    </div>
  );
}
