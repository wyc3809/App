import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { FAMILY_RULES } from '@data/content/packs';
import { randomChineseName } from '@core/ids';
import { pushChronicle } from './chronicle';
import { syncRngFromState, snapshotRng } from './gameState';

export function rollLifetimeChildrenMax(rng: { nextInt: (a: number, b: number) => number }): number {
  return rng.nextInt(FAMILY_RULES.lifetimeChildrenMin, FAMILY_RULES.lifetimeChildrenMax);
}

export function ensureFamilyFields(
  c: LifeGameState['character'],
  rng?: { nextInt: (a: number, b: number) => number },
): void {
  if (c.childrenCount === undefined) c.childrenCount = 0;
  if (c.monthsSinceLastBirth === undefined) c.monthsSinceLastBirth = 99;
  if (c.childrenMax === undefined || c.childrenMax < 1) {
    const r = rng ?? getRng();
    c.childrenMax = rollLifetimeChildrenMax(r);
  }
  if (!c.family) c.family = {};
  if (!c.family.childrenNames) c.family.childrenNames = [];
}

export type ChildBirthGate =
  | { ok: true }
  | { ok: false; reason: string };

export function canHaveChild(state: LifeGameState): ChildBirthGate {
  const c = state.character;
  ensureFamilyFields(c);
  if (!c.alive) return { ok: false, reason: '已無法添丁。' };
  if (FAMILY_RULES.requireLover && !c.loverId) {
    return { ok: false, reason: '尚未有眷屬，難以添丁。' };
  }
  if (c.age < FAMILY_RULES.minAge || c.age > FAMILY_RULES.maxAge) {
    return {
      ok: false,
      reason: `求子宜在 ${FAMILY_RULES.minAge}–${FAMILY_RULES.maxAge} 歲之間。`,
    };
  }
  if (c.childrenCount >= c.childrenMax) {
    return { ok: false, reason: `此生子女已滿（${c.childrenCount}/${c.childrenMax}）。` };
  }
  if ((c.monthsSinceLastBirth ?? 0) < FAMILY_RULES.cooldownMonths) {
    const left = FAMILY_RULES.cooldownMonths - (c.monthsSinceLastBirth ?? 0);
    return { ok: false, reason: `生產未歇，尚需約 ${left} 月再議。` };
  }
  return { ok: true };
}

function spawnChild(state: LifeGameState, source: 'monthly' | 'seek'): string[] {
  const c = state.character;
  const rng = getRng();
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
  // 長子／長女為預設繼承人
  if (!c.flags.heir_name) c.flags.heir_name = childName;
  c.flags.family_legacy = true;

  const loverName = c.loverId && state.npcs[c.loverId] ? state.npcs[c.loverId].name : '眷屬';
  const title = source === 'seek' ? '【求子得償】' : '【添丁】';
  return [
    `${title}你與${loverName}得一${gender === 'male' ? '子' : '女'}，取名${childName}。`,
    `（此生子女 ${c.childrenCount}/${c.childrenMax} · 繼承人「${c.flags.heir_name}」）`,
  ];
}

/** 有眷屬時低機率得子；一生最多 childrenMax（1–5） */
export function tryMonthlyBirth(state: LifeGameState): string[] {
  const c = state.character;
  ensureFamilyFields(c);
  c.monthsSinceLastBirth = (c.monthsSinceLastBirth ?? 0) + 1;

  const gate = canHaveChild(state);
  if (!gate.ok) return [];

  const rng = getRng();
  if (!rng.chance(FAMILY_RULES.monthlyBirthChance)) return [];

  const lines = spawnChild(state, 'monthly');
  pushChronicle(state, lines);
  return lines;
}

/**
 * 玩家主動求子（修行行動）。
 * 費銀 20；有機率當月得子，否則只縮短冷卻／加人情。
 */
export function seekChild(state: LifeGameState): string[] {
  syncRngFromState(state);
  const c = state.character;
  ensureFamilyFields(c);
  const gate = canHaveChild(state);
  if (!gate.ok) {
    snapshotRng(state);
    return [gate.reason];
  }
  if (c.money < 20) {
    snapshotRng(state);
    return ['求醫祈嗣需銀約二十兩，囊中不足。'];
  }

  const rng = getRng();
  c.money -= 20;
  const lines: string[] = ['你與眷屬求醫祈嗣，花去銀兩 20。'];

  // 主動求子：較高機率當月成
  if (rng.chance(0.55)) {
    lines.push(...spawnChild(state, 'seek'));
  } else if (rng.chance(0.5)) {
    // 縮短冷卻：算作「有喜未產」——把 monthsSinceLastBirth 推到接近可再試
    c.monthsSinceLastBirth = Math.max(
      c.monthsSinceLastBirth ?? 0,
      FAMILY_RULES.cooldownMonths - 3,
    );
    lines.push('醫者言：脈象尚可，且安心調養數月再候佳音。');
  } else {
    lines.push('此番未果。巷口風硬，你二人相對無言片刻。');
    if (c.loverId && state.npcs[c.loverId]) {
      state.npcs[c.loverId]!.affinity = Math.min(
        100,
        (state.npcs[c.loverId]!.affinity ?? 50) + 3,
      );
      lines.push('縱無子嗣，情誼卻又深了一寸。');
    }
  }

  pushChronicle(state, lines);
  snapshotRng(state);
  return lines;
}

/** 指定繼承人（需已有子女） */
export function designateHeir(state: LifeGameState, childName: string): string[] {
  const c = state.character;
  ensureFamilyFields(c);
  const names = c.family.childrenNames ?? [];
  if (!names.includes(childName)) return ['無此子女。'];
  c.flags.heir_name = childName;
  c.flags.family_legacy = true;
  const lines = [`你立下字據：以「${childName}」為繼承人，族產他日歸其掌管。`];
  pushChronicle(state, lines);
  return lines;
}

export function listChildNames(state: LifeGameState): string[] {
  ensureFamilyFields(state.character);
  return [...(state.character.family.childrenNames ?? [])];
}

export function getHeirName(state: LifeGameState): string | null {
  const named = state.character.flags.heir_name;
  if (typeof named === 'string' && named) return named;
  const kids = listChildNames(state);
  return kids[0] ?? null;
}

/** 掩卷／摘要用：預估來世可繼承銀兩 */
export function previewInheritanceMoney(state: LifeGameState): number {
  const c = state.character;
  if ((c.childrenCount ?? 0) <= 0 && !c.flags.family_legacy) return 0;
  const fromPurse = Math.floor(c.money * 0.4);
  const fromPeak = Math.floor((c.stats.wealthPeak ?? 0) * 0.08);
  return Math.min(160, Math.max(15, fromPurse + fromPeak));
}
