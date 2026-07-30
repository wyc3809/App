/** 輕量漏斗埋點：預設 no-op，可接 gtag / 自建後端 */

export type TelemetryEvent =
  | 'life_create'
  | 'life_resume'
  | 'month_advance'
  | 'choice_made'
  | 'combat_start'
  | 'combat_end'
  | 'life_death'
  | 'life_reincarnate'
  | 'coach_dismiss'
  | 'audio_mute_toggle';

const buffer: Array<{ name: TelemetryEvent; props?: Record<string, string | number | boolean>; t: number }> =
  [];

export function track(
  name: TelemetryEvent,
  props?: Record<string, string | number | boolean>,
): void {
  buffer.push({ name, props, t: Date.now() });
  if (typeof window !== 'undefined') {
    const w = window as unknown as { __jianghuTelemetry?: typeof buffer };
    w.__jianghuTelemetry = buffer;
    try {
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      gtag?.('event', name, props ?? {});
    } catch {
      /* ignore */
    }
  }
}

export function telemetryBuffer() {
  return buffer.slice();
}
