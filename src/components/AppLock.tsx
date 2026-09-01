"use client";

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Lock } from "lucide-react";
import {
  authenticateBiometric,
  getBiometricAvailability,
} from "@/lib/biometric";
import { useWorthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";

/**
 * Full-screen lock when biometric preference is on (native Face ID / Touch ID).
 * Re-locks when the app returns from background. Skips on web builds.
 */
export function AppLock({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const enabled = useWorthStore((s) => s.settings.isBiometricEnabled);
  const updateSettings = useWorthStore((s) => s.updateSettings);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!enabled);

  const unlock = useCallback(async () => {
    setBusy(true);
    setError(null);
    const ok = await authenticateBiometric("Unlock WorthBook");
    setBusy(false);
    if (ok) {
      setLocked(false);
    } else {
      setError(t("appLock.failed"));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      setLocked(false);
      setReady(true);
      return;
    }

    void (async () => {
      const avail = await getBiometricAvailability();
      if (cancelled) return;
      if (!avail.available) {
        // Preference set on another build — don't soft-lock web/PWA users.
        updateSettings({ isBiometricEnabled: false });
        setLocked(false);
        setReady(true);
        return;
      }
      setLocked(true);
      setReady(true);
      await unlock();
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, unlock, updateSettings, t]);

  useEffect(() => {
    if (!enabled) return;

    let remove: (() => void) | undefined;
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) {
            setLocked(true);
            setError(null);
          } else {
            void unlock();
          }
        });
        remove = () => {
          void handle.remove();
        };
      } catch {
        /* web — no Cap App plugin */
      }
    })();

    return () => remove?.();
  }, [enabled, unlock]);

  if (!ready || !enabled || !locked) {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 px-8"
      style={{
        background: "var(--bg)",
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-lock-title"
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Lock size={28} />
      </div>
      <h1 id="app-lock-title" className="font-display text-2xl">
        {t("appLock.title")}
      </h1>
      <p className="text-center text-sm" style={{ color: "var(--fg-muted)" }}>
        {t("appLock.unlock")}
      </p>
      {error ? (
        <p className="text-center text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="btn-primary mt-2"
        disabled={busy}
        onClick={() => void unlock()}
      >
        <Fingerprint size={18} />
        {busy ? "Waiting…" : "Unlock"}
      </button>
    </div>
  );
}
