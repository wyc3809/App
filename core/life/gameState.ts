import type { LifeCharacter, LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { initRng, getRng, getRngState } from '@core/random';
import { randomChineseName, resetIdCounter } from '@core/ids';
import { SECT_CONTENT } from '@data/content/packs';
import { rollLifetimeChildrenMax } from './family';
import { defaultNature } from './nature';
import { makeStoryState, makeWorldState } from './monthly';
import { recomputeCapBonuses } from './equipment';
import { applyLegacyToCharacter, type LegacyCarry } from './legacy';
import { ensureStarterNpcs } from './npcCatalog';

export const SECT_DEFS = SECT_CONTENT.map((s) => ({
  id: s.id,
  name: s.name,
  hint: s.hint,
  trait: s.trait,
  natureGate: s.natureGate,
}));

function createAttributes(rng: ReturnType<typeof getRng>): Record<WuxiaAttribute, number> {
  const attrs = {} as Record<WuxiaAttribute, number>;
  for (const k of wuxiaAttributeKeys) {
    attrs[k] = rng.nextInt(30, 75);
  }
  return attrs;
}

export interface CreateLifeOptions {
  seed?: number;
  name?: string;
  gender?: 'male' | 'female';
  birthplace?: string;
  /** 前世傳承；轉世時帶入 */
  legacy?: LegacyCarry;
  /** 首局教練（預設開） */
  skipCoach?: boolean;
}

export function createNewLife(options: CreateLifeOptions | number = {}): LifeGameState {
  const opts: CreateLifeOptions = typeof options === 'number' ? { seed: options } : options;
  const s = opts.seed ?? (Date.now() & 0xffffffff);
  resetIdCounter(0);
  initRng(s);
  const rng = getRng();

  const gender: 'male' | 'female' = opts.gender ?? (rng.chance(0.5) ? 'male' : 'female');
  const name = opts.name?.trim() || randomChineseName();
  const birthplace = opts.birthplace || opts.legacy?.birthplace || '千燈鎮';
  const fatherName = randomChineseName();
  const motherName = randomChineseName();
  const attrs = createAttributes(rng);
  const maxHealth = 180 + Math.floor(attrs.genGu * 2.2);
  const maxQi = 140 + Math.floor(attrs.wuXing * 2);
  const maxStamina = 120 + Math.floor(attrs.genGu * 1.2);

  const character: LifeCharacter = {
    name,
    gender,
    age: 16,
    alive: true,
    health: maxHealth,
    maxHealth,
    money: rng.nextInt(60, 120),
    reputation: 0,
    martial: 8,
    qi: maxQi,
    maxQi,
    stamina: maxStamina,
    maxStamina,
    fatigue: 0,
    birthplace,
    location: birthplace,
    conditions: [],
    attributes: attrs,
    nature: defaultNature(),
    skills: ['基礎吐納', 'art_river_fist'],
    skillRanks: { 基礎吐納: 0, art_river_fist: 0 },
    skillProgress: { 基礎吐納: 0, art_river_fist: 0 },
    skillAdvanceNeed: {
      基礎吐納: rng.nextInt(10, 30),
      art_river_fist: rng.nextInt(10, 30),
    },
    gear: ['old-sword', 'plain-robe'],
    equipment: { weapon: 'old-sword', armor: 'plain-robe', accessory: null },
    sectId: null,
    sectStanding: 0,
    loverId: null,
    childrenCount: 0,
    childrenMax: rollLifetimeChildrenMax(rng),
    monthsSinceLastBirth: 99,
    flags: {
      baseMaxHp: maxHealth,
      baseMaxQi: maxQi,
      legacy_generation: opts.legacy?.generation ?? 1,
      ...(opts.skipCoach || opts.legacy ? { coach_done: true } : {}),
    },
    family: { fatherName, motherName, childrenNames: [] },
    stats: {
      yearsLived: 0,
      monthsLived: 0,
      eventsSeen: 0,
      combats: 0,
      combatsWon: 0,
      lovers: 0,
      wealthPeak: 0,
    },
  };
  character.stats.wealthPeak = character.money;
  recomputeCapBonuses(character);

  const npcs: LifeGameState['npcs'] = {
    parent_father: {
      id: 'parent_father',
      name: fatherName,
      gender: 'male',
      role: 'parent',
      affinity: 80,
      memories: ['子女遠行'],
      alive: true,
    },
    parent_mother: {
      id: 'parent_mother',
      name: motherName,
      gender: 'female',
      role: 'parent',
      affinity: 85,
      memories: ['子女遠行'],
      alive: true,
    },
  };

  const sects: LifeGameState['sects'] = {};
  for (const def of SECT_DEFS) {
    sects[def.id] = { id: def.id, name: def.name };
  }

  const year = 18;
  const month = 1;
  const lifeLog = [
    `【${year}年${month}月·${birthplace}】${name}辭別父母，踏上江湖。`,
    `根骨 ${attrs.genGu} · 悟性 ${attrs.wuXing} · 福緣 ${attrs.fuYuan} · 魅力 ${attrs.meiLi} · 膽識 ${attrs.danShi}`,
    `心性 俠${character.nature.xia} · 邪${character.nature.xie} · 狂${character.nature.kuang} · 惡${character.nature.e}`,
    `氣血上限 ${maxHealth} · 內力上限 ${maxQi}`,
  ];

  const state: LifeGameState = {
    version: 1,
    seed: s,
    rngState: getRngState(),
    year,
    month,
    character,
    npcs,
    sects,
    world: makeWorldState(),
    story: makeStoryState(),
    specialEventCountdown: rng.nextInt(3, 10),
    worldFlags: {},
    completedEvents: [],
    recentEvents: [],
    combatEncounterCountdown: rng.nextInt(5, 11),
    bossEncounterCountdown: rng.nextInt(3, 7),
    pending: null,
    pendingCombat: null,
    practiceActionsLeft: 3,
    lifeLog,
    phase: 'playing',
    tab: 'home',
  };

  if (opts.legacy) {
    const legacyLines = applyLegacyToCharacter(state, opts.legacy);
    state.lifeLog.push(...legacyLines);
    recomputeCapBonuses(state.character);
  }

  ensureStarterNpcs(state);
  state.lifeLog.push(
    '鎮裡有幾張熟面孔：陸硯生執教、沈暮晴坐堂、岳長風把武館——因緣或自他們而起。',
  );

  return state;
}

export function syncRngFromState(state: LifeGameState): void {
  initRng(state.seed);
  const rng = getRng();
  (rng as unknown as { state: bigint }).state = BigInt(state.rngState);
}

export function snapshotRng(state: LifeGameState): void {
  state.rngState = getRngState();
}

export function advanceYear(state: LifeGameState): void {
  if (!state.character.alive || state.phase !== 'playing') return;
  state.character.age += 1;
  state.character.stats.yearsLived += 1;
  state.year += 1;
}

/** 同一事件約略 50 個月內不再重複抽出 */
export const EVENT_REPEAT_COOLDOWN_MONTHS = 50;

export function markEventComplete(state: LifeGameState, eventId: string): void {
  if (!state.completedEvents.includes(eventId)) {
    state.completedEvents.push(eventId);
  }
  state.character.flags[`done_${eventId}`] = true;
  // Pack v1 completion flag（forbidden_flags: completed_event_XXX）
  if (eventId.startsWith('event_')) {
    state.character.flags[`completed_${eventId}`] = true;
  }
  const at = state.character.stats.monthsLived ?? 0;
  const recent = state.recentEvents ?? [];
  recent.push({ id: eventId, at });
  state.recentEvents = recent.filter((e) => at - e.at < EVENT_REPEAT_COOLDOWN_MONTHS + 4);
  state.character.stats.eventsSeen += 1;
}

export function isEventOnRepeatCooldown(state: LifeGameState, eventId: string): boolean {
  const at = state.character.stats.monthsLived ?? 0;
  return (state.recentEvents ?? []).some(
    (e) => e.id === eventId && at - e.at < EVENT_REPEAT_COOLDOWN_MONTHS,
  );
}

export function ensureNpc(
  state: LifeGameState,
  id: string,
  name: string,
  role: LifeGameState['npcs'][string]['role'],
): void {
  if (!state.npcs[id]) {
    state.npcs[id] = {
      id,
      name,
      gender: getRng().chance(0.5) ? 'male' : 'female',
      role,
      affinity: 0,
      memories: [],
      alive: true,
    };
  }
}

/** Migrate older saves missing monthly fields */
export function migrateLifeState(raw: LifeGameState): LifeGameState {
  const c = raw.character;
  if (c.qi === undefined) c.qi = 80;
  if (c.maxQi === undefined) c.maxQi = 120;
  if (c.stamina === undefined) c.stamina = 100;
  if (c.maxStamina === undefined) c.maxStamina = 120;
  if (c.fatigue === undefined) c.fatigue = 0;
  if (!c.birthplace) c.birthplace = '千燈鎮';
  if (!c.location) c.location = c.birthplace;
  if (!c.conditions) c.conditions = [];
  if (!c.gear) c.gear = ['old-sword', 'plain-robe'];
  if (!c.equipment) c.equipment = { weapon: 'old-sword', armor: 'plain-robe', accessory: null };
  if (!c.skillRanks) c.skillRanks = {};
  if (!c.skillProgress) c.skillProgress = {};
  if (!c.skillAdvanceNeed) c.skillAdvanceNeed = {};
  for (const id of c.skills ?? []) {
    if (c.skillRanks[id] === undefined) c.skillRanks[id] = 0;
    if (c.skillProgress[id] === undefined) c.skillProgress[id] = 0;
  }
  if (c.sectStanding === undefined) c.sectStanding = c.sectId ? 0 : 0;
  if (c.childrenCount === undefined) c.childrenCount = c.family?.childrenNames?.length ?? 0;
  if (c.childrenMax === undefined) c.childrenMax = Math.max(1, Math.min(5, c.childrenCount || 3));
  if (c.monthsSinceLastBirth === undefined) c.monthsSinceLastBirth = 99;
  if (!c.family) c.family = {};
  if (!c.family.childrenNames) c.family.childrenNames = [];
  if (!c.nature) c.nature = defaultNature();
  for (const k of ['xia', 'xie', 'kuang', 'e'] as const) {
    if (typeof c.nature[k] !== 'number') c.nature[k] = defaultNature()[k];
  }
  if (c.flags.baseMaxHp === undefined) c.flags.baseMaxHp = c.maxHealth;
  if (c.flags.baseMaxQi === undefined) c.flags.baseMaxQi = c.maxQi;
  if (c.sectId && !c.flags.joined_sect) c.flags.joined_sect = true;
  if (c.stats.monthsLived === undefined) c.stats.monthsLived = 0;
  if (raw.month === undefined) raw.month = 1;
  if (!raw.world) raw.world = makeWorldState();
  if (!raw.story) raw.story = makeStoryState();
  if (raw.specialEventCountdown === undefined) raw.specialEventCountdown = 12;
  if (!raw.tab) raw.tab = 'home';
  if (raw.pendingCombat === undefined) raw.pendingCombat = null;
  if (raw.practiceActionsLeft === undefined) raw.practiceActionsLeft = 3;
  if (!Array.isArray(raw.recentEvents)) raw.recentEvents = [];
  if (raw.combatEncounterCountdown === undefined) {
    raw.combatEncounterCountdown = 8;
  }
  if (raw.bossEncounterCountdown === undefined) {
    raw.bossEncounterCountdown = 5;
  }
  if (!raw.sects) raw.sects = {};
  for (const def of SECT_DEFS) {
    if (!raw.sects[def.id]) {
      raw.sects[def.id] = { id: def.id, name: def.name };
    } else {
      raw.sects[def.id].name = def.name;
    }
  }
  recomputeCapBonuses(raw.character);
  ensureStarterNpcs(raw);
  return raw;
}
