import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { learnMartialArt } from './flavor';

export type FragmentPart = '上' | '中' | '下';

export type ManualRecipe = {
  id: string;
  title: string;
  skillId: string;
  skillName: string;
  parts: FragmentPart[];
};

export const MANUAL_RECIPES: ManualRecipe[] = [
  {
    id: 'manual_nine_shadow',
    title: '九影殘譜',
    skillId: 'art_nine_shadow',
    skillName: '九影迷踪步',
    parts: ['上', '中', '下'],
  },
  {
    id: 'manual_void_breath',
    title: '空冥殘卷',
    skillId: 'art_void_breath',
    skillName: '空冥吐納',
    parts: ['上', '中', '下'],
  },
  {
    id: 'manual_moon_sword',
    title: '弄月劍殘簡',
    skillId: 'art_moon_sword',
    skillName: '弄月劍法',
    parts: ['上', '中', '下'],
  },
];

function fragKey(manualId: string, part: FragmentPart): string {
  return `frag_${manualId}_${part}`;
}

export function hasFragment(state: LifeGameState, manualId: string, part: FragmentPart): boolean {
  return Boolean(state.character.flags[fragKey(manualId, part)]);
}

export function listOwnedFragments(state: LifeGameState): { manual: ManualRecipe; parts: FragmentPart[] }[] {
  return MANUAL_RECIPES.map((manual) => ({
    manual,
    parts: manual.parts.filter((p) => hasFragment(state, manual.id, p)),
  })).filter((x) => x.parts.length > 0);
}

export function grantFragment(
  state: LifeGameState,
  manualId: string,
  part: FragmentPart,
): string[] {
  const manual = MANUAL_RECIPES.find((m) => m.id === manualId);
  if (!manual) return [];
  const key = fragKey(manualId, part);
  if (state.character.flags[key]) {
    return [`你已有「${manual.title}·${part}卷」，只得空歡喜。`];
  }
  state.character.flags[key] = true;
  const lines = [`獲得殘譜：「${manual.title}」${part}卷。`];
  const assembled = tryAssembleManual(state, manualId);
  if (assembled.length) lines.push(...assembled);
  return lines;
}

export function tryAssembleManual(state: LifeGameState, manualId: string): string[] {
  const manual = MANUAL_RECIPES.find((m) => m.id === manualId);
  if (!manual) return [];
  if (state.character.flags[`manual_done_${manualId}`]) return [];
  if (!manual.parts.every((p) => hasFragment(state, manualId, p))) return [];
  state.character.flags[`manual_done_${manualId}`] = true;
  const lines = [`三卷合璧——「${manual.title}」隱義盡現！`];
  if (!state.character.skills.includes(manual.skillId)) {
    lines.push(learnMartialArt(state, manual.skillId, manual.skillName));
  } else {
    state.character.martial += 3;
    lines.push(`你本通「${manual.skillName}」，合譜後武學＋3。`);
  }
  return lines;
}

/** 鍛造失敗／奇遇／旅途隨機掉落一卷 */
export function rollRandomFragment(state: LifeGameState): string[] {
  syncRngFromState(state);
  const rng = getRng();
  const manual = rng.pick(MANUAL_RECIPES);
  const missing = manual.parts.filter((p) => !hasFragment(state, manual.id, p));
  const part = missing.length ? rng.pick(missing) : rng.pick(manual.parts);
  const lines = grantFragment(state, manual.id, part);
  snapshotRng(state);
  return lines;
}

export function formatFragmentProgress(state: LifeGameState): string[] {
  return MANUAL_RECIPES.map((m) => {
    const got = m.parts.filter((p) => hasFragment(state, m.id, p));
    if (!got.length && !state.character.flags[`manual_done_${m.id}`]) return '';
    if (state.character.flags[`manual_done_${m.id}`]) return `${m.title}：已合譜`;
    return `${m.title}：${got.join('')}（${got.length}/${m.parts.length}）`;
  }).filter(Boolean);
}
