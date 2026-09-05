"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Fingerprint, Lock } from "lucide-react";
import {
  authenticateBiometric,
  getBiometricAvailability,
} from "@/lib/biometric";
import { useWorthStore } from "@/lib/store";
import { useI18n } from "@/lib/i18n/context";

/** Ignore brief inactive blips (Face ID sheet, Control Center, etc.). */
const BACKGROUND_RELOCK_MS = 2000;
/** Suppress appStateChange right after verifyIdentity returns. */
const UNLOCK_COOLDOWN_MS = 750;

/**
 * Full-screen lock when biometric preference is on (native Face ID / Touch ID).
 * Re-locks after a real background stay — not when the Face ID sheet makes
 * the app briefly inactive (that used to loop unlock → inactive → unlock).
 */
export function AppLock({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const enabled = useWorthStore((s) => s.settings.isBiometricEnabled);
  const updateSettings = useWorthStore((s) => s.updateSettings);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!enabled);

  const unlockingRef = useRef(false);
  const backgroundedAtRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  const unlock = useCallback(async () => {
    if (unlockingRef.current) return;
    unlockingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const ok = await authenticateBiometric("Unlock WorthBook");
      if (ok) {
        setLocked(false);
      } else {
        setError(t("appLock.failed"));
      }
    } finally {
      setBusy(false);
      // Face ID dismiss still fires appStateChange; ignore it briefly.
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = setTimeout(() => {
        unlockingRef.current = false;
        cooldownTimerRef.current = null;
      }, UNLOCK_COOLDOWN_MS);
    }
  }, [t]);

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
  }, [enabled, unlock, updateSettings]);

  useEffect(() => {
    if (!enabled) return;

    let remove: (() => void) | undefined;
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener(
          "appStateChange",
          ({ isActive }) => {
            if (!isActive) {
              // Face ID / system UI also marks the app inactive — do not lock yet.
              if (unlockingRef.current) return;
              backgroundedAtRef.current = Date.now();
              return;
            }

            // Became active again
            if (unlockingRef.current) {
              backgroundedAtRef.current = null;
              return;
            }

            const bgAt = backgroundedAtRef.current;
            backgroundedAtRef.current = null;
            const awayMs = bgAt ? Date.now() - bgAt : 0;

            // Brief inactive (Face ID sheet, notification shade) — stay put.
            if (awayMs < BACKGROUND_RELOCK_MS) return;

            // Real background stay — require biometrics again.
            setLocked(true);
            setError(null);
            void unlock();
          },
        );
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
