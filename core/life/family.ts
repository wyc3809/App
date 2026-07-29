import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { FAMILY_RULES } from '@data/content/packs';
import { randomChineseName } from '@core/ids';
import { pushChronicle } from './chronicle';

export function rollLifetimeChildrenMax(rng: { nextInt: (a: number, b: number) => number }): number {
  return rng.nextInt(FAMILY_RULES.lifetimeChildrenMin, FAMILY_RULES.lifetimeChildrenMax);
}

export function ensureFamilyFields(c: LifeGameState['character'], rng?: { nextInt: (a: number, b: number) => number }): void {
  if (c.childrenCount === undefined) c.childrenCount = 0;
  if (c.monthsSinceLastBirth === undefined) c.monthsSinceLastBirth = 99;
  if (c.childrenMax === undefined || c.childrenMax < 1) {
    const r = rng ?? getRng();
    c.childrenMax = rollLifetimeChildrenMax(r);
  }
}

/** 有眷屬時低機率得子；一生最多 childrenMax（1–5） */
export function tryMonthlyBirth(state: LifeGameState): string[] {
  const c = state.character;
  ensureFamilyFields(c);
  c.monthsSinceLastBirth = (c.monthsSinceLastBirth ?? 0) + 1;

  if (!c.alive) return [];
  if (FAMILY_RULES.requireLover && !c.loverId) return [];
  if (c.age < FAMILY_RULES.minAge || c.age > FAMILY_RULES.maxAge) return [];
  if (c.childrenCount >= c.childrenMax) return [];
  if ((c.monthsSinceLastBirth ?? 0) < FAMILY_RULES.cooldownMonths) return [];

  const rng = getRng();
  if (!rng.chance(FAMILY_RULES.monthlyBirthChance)) return [];

  c.childrenCount += 1;
  c.monthsSinceLastBirth = 0;
  const childName = randomChineseName();
  const childId = `child_${c.childrenCount}_${state.year}_${state.month}`;
  const gender = rng.chance(0.5) ? 'male' : 'female';
  state.npcs[childId] = {
    id: childId,
    name: childName,
    gender,
    role: 'friend',
    affinity: 70,
    memories: [`${state.year}年${state.month}月降生`],
    alive: true,
  };
  if (!c.family.childrenNames) c.family.childrenNames = [];
  c.family.childrenNames.push(childName);

  const loverName = c.loverId && state.npcs[c.loverId] ? state.npcs[c.loverId].name : '眷屬';
  const lines = [
    `【添丁】你與${loverName}得一${gender === 'male' ? '子' : '女'}，取名${childName}。`,
    `（此生子女 ${c.childrenCount}/${c.childrenMax}）`,
  ];
  pushChronicle(state, lines);
  return lines;
}
