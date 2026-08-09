import type { CombatMoveDef } from '@data/skills/catalog';
import { BASIC_STRIKE } from '@data/skills/catalog';
import type { CombatFighterState } from '@interfaces/lifeEngine';

export type FoeAiStyle = 'brute' | 'duelist' | 'trickster' | 'boss';

export function inferFoeAiStyle(foeName: string, foePower: string): FoeAiStyle {
  if (foePower === 'boss') return 'boss';
  if (/刺客|殺手|針|影/.test(foeName)) return 'trickster';
  if (/劍|刀客|教頭|館主/.test(foeName)) return 'duelist';
  if (/賊|寨|莽|鐵/.test(foeName)) return 'brute';
  return foePower === 'strong' ? 'duelist' : 'brute';
}

export function foeStyleLabel(style: FoeAiStyle): string {
  switch (style) {
    case 'brute':
      return '勢猛';
    case 'duelist':
      return '招正';
    case 'trickster':
      return '路詭';
    case 'boss':
      return '氣壓全場';
  }
}

/** 依風格挑選敵人招式（可重播）；每招帶虛／實／架 */
export function chooseFoeMove(
  foe: CombatFighterState,
  rng: { nextFloat: () => number; pick: <T>(arr: T[]) => T; chance: (p: number) => boolean },
  style: FoeAiStyle,
  bossEnraged = false,
): CombatMoveDef {
  const heavy: CombatMoveDef = {
    id: 'enemy_heavy',
    name: style === 'boss' ? '開山一擊' : '猛攻',
    qiCost: 12,
    power: bossEnraged ? 1.7 : style === 'brute' ? 1.5 : 1.35,
    stance: 'shi',
    description: '實招硬撼',
  };
  const feint: CombatMoveDef = {
    id: 'enemy_feint',
    name: style === 'trickster' ? '詭步虛指' : '虛晃',
    qiCost: 8,
    power: style === 'trickster' ? 0.85 : 0.9,
    hitBonus: bossEnraged ? 0.22 : style === 'trickster' ? 0.2 : 0.12,
    stance: 'xu',
    description: '虛招誘敵',
  };
  const parry: CombatMoveDef = {
    id: 'enemy_parry',
    name: style === 'duelist' ? '卸力反截' : '架勢橫擋',
    qiCost: 6,
    power: 0.75,
    hitBonus: 0.06,
    stance: 'jia',
    description: '架招拆解',
  };
  const precise: CombatMoveDef = {
    id: 'enemy_precise',
    name: '點穴直指',
    qiCost: 10,
    power: 1.15,
    hitBonus: 0.18,
    pierce: 0.08,
    stance: 'shi',
    description: '實指點穴',
  };
  const pool: CombatMoveDef[] = [
    { ...BASIC_STRIKE, stance: 'shi' },
    heavy,
    feint,
    parry,
  ];
  if (style === 'duelist' || style === 'boss') pool.push(precise);
  if (bossEnraged || style === 'boss') {
    pool.push({
      id: 'enemy_burst',
      name: '絕境反撲',
      qiCost: 18,
      power: 1.95,
      pierce: 0.2,
      stance: 'shi',
      description: '實招絕反',
    });
  }

  const affordable = pool.filter((m) => foe.qi >= m.qiCost);
  const use = affordable.length ? affordable : [{ ...BASIC_STRIKE, stance: 'shi' as const }];

  // 風格偏好
  if (style === 'brute' && rng.chance(0.55)) {
    const h = use.find((m) => m.id === 'enemy_heavy');
    if (h) return h;
  }
  if (style === 'trickster' && rng.chance(0.5)) {
    const f = use.find((m) => m.id === 'enemy_feint');
    if (f) return f;
  }
  if (style === 'duelist' && rng.chance(0.35)) {
    const p = use.find((m) => m.id === 'enemy_precise');
    if (p) return p;
  }
  if ((style === 'duelist' || style === 'boss') && rng.chance(0.28)) {
    const g = use.find((m) => m.id === 'enemy_parry');
    if (g) return g;
  }
  return rng.pick(use);
}
