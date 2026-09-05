import { describe, expect, it } from "vitest";
import {
  formatLastBackupLabel,
  shouldRemindBackup,
  withBackupStamp,
} from "./backup-meta";

describe("backup-meta", () => {
  const now = Date.parse("2026-08-04T12:00:00.000Z");

  it("does not auto-remind (banner removed; Settings export only)", () => {
    expect(shouldRemindBackup(null, now)).toBe(false);
    expect(shouldRemindBackup(undefined, now)).toBe(false);
    expect(shouldRemindBackup("2026-07-01T00:00:00.000Z", now)).toBe(false);
    expect(shouldRemindBackup("2026-08-01T00:00:00.000Z", now)).toBe(false);
  });

  it("formats human labels", () => {
    expect(formatLastBackupLabel(null, now)).toBe("Never backed up");
    expect(formatLastBackupLabel("2026-08-04T08:00:00.000Z", now)).toBe(
      "Backed up today",
    );
    expect(formatLastBackupLabel("2026-08-03T08:00:00.000Z", now)).toBe(
      "Backed up yesterday",
    );
  });

  it("stamps settings", () => {
    const next = withBackupStamp(
      {
        baseCurrency: "HKD",
        isPrivacyMode: false,
        isBiometricEnabled: false,
        theme: "system",
      },
      "2026-08-04T12:00:00.000Z",
    );
    expect(next.lastBackupAt).toBe("2026-08-04T12:00:00.000Z");
  });
});
