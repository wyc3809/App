"use client";

import { Flame } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { useI18n } from "@/lib/i18n/context";
import { hapticSuccess } from "@/lib/haptic";
import { isNativePlatform } from "@/lib/platform";
import { useWorthStore } from "@/lib/store";
import {
  requestNativeStoreReview,
  shouldRequestStoreReview,
} from "@/lib/store-review";

/** Ephemeral celebration after a streak extension — no share, no home chrome. */
export function StreakCelebration() {
  const { t } = useI18n();
  const pending = useWorthStore((s) => s.pendingStreakCelebration);
  const clear = useWorthStore((s) => s.clearStreakCelebration);
  const updateSettings = useWorthStore((s) => s.updateSettings);
  const alreadyPrompted = useWorthStore(
    (s) => s.settings.storeReviewPromptedForStreak3 === true,
  );

  if (!pending) return null;

  const maybeRequestStoreReview = (day: number) => {
    if (
      !shouldRequestStoreReview({
        celebrationDay: day,
        alreadyPromptedForStreak3: alreadyPrompted,
        isNative: isNativePlatform(),
      })
    ) {
      return;
    }
    // Mark prompted before the async call so a double-dismiss cannot re-fire.
    updateSettings({ storeReviewPromptedForStreak3: true });
    void requestNativeStoreReview();
  };

  const dismiss = () => {
    const day = pending.day;
    hapticSuccess();
    clear();
    // After the win moment (not on launch / failure) — Day 3 streak only.
    maybeRequestStoreReview(day);
  };

  return (
    <BottomSheet
      onClose={() => {
        const day = pending.day;
        clear();
        maybeRequestStoreReview(day);
      }}
      titleId="streak-celebration-title"
      zIndex={120}
      showClose={false}
      footer={
        <button
          type="button"
          className="btn-primary min-h-11 w-full justify-center"
          onClick={dismiss}
        >
          {t("streak.celebrationNice")}
        </button>
      }
    >
      <div className="flex flex-col items-center px-2 pb-2 pt-4 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "color-mix(in srgb, #f97316 18%, transparent)" }}
          aria-hidden
        >
          <Flame size={32} style={{ color: "#ea580c" }} fill="#ea580c" />
        </div>
        <p
          id="streak-celebration-title"
          className="mt-4 font-display text-2xl font-bold tracking-tight"
        >
          {t("streak.celebrationDay").replace("{day}", String(pending.day))}
        </p>
        <p className="mt-2 text-sm font-semibold" style={{ color: "var(--fg)" }}>
          {t("streak.celebrationTitle")}
        </p>
        <p className="mt-1.5 text-sm" style={{ color: "var(--fg-muted)" }}>
          {pending.usedFreeze
            ? t("streak.celebrationFreezeUsed")
            : t("streak.celebrationBody")}
        </p>
      </div>
    </BottomSheet>
  );
}
