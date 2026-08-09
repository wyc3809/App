import type { LifeGameState } from '@interfaces/lifeEngine';

export type CareerId = 'escort' | 'constable' | 'healer' | 'tomb';

export type CareerDef = {
  id: CareerId;
  name: string;
  hint: string;
  /** 每月固定進項 */
  income: number;
  regionBias?: string;
};

export const CAREER_DEFS: CareerDef[] = [
  { id: 'escort', name: '鏢師', hint: '走鏢護貨，刀頭舔血', income: 3, regionBias: '鏢路' },
  { id: 'constable', name: '捕快', hint: '官差緝盜，名望易起', income: 2, regionBias: '邊市' },
  { id: 'healer', name: '遊醫', hint: '行醫賣藥，少鬥多救', income: 2, regionBias: '藥谷' },
  { id: 'tomb', name: '摸金客', hint: '廢塚尋寶，凶險自知', income: 4, regionBias: '廢寺' },
];

export function getCareer(state: LifeGameState): CareerDef | null {
  const id = state.character.flags.career_id;
  if (typeof id !== 'string') return null;
  return CAREER_DEFS.find((c) => c.id === id) ?? null;
}

export function careerLabel(state: LifeGameState): string {
  return getCareer(state)?.name ?? '遊民';
}

export function setCareer(state: LifeGameState, careerId: CareerId): string[] {
  const def = CAREER_DEFS.find((c) => c.id === careerId);
  if (!def) return ['無此行當。'];
  const prev = getCareer(state);
  state.character.flags.career_id = careerId;
  if (prev?.id === careerId) return [`你仍操舊業：${def.name}。`];
  return [`你以此為業：${def.name}。${def.hint}`];
}

export function clearCareer(state: LifeGameState): string[] {
  if (!state.character.flags.career_id) return ['你本無固定行當。'];
  delete state.character.flags.career_id;
  return ['你放下行當，恢復閒雲身。'];
}

/** 經濟 tick 用 */
export function careerMonthlyIncome(state: LifeGameState): number {
  return getCareer(state)?.income ?? 0;
}
