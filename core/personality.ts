import type { PersonalityComponent } from '@interfaces/game';
import { TRAIT_KEYS, type TraitKey } from './attribute';
import { getRng } from './random';

export function createRandomPersonality(stabilityBase = 50): PersonalityComponent {
  const rng = getRng();
  const traits: Record<string, number> = {};
  for (const key of TRAIT_KEYS) {
    traits[key] = rng.nextInt(15, 85);
  }

  const goalPool = [
    '成為天下第一',
    '成為首富',
    '守護家族',
    '遊歷江湖',
    '重建門派',
    '尋找仇敵',
    '隱居山林',
    '著書立說',
  ];
  const beliefPool = ['儒家仁義', '道家無為', '佛家慈悲', '法家嚴刑', '江湖義氣', '門派戒律'];
  const fearPool = ['恐懼死亡', '恐懼背叛', '恐懼水域', '恐懼黑暗', '恐懼失敗'];

  const goals = [rng.pick(goalPool)];
  if (rng.chance(0.35)) goals.push(rng.pick(goalPool));

  return {
    traits,
    beliefs: [rng.pick(beliefPool)],
    goals,
    fears: rng.chance(0.6) ? [rng.pick(fearPool)] : [],
    stability: rng.nextInt(Math.max(20, stabilityBase - 20), Math.min(90, stabilityBase + 20)),
    alignment: computeAlignment(traits),
  };
}

export function computeAlignment(traits: Record<string, number>): number {
  const lawful =
    (traits.justice ?? 50) + (traits.honor ?? 50) + (traits.discipline ?? 50) - (traits.greed ?? 50);
  const good =
    (traits.kindness ?? 50) +
    (traits.mercy ?? 50) +
    (traits.compassion ?? 50) -
    (traits.cruelty ?? 50);
  return Math.round((lawful + good) / 4);
}

export function getDominantTrait(traits: Record<string, number>): TraitKey {
  let best: TraitKey = 'honesty';
  let val = -1;
  for (const k of TRAIT_KEYS) {
    if ((traits[k] ?? 0) > val) {
      val = traits[k] ?? 0;
      best = k;
    }
  }
  return best;
}

export function getPersonalityArchetype(traits: Record<string, number>): string {
  const ambition = traits.ambition ?? 50;
  const greed = traits.greed ?? 50;
  const honor = traits.honor ?? 50;
  const kindness = traits.kindness ?? 50;
  const cruelty = traits.cruelty ?? 50;
  const curiosity = traits.curiosity ?? 50;

  if (ambition > 75 && honor > 60) return '俠客';
  if (greed > 70) return '商人';
  if (cruelty > 70) return '惡徒';
  if (kindness > 75) return '善人';
  if (curiosity > 75 && (traits.discipline ?? 50) > 55) return '書生';
  if (ambition > 80) return '梟雄';
  if ((traits.independence ?? 50) > 75) return '隱士';
  return '江湖客';
}

export function getDecisionWeight(
  personality: PersonalityComponent,
  need: number,
  emotion: number,
  relationship: number,
  risk: number,
  reward: number,
): number {
  const dominant = personality.traits[getDominantTrait(personality.traits)] ?? 50;
  const score =
    need * (dominant / 50) * (emotion / 50) * (relationship / 50) * (reward / 50) / Math.max(0.1, risk / 50);
  return score;
}

export function driftPersonality(
  personality: PersonalityComponent,
  deltas: Partial<Record<TraitKey, number>>,
): PersonalityComponent {
  const stabilityFactor = personality.stability / 100;
  const traits = { ...personality.traits };
  for (const [k, v] of Object.entries(deltas)) {
    const cur = traits[k] ?? 50;
    const delta = (v ?? 0) * (1 - stabilityFactor * 0.7);
    traits[k] = Math.max(0, Math.min(100, Math.round(cur + delta)));
  }
  return {
    ...personality,
    traits,
    alignment: computeAlignment(traits),
  };
}
