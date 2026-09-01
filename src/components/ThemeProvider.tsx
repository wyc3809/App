"use client";

import { useEffect } from "react";
import { useWorthStore } from "@/lib/store";
import { isNativePlatform } from "@/lib/platform";

function resolveMode(theme: "light" | "dark" | "system"): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useWorthStore((s) => s.settings.theme);
  const hydrated = useWorthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    const root = document.documentElement;

    const apply = (mode: "light" | "dark") => {
      root.classList.toggle("dark", mode === "dark");

      const themeColor = mode === "dark" ? "#0a0c0b" : "#f5f7f6";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", themeColor);

      if (isNativePlatform()) {
        void (async () => {
          try {
            const { StatusBar, Style } = await import("@capacitor/status-bar");
            await StatusBar.setStyle({
              style: mode === "dark" ? Style.Dark : Style.Light,
            });
            await StatusBar.setBackgroundColor({ color: themeColor });
          } catch {
            /* best-effort */
          }
        })();
      }
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) =>
        apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    apply(resolveMode(theme));
  }, [theme, hydrated]);

  return <>{children}</>;
}
