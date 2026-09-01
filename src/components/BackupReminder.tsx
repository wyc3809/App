"use client";

import Link from "next/link";
import { Download, X } from "lucide-react";
import { formatLastBackupLabel } from "@/lib/backup-meta";
import { useI18n } from "@/lib/i18n/context";

interface BackupReminderProps {
  lastBackupAt?: string | null;
  onDismiss: () => void;
}

export function BackupReminder({ lastBackupAt, onDismiss }: BackupReminderProps) {
  const { t } = useI18n();
  const body = t("backup.body").replace(
    "{lastBackup}",
    formatLastBackupLabel(lastBackupAt),
  );

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
          {t("backup.title")}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          {body}
        </p>
        <Link
          href="/settings/"
          className="mt-2 inline-flex text-xs font-semibold"
          style={{ color: "var(--accent)" }}
        >
          {t("backup.action")}
        </Link>
      </div>
      <button
        type="button"
        className="btn-ghost shrink-0"
        aria-label={t("backup.dismiss")}
        onClick={onDismiss}
      >
        <X size={16} />
      </button>
    </div>
  );
}
