"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

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

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

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
  const { t } = useI18n();
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleFallbackId = useId();
  const resolvedTitleId = title ? titleId : titleFallbackId;

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== "Tab" || !sheetRef.current) return;
    const nodes = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => el.offsetParent !== null);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const sheet = sheetRef.current;
    const focusTarget =
      sheet?.querySelector<HTMLElement>(FOCUSABLE) ?? sheet;
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      trapFocus(event);
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onClose, trapFocus]);

  return (
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center"
      style={{ zIndex }}
    >
      <button
        type="button"
        className="sheet-backdrop-enter absolute inset-0 backdrop-blur-[2px]"
        style={{ background: "var(--overlay)" }}
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="sheet-enter relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-3xl outline-none sm:max-h-[min(92dvh,40rem)] sm:rounded-3xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          maxHeight: "calc(100dvh - var(--safe-top) - 0.5rem)",
          marginTop: "var(--safe-top)",
          paddingBottom: "var(--safe-bottom)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
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
              <h2 id={resolvedTitleId} className="font-display text-lg">
                {title}
              </h2>
            ) : (
              <span id={resolvedTitleId} className="sr-only">
                {t("common.dialog")}
              </span>
            )}
            <div className="flex min-w-[3rem] items-center justify-end">
              {showClose ? (
                <button
                  type="button"
                  className="btn-ghost inline-flex min-h-11 min-w-11 items-center justify-center rounded-full"
                  style={{ background: "var(--bg-muted)" }}
                  onClick={onClose}
                  aria-label={t("common.close")}
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
