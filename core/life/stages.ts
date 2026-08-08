import type { LifeGameState } from '@interfaces/lifeEngine';

export type LifeStage =
  | 'infant'
  | 'child'
  | 'youth'
  | 'adult'
  | 'midlife'
  | 'elder'
  | 'twilight';

export const lifeStageLabels: Record<LifeStage, string> = {
  infant: '襁褓',
  child: '幼年',
  youth: '少年',
  adult: '壯年',
  midlife: '中年',
  elder: '老年',
  twilight: '遲暮',
};

export function getLifeStage(age: number): LifeStage {
  if (age < 3) return 'infant';
  if (age < 12) return 'child';
  if (age < 20) return 'youth';
  if (age < 40) return 'adult';
  if (age < 55) return 'midlife';
  if (age < 70) return 'elder';
  return 'twilight';
}

export function getLifeStageLabel(state: LifeGameState): string {
  return lifeStageLabels[getLifeStage(state.character.age)];
}

/** 用於事件權重微調：老年收尾、壯年江湖、幼年家庭 */
export function stageWeightBias(age: number, eventTags: string[] | undefined): number {
  const stage = getLifeStage(age);
  if (!eventTags?.length) {
    if (stage === 'elder' || stage === 'twilight') return 0.85;
    return 1;
  }
  const tags = eventTags;
  if (stage === 'elder' || stage === 'twilight') {
    if (tags.includes('old_age') || tags.includes('death') || tags.includes('family')) return 2.2;
    if (tags.includes('boss') || tags.includes('road') || tags.includes('pack')) return 0.45;
    if (tags.includes('practice_wander') || tags.includes('martial')) return 0.55;
    if (tags.includes('romance')) return 0.5;
    return 0.9;
  }
  if (stage === 'midlife') {
    if (tags.includes('martial') || tags.includes('boss') || tags.includes('road')) return 1.35;
    if (tags.includes('old_age')) return 0.7;
  }
  if (stage === 'youth' || stage === 'adult') {
    if (tags.includes('romance') || tags.includes('martial')) return 1.3;
    if (tags.includes('old_age') || tags.includes('death')) return 0.4;
  }
  if (stage === 'child' || stage === 'infant') {
    if (tags.includes('childhood') || tags.includes('family')) return 1.5;
    if (tags.includes('boss') || tags.includes('road') || tags.includes('combat')) return 0.25;
  }
  return 1;
}
