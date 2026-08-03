"use client";

import { Suspense } from "react";
import { AccountDetailContent } from "@/components/AccountDetailContent";

export default function AccountDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-sm" style={{ color: "var(--fg-muted)" }}>
          Loading account…
        </div>
      }
    >
      <AccountDetailContent />
    </Suspense>
  );
}
