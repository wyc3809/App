"use client";

import Link from "next/link";
import { Camera, Plus, Sparkles } from "lucide-react";
import { AllocationChart } from "@/components/AllocationChart";
import { MonthlyGrowthCard } from "@/components/MonthlyGrowthCard";
import { NetWorthHero } from "@/components/NetWorthHero";
import { TrendChart } from "@/components/TrendChart";
import { useWorthStore } from "@/lib/store";

export default function DashboardPage() {
  const accounts = useWorthStore((s) => s.accounts);
  const takeSnapshot = useWorthStore((s) => s.takeSnapshot);
  const loadDemoData = useWorthStore((s) => s.loadDemoData);

  return (
    <div className="space-y-4 pb-4">
      <NetWorthHero />

      <div className="flex gap-2 animate-fade-up">
        <Link href="/accounts?new=1" className="btn-primary flex-1">
          <Plus size={18} />
          Add Account
        </Link>
        <button
          type="button"
          className="btn-secondary flex-1"
          onClick={() => {
            takeSnapshot();
            alert("Snapshot saved for today.");
          }}
          disabled={accounts.length === 0}
        >
          <Camera size={18} />
          Snapshot
        </button>
      </div>

      {accounts.length === 0 && (
        <section
          className="rounded-2xl p-4 text-sm"
          style={{ background: "var(--accent-soft)", color: "var(--fg)" }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={18} style={{ color: "var(--accent)" }} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Start fresh or explore a sample portfolio</p>
              <p className="mt-1" style={{ color: "var(--fg-muted)" }}>
                Data stays on this device. Nothing is uploaded.
              </p>
              <button type="button" className="btn-primary mt-3" onClick={loadDemoData}>
                Load demo data
              </button>
            </div>
          </div>
        </section>
      )}

      <TrendChart />
      <MonthlyGrowthCard />
      <AllocationChart />
    </div>
  );
}
