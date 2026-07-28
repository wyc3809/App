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

/** 用於事件權重微調：老年更易抽到歲暮事件 */
export function stageWeightBias(age: number, eventTags: string[] | undefined): number {
  const stage = getLifeStage(age);
  if (!eventTags?.length) return 1;
  if (stage === 'elder' || stage === 'twilight') {
    if (eventTags.includes('old_age') || eventTags.includes('death')) return 1.8;
  }
  if (stage === 'youth' || stage === 'adult') {
    if (eventTags.includes('romance') || eventTags.includes('martial')) return 1.25;
  }
  if (stage === 'child' || stage === 'infant') {
    if (eventTags.includes('childhood') || eventTags.includes('family')) return 1.4;
  }
  return 1;
}
