"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChartPie,
  ChevronDown,
  LineChart,
  TrendingUp,
} from "lucide-react";
import { AllocationChart } from "@/components/AllocationChart";
import { CashflowBarChart } from "@/components/CashflowBarChart";
import { LedgerCalendarHeatmap } from "@/components/LedgerCalendarHeatmap";
import { MonthlyGrowthCard } from "@/components/MonthlyGrowthCard";
import { TrendChart } from "@/components/TrendChart";

const CHARTS = [
  {
    id: "allocation",
    label: "Allocation",
    description: "Pie chart by category",
    icon: ChartPie,
  },
  {
    id: "cashflow",
    label: "Cashflow",
    description: "Income vs expense bars",
    icon: BarChart3,
  },
  {
    id: "calendar",
    label: "Calendar",
    description: "Spending heatmap",
    icon: CalendarDays,
  },
  {
    id: "growth",
    label: "Growth",
    description: "Monthly growth bars",
    icon: TrendingUp,
  },
  {
    id: "trend",
    label: "Trend",
    description: "Net worth over time",
    icon: LineChart,
  },
] as const;

type ChartId = (typeof CHARTS)[number]["id"];

export default function GraphsPage() {
  const [chartId, setChartId] = useState<ChartId>("allocation");
  const [pickerOpen, setPickerOpen] = useState(false);

  const active = CHARTS.find((c) => c.id === chartId) ?? CHARTS[0];
  const ActiveIcon = active.icon;

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
      </header>

      <div className="relative z-20 animate-fade-up-delay">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
          aria-haspopup="listbox"
          aria-expanded={pickerOpen}
          onClick={() => setPickerOpen((v) => !v)}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <ActiveIcon size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{active.label}</span>
              <span
                className="block truncate text-xs"
                style={{ color: "var(--fg-subtle)" }}
              >
                {active.description}
              </span>
            </span>
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 transition ${pickerOpen ? "rotate-180" : ""}`}
            style={{ color: "var(--fg-muted)" }}
          />
        </button>

        {pickerOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 cursor-default"
              aria-label="Close chart picker"
              onClick={() => setPickerOpen(false)}
            />
            <ul
              role="listbox"
              aria-label="Choose chart"
              className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-2xl border shadow-lg"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              {CHARTS.map((chart) => {
                const Icon = chart.icon;
                const selected = chart.id === chartId;
                return (
                  <li key={chart.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition"
                      style={{
                        background: selected
                          ? "var(--accent-soft)"
                          : "transparent",
                      }}
                      onClick={() => {
                        setChartId(chart.id);
                        setPickerOpen(false);
                      }}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: selected
                            ? "color-mix(in srgb, var(--accent) 18%, transparent)"
                            : "var(--bg-muted)",
                          color: selected ? "var(--accent)" : "var(--fg-muted)",
                        }}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block text-sm font-semibold"
                          style={{
                            color: selected ? "var(--accent)" : "var(--fg)",
                          }}
                        >
                          {chart.label}
                        </span>
                        <span
                          className="block text-xs"
                          style={{ color: "var(--fg-subtle)" }}
                        >
                          {chart.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="animate-fade-up-delay" key={chartId}>
        {chartId === "allocation" && <AllocationChart />}
        {chartId === "cashflow" && <CashflowBarChart />}
        {chartId === "calendar" && <LedgerCalendarHeatmap />}
        {chartId === "growth" && <MonthlyGrowthCard />}
        {chartId === "trend" && <TrendChart />}
      </div>
    </div>
  );
}
