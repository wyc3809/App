import { isNativePlatform } from "./platform";
import { useWorthStore } from "./store";

const WEEKLY_ID = 1001;
const MONTHLY_ID = 1002;

async function loadLocalNotifications() {
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

export async function ensureReportNotificationPermissions(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const LocalNotifications = await loadLocalNotifications();
    const status = await LocalNotifications.checkPermissions();
    if (status.display === "granted") return true;
    const req = await LocalNotifications.requestPermissions();
    return req.display === "granted";
  } catch {
    return false;
  }
}

/** Schedule recurring local reminders (native only). */
export async function syncReportNotifications(settings: {
  weeklyReportNotifications?: boolean;
  monthlyReportNotifications?: boolean;
}): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const LocalNotifications = await loadLocalNotifications();
    const ok = await ensureReportNotificationPermissions();
    if (!ok) return;

    await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_ID }, { id: MONTHLY_ID }] });

    const pending: { id: number; title: string; body: string; at: Date }[] = [];

    if (settings.weeklyReportNotifications) {
      const at = nextWeekdayAt(1, 10, 0); // Monday 10:00
      pending.push({
        id: WEEKLY_ID,
        title: "WorthBook weekly recap",
        body: "Your ledger Wrapped is ready — tap to see top moves.",
        at,
      });
    }

    if (settings.monthlyReportNotifications) {
      const at = nextMonthDayAt(1, 10, 0); // 1st 10:00
      pending.push({
        id: MONTHLY_ID,
        title: "WorthBook monthly recap",
        body: "See how your net worth changed last month.",
        at,
      });
    }

    if (pending.length === 0) return;

    await LocalNotifications.schedule({
      notifications: pending.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        schedule: { at: n.at, allowWhileIdle: true },
      })),
    });
  } catch {
    /* best-effort */
  }
}

function nextWeekdayAt(weekday: number, hour: number, minute: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);
  const day = result.getDay();
  const isoDay = day === 0 ? 7 : day;
  let delta = weekday - isoDay;
  if (delta < 0 || (delta === 0 && result <= now)) delta += 7;
  result.setDate(result.getDate() + delta);
  return result;
}

function nextMonthDayAt(dayOfMonth: number, hour: number, minute: number): Date {
  const now = new Date();
  const result = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hour, minute, 0, 0);
  if (result <= now) {
    result.setMonth(result.getMonth() + 1);
  }
  return result;
}

export async function registerReportNotificationHandlers(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const LocalNotifications = await loadLocalNotifications();
    await LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
      const id = event.notification.id;
      if (id === WEEKLY_ID) useWorthStore.getState().requestWrappedReport("weekly");
      if (id === MONTHLY_ID) useWorthStore.getState().requestWrappedReport("monthly");
    });
  } catch {
    /* ignore */
  }
}
