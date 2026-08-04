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
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      resyncAccounts();
      setHydrated(true);
    };

    // Persist may finish before this effect runs — check immediately and
    // subscribe for the late case. Also fall back if either path misses.
    const unsub = useWorthStore.persist.onFinishHydration(finish);
    if (useWorthStore.persist.hasHydrated()) {
      finish();
    } else {
      // Force a client-side rehydrate when SSR left the store unhydrated.
      void Promise.resolve(useWorthStore.persist.rehydrate()).then(finish);
    }

    const safety = window.setTimeout(finish, 1500);

    return () => {
      cancelled = true;
      unsub();
      window.clearTimeout(safety);
    };
  }, [setHydrated, resyncAccounts]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-2xl">WorthBook</p>
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
