/** Inline SVG markup (avoids Safari <img> + cached/corrupt external SVG failures) */
import mountainsSvg from '../../public/ink/decor/mountains-wide.svg?raw';
import boatSvg from '../../public/ink/decor/boat-mist.svg?raw';
import bambooSvg from '../../public/ink/decor/bamboo-corner.svg?raw';
import blotsSvg from '../../public/ink/decor/ink-blots.svg?raw';
import bannerBridgeSvg from '../../public/ink/decor/event-banner-bridge.svg?raw';
import bannerRainInnSvg from '../../public/ink/decor/event-banner-rain-inn.svg?raw';
import titleSlipSvg from '../../public/ink/frames/title-slip.svg?raw';
import fadeLineSvg from '../../public/ink/frames/ink-fade-line.svg?raw';
import stagesStripSvg from '../../public/ink/icons/stages-strip.svg?raw';

/** Strip XML/doctype noise; keep inner svg element */
export function cleanSvgMarkup(raw: string): string {
  return raw
    .replace(/^\uFEFF/, '')
    .replace(/<\?xml[\s\S]*?\?>/i, '')
    .replace(/<!DOCTYPE[\s\S]*?>/i, '')
    .trim();
}

/** Prefix ids so multiple inlined SVGs do not clash in one document */
export function namespaceSvgIds(raw: string, prefix: string): string {
  const ids = new Set<string>();
  for (const m of raw.matchAll(/\bid=["']([^"']+)["']/g)) ids.add(m[1]!);
  let out = raw;
  for (const id of ids) {
    const next = `${prefix}-${id}`;
    out = out
      .replaceAll(`id="${id}"`, `id="${next}"`)
      .replaceAll(`id='${id}'`, `id='${next}'`)
      .replaceAll(`url(#${id})`, `url(#${next})`)
      .replaceAll(`href="#${id}"`, `href="#${next}"`)
      .replaceAll(`xlink:href="#${id}"`, `xlink:href="#${next}"`);
  }
  return out;
}

function prepare(raw: string, prefix: string): string {
  return namespaceSvgIds(cleanSvgMarkup(raw), prefix);
}

export const INK_SVG = {
  mountains: prepare(mountainsSvg, 'mtn'),
  boat: prepare(boatSvg, 'boat'),
  bamboo: prepare(bambooSvg, 'bam'),
  blots: prepare(blotsSvg, 'blot'),
  bannerBridge: prepare(bannerBridgeSvg, 'bnb'),
  bannerRainInn: prepare(bannerRainInnSvg, 'bnr'),
  titleSlip: prepare(titleSlipSvg, 'slip'),
  fadeLine: prepare(fadeLineSvg, 'fade'),
  stagesStrip: prepare(stagesStripSvg, 'stg'),
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

export function eventBannerSvg(kind: EventBannerKind): string | null {
  if (kind === 'bridge') return INK_SVG.bannerBridge;
  if (kind === 'rain-inn') return INK_SVG.bannerRainInn;
  return null;
}

/** @deprecated Prefer INK_SVG inlining; kept for any leftover URL needs */
export function inkUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleaned = path.replace(/^\/+/, '');
  return `${base}ink/${cleaned}?v=3`;
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

export function eventBannerUrl(kind: EventBannerKind): string | null {
  if (kind === 'bridge') return INK_DECOR.bannerBridge();
  if (kind === 'rain-inn') return INK_DECOR.bannerRainInn();
  return null;
}
