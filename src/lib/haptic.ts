/**
 * Light tactile feedback for web (and future native wrappers).
 * Uses the Vibration API when available; no-ops otherwise (e.g. iOS Safari).
 */

export type HapticKind = "tap" | "success" | "warning";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 8,
  success: [10, 40, 12],
  warning: [25, 40, 25],
};

export function canHaptic(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  );
}

/** Fire a short haptic pulse. Safe to call from render-free event handlers. */
export function haptic(kind: HapticKind = "tap"): boolean {
  if (!canHaptic()) return false;
  try {
    return navigator.vibrate(PATTERNS[kind]);
  } catch {
    return false;
  }
}

export function hapticTap(): boolean {
  return haptic("tap");
}

export function hapticSuccess(): boolean {
  return haptic("success");
}
