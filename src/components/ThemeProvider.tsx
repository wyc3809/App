"use client";

import { useEffect } from "react";
import { useWorthStore } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useWorthStore((s) => s.settings.theme);
  const hydrated = useWorthStore((s) => s.hydrated);

  useEffect(() => {
    const root = document.documentElement;

    const apply = (mode: "light" | "dark") => {
      root.classList.toggle("dark", mode === "dark");
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches ? "dark" : "light");
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    apply(theme);
  }, [theme, hydrated]);

  return <>{children}</>;
}
