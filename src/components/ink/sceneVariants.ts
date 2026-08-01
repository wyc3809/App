import type { LifeGameState } from '@interfaces/lifeEngine';
import { seasonLabel } from '@core/life/monthly';

export type InkSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type InkPlace = 'town' | 'hall' | 'wild' | 'mountain' | 'river';

export function seasonToInk(month: number): InkSeason {
  const s = seasonLabel(month);
  if (s === '春') return 'spring';
  if (s === '夏') return 'summer';
  if (s === '秋') return 'autumn';
  return 'winter';
}

export function placeToInk(location: string | undefined): InkPlace {
  const loc = location ?? '';
  if (/山|華山|嶺|峰/.test(loc)) return 'mountain';
  if (/河|湖|江|橋/.test(loc)) return 'river';
  if (/館|醫|武館|門/.test(loc)) return 'hall';
  if (/野|官道|沙|林/.test(loc)) return 'wild';
  return 'town';
}

export function sceneClassNames(state: LifeGameState, opts?: { combat?: boolean }): string {
  const season = seasonToInk(state.month ?? 1);
  const place = placeToInk(state.character.location);
  const bits = [`ink-scene--${season}`, `ink-scene--${place}`];
  if (opts?.combat) bits.push('ink-scene--combat');
  if (state.pending && (state.pending.kind === 'special' || state.character.flags.rumor_boost)) {
    bits.push('ink-scene--omen');
  }
  return bits.join(' ');
}
