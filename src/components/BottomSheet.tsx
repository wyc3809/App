"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  onClose: () => void;
  title?: string;
  titleId: string;
  children: ReactNode;
  /** Pinned actions (Cancel / Save) — always visible above the home indicator. */
  footer?: ReactNode;
  /** Optional left header control (e.g. Cancel text). */
  headerStart?: ReactNode;
  /** Sheet stacking — keep above bottom nav (z-40). */
  zIndex?: number;
  /** Show the default close (X) control. */
  showClose?: boolean;
}

/**
 * Full-screen overlay + bottom sheet that:
 * - covers the viewport with a tappable backdrop (no safe-area “holes”)
 * - keeps header/footer pinned while the body scrolls
 * - sits above the app bottom nav
 */
export function BottomSheet({
  onClose,
  title,
  titleId,
  children,
  footer,
  headerStart,
  zIndex = 70,
  showClose = true,
}: BottomSheetProps) {
  return (
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center"
      style={{ zIndex }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl sm:max-h-[min(92dvh,40rem)]"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          maxHeight: "calc(100dvh - var(--safe-top) - 0.5rem)",
          marginTop: "var(--safe-top)",
          paddingBottom: "var(--safe-bottom)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {(title || headerStart || showClose) && (
          <div
            className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex min-w-[3rem] items-center justify-start">
              {headerStart ?? <span className="w-11" aria-hidden />}
            </div>
            {title ? (
              <h2 id={titleId} className="font-display text-lg">
                {title}
              </h2>
            ) : (
              <span id={titleId} className="sr-only">
                Dialog
              </span>
            )}
            <div className="flex min-w-[3rem] items-center justify-end">
              {showClose ? (
                <button
                  type="button"
                  className="btn-ghost inline-flex min-h-11 min-w-11 items-center justify-center rounded-full"
                  style={{ background: "var(--bg-muted)" }}
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              ) : (
                <span className="w-11" aria-hidden />
              )}
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>

        {footer ? (
          <div
            className="flex shrink-0 gap-2 border-t px-5 py-3"
            style={{ borderColor: "var(--border)" }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
