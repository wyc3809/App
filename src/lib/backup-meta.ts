import type { UserSettings } from "./types";

/** Remind users to export — disabled; backup stays available in Settings only. */
export const BACKUP_REMIND_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

export function shouldRemindBackup(
  _lastBackupAt: string | null | undefined,
  _nowMs: number = Date.now(),
): boolean {
  // No auto banner (including first launch). Users export from Settings.
  return false;
}

export function formatLastBackupLabel(
  lastBackupAt: string | null | undefined,
  nowMs: number = Date.now(),
): string {
  if (!lastBackupAt) return "Never backed up";
  const t = Date.parse(lastBackupAt);
  if (Number.isNaN(t)) return "Never backed up";
  const days = Math.floor((nowMs - t) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Backed up today";
  if (days === 1) return "Backed up yesterday";
  if (days < 14) return `Backed up ${days} days ago`;
  return `Last backup ${new Date(t).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

export function withBackupStamp(
  settings: UserSettings,
  iso: string = new Date().toISOString(),
): UserSettings {
  return { ...settings, lastBackupAt: iso };
}
