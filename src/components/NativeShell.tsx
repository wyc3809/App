"use client";

import { useEffect } from "react";
import { hideNativeSplash, syncNativeChrome } from "@/lib/native-shell";
import { useWorthStore } from "@/lib/store";

function resolveChromeMode(theme: string): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Native-only polish: hide splash after hydration, sync status bar with theme.
 */
export function NativeShell() {
  const theme = useWorthStore((s) => s.settings.theme);
  const hydrated = useWorthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    void hideNativeSplash();
    void syncNativeChrome(resolveChromeMode(theme));

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => void syncNativeChrome(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, hydrated]);

  return null;
}
