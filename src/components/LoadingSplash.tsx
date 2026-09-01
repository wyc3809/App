"use client";

import { BrandMark } from "@/components/BrandMark";
import { DEFAULT_LOCALE, isLocale, translate, type Locale } from "@/lib/i18n";

function bootLocale(): Locale {
  try {
    const raw = localStorage.getItem("worthtracker-v1");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { settings?: { locale?: unknown } } };
      const loc = parsed.state?.settings?.locale;
      if (isLocale(loc)) return loc;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function LoadingSplash() {
  const message = translate(bootLocale(), "loading");

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "var(--accent-soft)" }}
      >
        <BrandMark className="h-11 w-11" />
      </div>
      <div className="text-center">
        <p className="font-display text-2xl">WorthBook</p>
        <p className="mt-2 text-sm" style={{ color: "var(--fg-muted)" }}>
          {message}
        </p>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loading-dot h-1.5 w-1.5 rounded-full"
            style={{
              background: "var(--accent)",
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
