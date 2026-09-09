"use client";

import { Flame } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";
import { useI18n } from "@/lib/i18n/context";
import { hapticSuccess } from "@/lib/haptic";
import { useWorthStore } from "@/lib/store";

/** Ephemeral celebration after a streak extension — no share, no home chrome. */
export function StreakCelebration() {
  const { t } = useI18n();
  const pending = useWorthStore((s) => s.pendingStreakCelebration);
  const clear = useWorthStore((s) => s.clearStreakCelebration);

  if (!pending) return null;

  const dismiss = () => {
    hapticSuccess();
    clear();
  };

  return (
    <BottomSheet
      onClose={clear}
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
