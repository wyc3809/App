"use client";

import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useWorthStore } from "@/lib/store";

function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const manifest = document.querySelector(
    'link[rel="manifest"]',
  ) as HTMLLinkElement | null;
  const baseHref = manifest?.href
    ? new URL(".", manifest.href).href
    : new URL("./", window.location.href).href;
  const swHref = new URL("sw.js", baseHref).href;

  void navigator.serviceWorker
    .register(swHref, { scope: baseHref })
    .catch(() => {
      /* offline cache is best-effort */
    });
}

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

  useEffect(() => {
    registerServiceWorker();
  }, []);

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
