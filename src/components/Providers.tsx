"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useWorthStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useWorthStore((s) => s.hydrated);
  const setHydrated = useWorthStore((s) => s.setHydrated);

  useEffect(() => {
    // Fallback if persist rehydration callback already fired
    const unsub = useWorthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useWorthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, [setHydrated]);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-2xl">WorthTracker</p>
          <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
            Loading your portfolio…
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AppShell>{children}</AppShell>
    </ThemeProvider>
  );
}
