import type { LifeCharacter, LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { initRng, getRng, getRngState } from '@core/random';
import { randomChineseName, resetIdCounter } from '@core/ids';
import { makeStoryState, makeWorldState } from './monthly';

const SECT_DEFS = [
  { id: 'sect_qingyun', name: '青雲劍派' },
  { id: 'sect_tiandao', name: '天刀門' },
  { id: 'sect_emei', name: '峨嵋派' },
  { id: 'sect_shaolin', name: '少林派' },
  { id: 'sect_wudang', name: '武當派' },
];

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
}

export function createNewLife(options: CreateLifeOptions | number = {}): LifeGameState {
  const opts: CreateLifeOptions = typeof options === 'number' ? { seed: options } : options;
  const s = opts.seed ?? (Date.now() & 0xffffffff);
  resetIdCounter(0);
  initRng(s);
  const rng = getRng();

  const gender: 'male' | 'female' = opts.gender ?? (rng.chance(0.5) ? 'male' : 'female');
  const name = opts.name?.trim() || randomChineseName();
  const birthplace = opts.birthplace || '千燈鎮';
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
    skills: ['基礎吐納'],
    gear: ['old-sword', 'plain-robe'],
    equipment: { weapon: 'old-sword', armor: 'plain-robe', accessory: null },
    sectId: null,
    loverId: null,
    flags: { baseMaxHp: maxHealth, baseMaxQi: maxQi },
    family: { fatherName, motherName },
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

  return {
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
    specialEventCountdown: rng.nextInt(5, 30),
    worldFlags: {},
    completedEvents: [],
    pending: null,
    lifeLog: [
      `【${year}年${month}月·${birthplace}】${name}辭別父母，踏上江湖。`,
      `根骨 ${attrs.genGu} · 悟性 ${attrs.wuXing} · 福緣 ${attrs.fuYuan} · 魅力 ${attrs.meiLi} · 膽識 ${attrs.danShi}`,
      `氣血上限 ${maxHealth} · 內力上限 ${maxQi}`,
    ],
    phase: 'playing',
    tab: 'home',
  };
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

export function markEventComplete(state: LifeGameState, eventId: string): void {
  if (!state.completedEvents.includes(eventId)) {
    state.completedEvents.push(eventId);
  }
  state.character.flags[`done_${eventId}`] = true;
  // Pack v1 completion flag（forbidden_flags: completed_event_XXX）
  if (eventId.startsWith('event_')) {
    state.character.flags[`completed_${eventId}`] = true;
  }
  state.character.stats.eventsSeen += 1;
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
  if (c.flags.baseMaxHp === undefined) c.flags.baseMaxHp = c.maxHealth;
  if (c.flags.baseMaxQi === undefined) c.flags.baseMaxQi = c.maxQi;
  if (c.stats.monthsLived === undefined) c.stats.monthsLived = 0;
  if (raw.month === undefined) raw.month = 1;
  if (!raw.world) raw.world = makeWorldState();
  if (!raw.story) raw.story = makeStoryState();
  if (raw.specialEventCountdown === undefined) raw.specialEventCountdown = 12;
  if (!raw.tab) raw.tab = 'home';
  return raw;
}
