import type { LifeGameState, WorldState, StoryState, LifeCondition } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { STORY_CHAPTERS } from '@data/content/packs';
import { tryMonthlyBirth } from './family';
import { tickAftermath } from './aftermath';
import { pushChronicle } from './chronicle';

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

export function advanceStoryMonth(state: LifeGameState): void {
  const s = state.story;
  const prevChapter = s.chapter;
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
  if (s.chapter > prevChapter) {
    const poetic = [
      '歲月無聲翻過一頁，你覺得腳下的路又長了一寸。',
      '燈火依舊，心事卻換了顏色。',
      '有些約定淡了，有些刀痕卻更深。',
      '你把一段日子折進袖裡，繼續趕路。',
    ];
    const rng = getRng();
    pushChronicle(state, [rng.pick(poetic)]);
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
  tickAftermath(state);

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
