"use client";

import Link from "next/link";
import { Download, X } from "lucide-react";
import { formatLastBackupLabel } from "@/lib/backup-meta";

interface BackupReminderProps {
  lastBackupAt?: string | null;
  onDismiss: () => void;
}

export function BackupReminder({ lastBackupAt, onDismiss }: BackupReminderProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-3.5 py-3 animate-fade-up"
      style={{
        background: "var(--accent-soft)",
        border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)",
      }}
      role="status"
    >
      <Download size={18} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
          Export a backup
        </p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          {formatLastBackupLabel(lastBackupAt)}. Data stays in this browser —
          export JSON so you can restore if storage is cleared.
        </p>
        <Link
          href="/settings/"
          className="mt-2 inline-flex text-xs font-semibold"
          style={{ color: "var(--accent)" }}
        >
          Go to Settings →
        </Link>
      </div>
      <button
        type="button"
        className="btn-ghost shrink-0"
        aria-label="Dismiss backup reminder"
        onClick={onDismiss}
      >
        <X size={16} />
      </button>
    </div>
  );
}
