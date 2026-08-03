/** Vite base-aware paths for public/ink assets */
export function inkUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleaned = path.replace(/^\/+/, '');
  return `${base}ink/${cleaned}`;
}

export const INK_DECOR = {
  mountains: () => inkUrl('decor/mountains-wide.svg'),
  boat: () => inkUrl('decor/boat-mist.svg'),
  bamboo: () => inkUrl('decor/bamboo-corner.svg'),
  blots: () => inkUrl('decor/ink-blots.svg'),
  bannerBridge: () => inkUrl('decor/event-banner-bridge.svg'),
  bannerRainInn: () => inkUrl('decor/event-banner-rain-inn.svg'),
  titleSlip: () => inkUrl('frames/title-slip.svg'),
  fadeLine: () => inkUrl('frames/ink-fade-line.svg'),
  brushStroke: () => inkUrl('frames/brush-stroke.svg'),
  scrollFrame: () => inkUrl('frames/scroll-frame.svg'),
  stagesStrip: () => inkUrl('icons/stages-strip.svg'),
} as const;

export type EventBannerKind = 'bridge' | 'rain-inn' | 'none';

/** 依事件標題／標籤挑選橫幅 */
export function pickEventBanner(opts: {
  title?: string;
  body?: string;
  tags?: string[];
}): EventBannerKind {
  const blob = `${opts.title ?? ''}${opts.body ?? ''}${(opts.tags ?? []).join('')}`;
  if (/雨|夜|店|客棧|酒/.test(blob)) return 'rain-inn';
  if (/橋|河|逢|遇|路/.test(blob)) return 'bridge';
  if ((opts.tags ?? []).includes('pack') || (opts.tags ?? []).includes('special')) return 'bridge';
  return 'none';
}

export function eventBannerUrl(kind: EventBannerKind): string | null {
  if (kind === 'bridge') return INK_DECOR.bannerBridge();
  if (kind === 'rain-inn') return INK_DECOR.bannerRainInn();
  return null;
}
