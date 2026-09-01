"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LoadingSplash } from "@/components/LoadingSplash";
import { ThemeProvider } from "@/components/ThemeProvider";
import {
  isStorageNearFull,
  MIRROR_KEY,
  restoreMirrorToLocalStorage,
  writePersistMirror,
} from "@/lib/idb-mirror";
import { shouldSkipServiceWorker } from "@/lib/platform";
import { useWorthStore } from "@/lib/store";
import { AppLock } from "@/components/AppLock";
import { IntroductionFlow } from "@/components/IntroductionFlow";
import { LocaleSync } from "@/lib/i18n/context";
import { useI18n } from "@/lib/i18n/context";

function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (shouldSkipServiceWorker()) return;

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

function mirrorLocalPersist() {
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    if (raw) void writePersistMirror(raw);
  } catch {
    /* ignore quota / private mode */
  }
}

function StorageWarning() {
  const { t } = useI18n();
  return (
    <div
      className="mb-3 rounded-2xl px-3 py-2 text-xs"
      style={{
        background: "var(--danger-soft)",
        color: "var(--danger)",
      }}
      role="status"
    >
      {t("storage.nearFull")}
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useWorthStore((s) => s.hydrated);
  const setHydrated = useWorthStore((s) => s.setHydrated);
  const resyncAccounts = useWorthStore((s) => s.resyncAccounts);
  const [storageWarn, setStorageWarn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (cancelled) return;
      resyncAccounts();
      setHydrated(true);
      mirrorLocalPersist();
    };

    const boot = async () => {
      await restoreMirrorToLocalStorage();
      const unsub = useWorthStore.persist.onFinishHydration(finish);
      if (useWorthStore.persist.hasHydrated()) {
        finish();
      } else {
        void Promise.resolve(useWorthStore.persist.rehydrate()).then(finish);
      }
      return unsub;
    };

    let unsubPersist: (() => void) | undefined;
    void boot().then((u) => {
      unsubPersist = u;
    });

    const unsubStore = useWorthStore.subscribe(() => {
      mirrorLocalPersist();
    });

    void isStorageNearFull().then((near) => {
      if (!cancelled) setStorageWarn(near);
    });

    return () => {
      cancelled = true;
      unsubPersist?.();
      unsubStore();
    };
  }, [setHydrated, resyncAccounts]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  if (!hydrated) {
    return <LoadingSplash />;
  }

  return (
    <ThemeProvider>
      <LocaleSync />
      <AppLock>
        <AppShell>
          <IntroductionFlow />
          {storageWarn ? <StorageWarning /> : null}
          {children}
        </AppShell>
      </AppLock>
    </ThemeProvider>
  );
}
