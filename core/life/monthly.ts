import type { LifeGameState, WorldState, StoryState, LifeCondition } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { tryMonthlyBirth } from './family';
import { tickAftermath } from './aftermath';
import { recordDeath } from './death';
import { tickLifeArc } from './arcs';
import { tickMonthlyEconomy } from './economy';
import { tickSectMonth } from './sectLife';
import { syncTitles } from './titles';
import { pushChronicle } from './chronicle';
import { tickBonds } from './bonds';

export function makeWorldState(): WorldState {
  const rng = getRng();
  return {
    order: rng.nextInt(42, 68),
    danger: rng.nextInt(18, 42),
    economy: rng.nextInt(40, 66),
    rumors: rng.nextInt(20, 55),
    seasonMood: '平穩',
    lastWorldShift: '千燈鎮外風聲尚穩。',
  };
}

/** 章節已取消；僅保留存檔相容用空殼 */
export function makeStoryState(): StoryState {
  return {
    chapter: 0,
    title: '',
    goal: '',
    progress: 0,
    nextMilestone: 9999,
  };
}

const CONDITION_PRESETS: Record<string, Omit<LifeCondition, 'monthsLeft'> & { months: number }> = {
  bleeding: { id: 'bleeding', name: '流血未止', severity: 1, months: 1 },
  internal: { id: 'internal', name: '內傷', severity: 2, months: 4 },
  fracture: { id: 'fracture', name: '骨裂', severity: 2, months: 5 },
  poison: { id: 'poison', name: '餘毒', severity: 2, months: 3 },
  limp: { id: 'limp', name: '腿傷難行', severity: 2, months: 8 },
  scar: { id: 'scar', name: '舊疤作痛', severity: 1, months: 12 },
};

export function addCondition(state: LifeGameState, id: string): void {
  const preset = CONDITION_PRESETS[id];
  if (!preset) return;
  const c = state.character;
  const existing = c.conditions.find((x) => x.id === id);
  if (existing) {
    existing.monthsLeft = Math.max(existing.monthsLeft, preset.months);
    return;
  }
  c.conditions.push({
    id: preset.id,
    name: preset.name,
    severity: preset.severity,
    monthsLeft: preset.months,
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function tickConditions(state: LifeGameState): void {
  const c = state.character;
  const next: LifeCondition[] = [];
  for (const cond of c.conditions) {
    if (cond.id === 'bleeding') c.health -= 4 + cond.severity;
    if (cond.id === 'internal') {
      c.health -= 2;
      c.qi -= 6;
    }
    if (cond.id === 'poison') {
      c.health -= 3;
      c.qi -= 4;
    }
    if (cond.id === 'fracture' || cond.id === 'limp') c.stamina -= 8;
    const left = cond.monthsLeft - 1;
    if (left > 0) next.push({ ...cond, monthsLeft: left });
  }
  c.conditions = next;
  c.health = clamp(c.health, 0, c.maxHealth);
  c.qi = clamp(c.qi, 0, c.maxQi);
  c.stamina = clamp(c.stamina, 0, c.maxStamina);
}

const RUMOR_LINES: { flag: string; text: string }[] = [
  { flag: 'rumor_boss_scarlet', text: '茶棚裡有人把「赤練娘」三字咬得很輕。' },
  { flag: 'rumor_boss_iron', text: '官道塵土裡，似有鐵輪碾過的痕跡。' },
  { flag: 'rumor_boss_monk', text: '破廟方向傳來酒氣與木魚聲。' },
  { flag: 'rumor_boss_black', text: '黑風過林，有人說寨主在點名。' },
  { flag: 'rumor_boss_frost', text: '北嶺寒意逼人，刀聲隱約。' },
  { flag: 'rumor_boss_lute', text: '河舫夜曲一響，便有船家改道。' },
  { flag: 'rumor_boss_sand', text: '西邊沙道揚塵，似有人揮掌迷目。' },
  { flag: 'rumor_boss_mirror', text: '鏡湖孤燈未熄，有人說隱士仍在等客。' },
];

export function simulateWorldMonth(state: LifeGameState): void {
  const rng = getRng();
  const w = state.world;
  w.order = clamp(w.order + rng.nextInt(-4, 4), 10, 95);
  w.danger = clamp(w.danger + rng.nextInt(-5, 6), 5, 95);
  w.economy = clamp(w.economy + rng.nextInt(-4, 5), 10, 95);
  w.rumors = clamp(w.rumors + rng.nextInt(-6, 8), 5, 95);
  const moods = ['平穩', '風雨欲來', '市井熙攘', '人心惶惶', '清平'];
  w.seasonMood = rng.pick(moods);

  const activeRumors = RUMOR_LINES.filter((r) => state.character.flags[r.flag]);
  if (activeRumors.length && rng.chance(0.55)) {
    w.lastWorldShift = rng.pick(activeRumors).text;
  } else {
    w.lastWorldShift =
      w.danger > 60
        ? '山道不太平，行人都加快腳步。'
        : w.economy > 65
          ? '千燈鎮市集熱鬧，銀錢流動得快。'
          : '鎮外風聲仍不大。';
  }
}

/** 章節系統已取消；保留 no-op 以免舊呼叫／存檔遷移出錯 */
export function advanceStoryMonth(_state: LifeGameState): void {
  /* intentionally empty — no chapter progression */
}

export function simulateMonthBody(state: LifeGameState): void {
  const rng = getRng();
  const c = state.character;
  // 疲勞累積略緩；高疲勞扣血改為輕傷，並提高自然回血，避免「翻幾頁就氣血歸零」
  c.fatigue = clamp(c.fatigue + rng.nextInt(3, 10), 0, 100);
  const fatigueHit = c.fatigue > 90 ? 4 : c.fatigue > 80 ? 2 : 0;
  c.health = clamp(c.health + rng.nextInt(5, 12) - fatigueHit, 0, c.maxHealth);
  c.qi = clamp(c.qi + rng.nextInt(4, 12), 0, c.maxQi);
  c.stamina = clamp(c.stamina + rng.nextInt(4, 12), 0, c.maxStamina);
  // 疲勞自然緩解一截，唔讓數值永遠卡死在危險區
  if (c.fatigue > 40) c.fatigue = clamp(c.fatigue - rng.nextInt(2, 6), 0, 100);
  tickConditions(state);
  simulateWorldMonth(state);
  tryMonthlyBirth(state);
  tickAftermath(state);
  tickBonds(state);
  tickLifeArc(state);
  const monthBits = [
    ...tickMonthlyEconomy(state),
    ...tickSectMonth(state),
    ...syncTitles(state),
  ];
  if (monthBits.length) pushChronicle(state, monthBits);

  // 老年額外衰弱：遲暮更易體虛
  if (c.alive && c.age >= 65) {
    if (rng.chance(0.12)) {
      c.health = clamp(c.health - rng.nextInt(2, 6), 0, c.maxHealth);
      c.fatigue = clamp(c.fatigue + rng.nextInt(4, 10), 0, 100);
    }
  }

  if (c.health <= 0) {
    c.health = 0;
    if (c.alive) {
      recordDeath(state, '氣血耗盡，倒於旅途。');
    }
  }
  if (c.alive && c.age > 72 && rng.chance((c.age - 70) / 160)) {
    recordDeath(state, '年邁體衰，無疾而終。');
  }
}

export function seasonLabel(month: number): string {
  if (month <= 2 || month === 12) return '冬';
  if (month <= 5) return '春';
  if (month <= 8) return '夏';
  return '秋';
}
