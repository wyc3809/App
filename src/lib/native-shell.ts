import { isNativePlatform } from "./platform";

export type NativeChromeMode = "light" | "dark";

/** Status bar text/icons — light content on dark backgrounds, dark on light. */
export async function syncNativeChrome(mode: NativeChromeMode): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({
      style: mode === "dark" ? Style.Light : Style.Dark,
    });
    // Android only; safe to call on iOS (no-op or ignored).
    await StatusBar.setBackgroundColor({
      color: mode === "dark" ? "#0a0c0b" : "#f5f7f6",
    });
  } catch {
    /* plugin unavailable */
  }
}

/** Hide Capacitor launch splash once the web layer is ready. */
export async function hideNativeSplash(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch {
    /* plugin unavailable */
  }
}
