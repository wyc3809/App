import type { LifeGameState, WorldState, StoryState, LifeCondition } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { STORY_CHAPTERS } from '@data/content/packs';
import { tryMonthlyBirth } from './family';

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

export function makeStoryState(): StoryState {
  const first = STORY_CHAPTERS[0];
  return {
    chapter: first?.chapter ?? 1,
    title: first?.title ?? '千燈初醒',
    goal: first?.goal ?? '在千燈鎮立足，認識江湖的第一批人。',
    progress: 0,
    nextMilestone: first?.nextMilestone ?? 6,
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
    if (cond.id === 'bleeding') c.health -= 8 + cond.severity * 2;
    if (cond.id === 'internal') {
      c.health -= 4;
      c.qi -= 10;
    }
    if (cond.id === 'poison') {
      c.health -= 5;
      c.qi -= 6;
    }
    if (cond.id === 'fracture' || cond.id === 'limp') c.stamina -= 10;
    const left = cond.monthsLeft - 1;
    if (left > 0) next.push({ ...cond, monthsLeft: left });
  }
  c.conditions = next;
  c.health = clamp(c.health, 0, c.maxHealth);
  c.qi = clamp(c.qi, 0, c.maxQi);
  c.stamina = clamp(c.stamina, 0, c.maxStamina);
}

export function simulateWorldMonth(state: LifeGameState): void {
  const rng = getRng();
  const w = state.world;
  w.order = clamp(w.order + rng.nextInt(-4, 4), 10, 95);
  w.danger = clamp(w.danger + rng.nextInt(-5, 6), 5, 95);
  w.economy = clamp(w.economy + rng.nextInt(-4, 5), 10, 95);
  w.rumors = clamp(w.rumors + rng.nextInt(-6, 8), 5, 95);
  const moods = ['平穩', '風雨欲來', '市井熙攘', '人心惶惶', '清平'];
  w.seasonMood = rng.pick(moods);
  w.lastWorldShift =
    w.danger > 60
      ? '山道不太平，行人都加快腳步。'
      : w.economy > 65
        ? '千燈鎮市集熱鬧，銀錢流動得快。'
        : '鎮外風聲仍不大。';
}

export function advanceStoryMonth(state: LifeGameState): void {
  const s = state.story;
  s.progress += 1;
  if (s.progress >= s.nextMilestone) {
    s.chapter += 1;
    s.progress = 0;
    const def = STORY_CHAPTERS.find((ch) => ch.chapter === s.chapter);
    if (def) {
      s.title = def.title;
      s.goal = def.goal;
      s.nextMilestone = def.nextMilestone;
    } else {
      s.nextMilestone = Math.min(18, s.nextMilestone + 2);
      s.title = '江湖遠志';
      s.goal = '讓這一生留下可被傳頌的痕跡。';
    }
  }
}

export function simulateMonthBody(state: LifeGameState): void {
  const rng = getRng();
  const c = state.character;
  c.fatigue = clamp(c.fatigue + rng.nextInt(5, 14), 0, 100);
  c.health = clamp(c.health + rng.nextInt(2, 8) - (c.fatigue > 80 ? 10 : 0), 0, c.maxHealth);
  c.qi = clamp(c.qi + rng.nextInt(4, 12), 0, c.maxQi);
  c.stamina = clamp(c.stamina + rng.nextInt(4, 12), 0, c.maxStamina);
  tickConditions(state);
  simulateWorldMonth(state);
  advanceStoryMonth(state);
  tryMonthlyBirth(state);

  if (c.health <= 0) {
    c.alive = false;
    c.health = 0;
  }
  if (c.age > 72 && rng.chance((c.age - 70) / 180)) {
    c.alive = false;
  }
}

export function seasonLabel(month: number): string {
  if (month <= 2 || month === 12) return '冬';
  if (month <= 5) return '春';
  if (month <= 8) return '夏';
  return '秋';
}
