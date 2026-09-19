import { InAppReview } from "@capacitor-community/in-app-review";
import { isNativePlatform } from "./platform";

/** Streak length that feels like a real win — ask for a review once. */
export const STORE_REVIEW_STREAK_DAYS = 3;

/**
 * Should we ask for a native App Store review after a positive moment?
 * Never on launch / failures — only when the streak just reached the milestone
 * and we have not asked for that milestone yet.
 */
export function shouldRequestStoreReview(input: {
  celebrationDay: number;
  alreadyPromptedForStreak3: boolean;
  isNative: boolean;
}): boolean {
  if (!input.isNative) return false;
  if (input.alreadyPromptedForStreak3) return false;
  return input.celebrationDay === STORE_REVIEW_STREAK_DAYS;
}

/**
 * Request the system in-app review dialog (SKStoreReviewController on iOS).
 * Apple may silently no-op (quota / rate limits) — treat as best-effort.
 */
export async function requestNativeStoreReview(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    await InAppReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
