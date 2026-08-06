/**
 * Light tactile feedback — Capacitor Haptics on native, Vibration API on web.
 */

import { isNativePlatform } from "./platform";

export type HapticKind = "tap" | "success" | "warning";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 8,
  success: [10, 40, 12],
  warning: [25, 40, 25],
};

export function canHaptic(): boolean {
  try {
    if (typeof window !== "undefined" && isNativePlatform()) return true;
  } catch {
    /* ignore */
  }
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** Fire a short haptic pulse. Safe to call from render-free event handlers. */
export function haptic(kind: HapticKind = "tap"): boolean {
  try {
    if (typeof window !== "undefined" && isNativePlatform()) {
      void (async () => {
        try {
          const { Haptics, ImpactStyle, NotificationType } = await import(
            "@capacitor/haptics"
          );
          if (kind === "success") {
            await Haptics.notification({ type: NotificationType.Success });
          } else if (kind === "warning") {
            await Haptics.notification({ type: NotificationType.Warning });
          } else {
            await Haptics.impact({ style: ImpactStyle.Light });
          }
        } catch {
          /* ignore */
        }
      })();
      return true;
    }
  } catch {
    /* fall through to web vibrate */
  }

  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      return navigator.vibrate(PATTERNS[kind]);
    } catch {
      return false;
    }
  }
  return false;
}

export function hapticTap(): boolean {
  return haptic("tap");
}

export function hapticSuccess(): boolean {
  return haptic("success");
}
