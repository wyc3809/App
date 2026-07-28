import type { GameEffect, LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { wuxiaAttributeLabels } from '@interfaces/lifeEngine';
import { getLifeStageLabel } from './stages';

export function formatEffectLine(eff: GameEffect, state: LifeGameState): string | null {
  switch (eff.type) {
    case 'narrate':
      return eff.text;
    case 'attr': {
      const parts = Object.entries(eff.delta)
        .filter(([, v]) => v !== undefined && v !== 0)
        .map(([k, v]) => {
          const label = wuxiaAttributeLabels[k as WuxiaAttribute] ?? k;
          return `${label}${v! > 0 ? '＋' : '－'}${Math.abs(v!)}`;
        });
      return parts.length ? parts.join(' · ') : null;
    }
    case 'money':
      return eff.amount >= 0 ? `銀兩＋${eff.amount}` : `銀兩－${Math.abs(eff.amount)}`;
    case 'health':
      return eff.amount >= 0 ? `氣血＋${eff.amount}` : `氣血－${Math.abs(eff.amount)}`;
    case 'reputation':
      return `名望${eff.amount >= 0 ? '＋' : '－'}${Math.abs(eff.amount)}`;
    case 'martial':
      return `武學${eff.amount >= 0 ? '＋' : '－'}${Math.abs(eff.amount)}`;
    case 'learnSkill':
      return `習得「${eff.name ?? eff.skillId}」`;
    case 'joinSect': {
      const name =
        (eff.sectId && state.sects[eff.sectId]?.name) ||
        eff.sectName ||
        '名門';
      return `拜入${name}`;
    }
    case 'leaveSect':
      return '脫離門牆';
    case 'lover': {
      const n = state.npcs[eff.npcId]?.name ?? '知己';
      return `與${n}結為眷屬`;
    }
    case 'die':
      return eff.reason ?? '撒手人寰';
    case 'flag':
    case 'worldFlag':
    case 'relationship':
    case 'memory':
      return null;
    default:
      return null;
  }
}

export function pushChronicle(state: LifeGameState, lines: string[]): void {
  const stamped = lines
    .filter(Boolean)
    .map((t) => `【${state.year}·${state.character.age}歲·${getLifeStageLabel(state)}】${t}`);
  state.lifeLog = [...stamped, ...state.lifeLog].slice(0, 140);
}

export function yearQuietLine(state: LifeGameState): string {
  const stage = getLifeStageLabel(state);
  const lines = [
    `${state.year}年，${stage}無事，紙窗聞雨。`,
    `${state.year}年，江湖遠，茶熱，你只度一日。`,
    `${state.year}年，風平，墨未乾。`,
  ];
  return lines[state.year % lines.length];
}
