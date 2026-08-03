"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useWorthStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useWorthStore((s) => s.hydrated);
  const setHydrated = useWorthStore((s) => s.setHydrated);
  const resyncAccounts = useWorthStore((s) => s.resyncAccounts);

  useEffect(() => {
    const finish = () => {
      resyncAccounts();
      setHydrated(true);
    };
    const unsub = useWorthStore.persist.onFinishHydration(finish);
    if (useWorthStore.persist.hasHydrated()) finish();
    return unsub;
  }, [setHydrated, resyncAccounts]);

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
