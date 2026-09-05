"use client";

import { BottomSheet } from "@/components/BottomSheet";

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** In-app confirm sheet — replaces window.confirm for brandable, tappable UX. */
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  if (!open) return null;

  return (
    <BottomSheet
      onClose={onClose}
      title={title}
      titleId="confirm-sheet-title"
      zIndex={100}
      footer={
        <>
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            style={
              danger
                ? { background: "var(--danger)", color: "#fff" }
                : undefined
            }
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
        {message}
      </p>
    </BottomSheet>
  );
}
