"use client";

import Link from "next/link";
import { FileSpreadsheet, Plus, Sparkles } from "lucide-react";
import { BottomSheet } from "@/components/BottomSheet";

interface OnboardingSheetProps {
  open: boolean;
  onLoadDemo: () => void;
  onDismiss: () => void;
}

/** First-run chooser: demo, start empty, or jump to import. */
export function OnboardingSheet({
  open,
  onLoadDemo,
  onDismiss,
}: OnboardingSheetProps) {
  if (!open) return null;

  return (
    <BottomSheet
      onClose={onDismiss}
      title="Welcome to WorthBook"
      titleId="onboarding-title"
      showClose={false}
      zIndex={75}
      footer={
        <button type="button" className="btn-secondary w-full" onClick={onDismiss}>
          Start empty
        </button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          Track net worth offline on this device. Pick how you want to begin —
          you can export a backup anytime in Settings.
        </p>

        <button
          type="button"
          className="btn-primary w-full justify-start"
          onClick={() => {
            onLoadDemo();
            onDismiss();
          }}
        >
          <Sparkles size={18} />
          Load demo portfolio
        </button>

        <Link
          href="/accounts/?new=1"
          className="btn-secondary flex w-full items-center justify-start gap-2"
          onClick={onDismiss}
        >
          <Plus size={18} />
          Add your first account
        </Link>

        <Link
          href="/settings/"
          className="btn-ghost flex w-full items-center justify-start gap-2"
          onClick={onDismiss}
        >
          <FileSpreadsheet size={18} />
          Import backup or CSV
        </Link>
      </div>
    </BottomSheet>
  );
}
