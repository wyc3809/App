import { Capacitor } from "@capacitor/core";

/** True when running inside the Capacitor iOS/Android shell. */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform();
}

export function nativePlatform(): "ios" | "android" | "web" {
  if (typeof window === "undefined") return "web";
  const p = Capacitor.getPlatform();
  if (p === "ios" || p === "android") return p;
  return "web";
}

/** Capacitor hosts their own offline shell — skip the web service worker. */
export function shouldSkipServiceWorker(): boolean {
  return isNativePlatform();
}
