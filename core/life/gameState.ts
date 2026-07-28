import type { LifeCharacter, LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { initRng, getRng, getRngState } from '@core/random';
import { randomChineseName, resetIdCounter } from '@core/ids';

const SECT_DEFS = [
  { id: 'sect_qingyun', name: '青雲劍派' },
  { id: 'sect_tiandao', name: '天刀門' },
  { id: 'sect_emei', name: '峨嵋派' },
  { id: 'sect_shaolin', name: '少林派' },
  { id: 'sect_wudang', name: '武當派' },
];

function rollAttribute(rng: ReturnType<typeof getRng>): number {
  return rng.nextInt(30, 85);
}

function createAttributes(rng: ReturnType<typeof getRng>): Record<WuxiaAttribute, number> {
  const attrs = {} as Record<WuxiaAttribute, number>;
  for (const k of wuxiaAttributeKeys) {
    attrs[k] = rollAttribute(rng);
  }
  return attrs;
}

export function createNewLife(seed?: number): LifeGameState {
  const s = seed ?? (Date.now() & 0xffffffff);
  resetIdCounter(0);
  initRng(s);
  const rng = getRng();

  const gender: 'male' | 'female' = rng.chance(0.5) ? 'male' : 'female';
  const name = randomChineseName();
  const fatherName = randomChineseName();
  const motherName = randomChineseName();
  const attrs = createAttributes(rng);
  const maxHealth = 80 + Math.floor(attrs.genGu / 2);

  const character: LifeCharacter = {
    name,
    gender,
    age: 0,
    alive: true,
    health: maxHealth,
    maxHealth,
    money: rng.nextInt(10, 80),
    reputation: 0,
    martial: 0,
    attributes: attrs,
    skills: [],
    sectId: null,
    loverId: null,
    flags: {},
    family: { fatherName, motherName },
    stats: {
      yearsLived: 0,
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
      memories: ['子女降生'],
      alive: true,
    },
    parent_mother: {
      id: 'parent_mother',
      name: motherName,
      gender: 'female',
      role: 'parent',
      affinity: 85,
      memories: ['子女降生'],
      alive: true,
    },
  };

  const sects: LifeGameState['sects'] = {};
  for (const def of SECT_DEFS) {
    sects[def.id] = { id: def.id, name: def.name };
  }

  const year = 1000;

  const state: LifeGameState = {
    version: 1,
    seed: s,
    rngState: getRngState(),
    year,
    character,
    npcs,
    sects,
    worldFlags: {},
    completedEvents: [],
    pending: { eventId: 'life_birth', year },
    lifeLog: [
      `你降生於${year}年，父${fatherName}、母${motherName}為你取名「${name}」。`,
      `根骨 ${attrs.genGu} · 悟性 ${attrs.wuXing} · 福緣 ${attrs.fuYuan}`,
    ],
    phase: 'playing',
  };

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
  syncRngFromState(state);
  state.character.age += 1;
  state.character.stats.yearsLived += 1;
  state.year += 1;

  const c = state.character;
  if (c.age > 50) {
    c.health -= Math.floor((c.age - 50) / 5);
  }
  if (c.health <= 0) {
    c.alive = false;
    c.health = 0;
  }

  snapshotRng(state);
}

export function markEventComplete(state: LifeGameState, eventId: string): void {
  if (!state.completedEvents.includes(eventId)) {
    state.completedEvents.push(eventId);
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

