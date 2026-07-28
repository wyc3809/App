import type { CharacterEntity, GameState } from '@interfaces/game';
import { restoreRng, getRngState } from './random';

export const SAVE_STORAGE_KEY = 'jianghu_engine_save_v1';

export const SAVE_SCHEMA_VERSION = 1;

export interface CharacterDelta {
  id: string;
  patch: Partial<CharacterEntity>;
}

export interface GameSaveDelta {
  tickCount: number;
  timestamp: GameState['timestamp'];
  rngState: string;
  playerId: string;
  characterDeltas: CharacterDelta[];
  factionPatches: Record<string, Partial<GameState['factions'][string]>>;
  newHistory: GameState['history'];
  newRumors: GameState['rumors'];
  newEvents: GameState['events'];
  feedTail?: string[];
}

export interface PersistedSave {
  version: number;
  savedAt: number;
  baseline: GameState;
  deltas: GameSaveDelta[];
  feed?: string[];
}

function shallowCharacterDiff(
  prev: CharacterEntity,
  next: CharacterEntity,
): Partial<CharacterEntity> | null {
  const patch: Partial<CharacterEntity> = {};
  const keys = Object.keys(next) as (keyof CharacterEntity)[];
  for (const k of keys) {
    if (JSON.stringify(prev[k]) !== JSON.stringify(next[k])) {
      (patch as Record<string, unknown>)[k] = next[k];
    }
  }
  return Object.keys(patch).length ? patch : null;
}

function applyCharacterDelta(characters: Record<string, CharacterEntity>, delta: CharacterDelta): void {
  const base = characters[delta.id];
  if (!base) {
    characters[delta.id] = delta.patch as CharacterEntity;
    return;
  }
  characters[delta.id] = { ...base, ...delta.patch };
}

function applyDelta(state: GameState, delta: GameSaveDelta): GameState {
  const next = structuredClone(state);
  next.tickCount = delta.tickCount;
  next.timestamp = delta.timestamp;
  next.playerId = delta.playerId;
  for (const cd of delta.characterDeltas) {
    applyCharacterDelta(next.characters, cd);
  }
  for (const [fid, patch] of Object.entries(delta.factionPatches)) {
    if (next.factions[fid]) {
      next.factions[fid] = { ...next.factions[fid], ...patch };
    }
  }
  const mergeUnique = <T extends { id: string }>(incoming: T[], existing: T[]): T[] => {
    const ids = new Set(existing.map((x) => x.id));
    const added = incoming.filter((x) => !ids.has(x.id));
    return [...added, ...existing].slice(0, 500);
  };
  next.history = mergeUnique(delta.newHistory, next.history).slice(0, 500);
  next.rumors = mergeUnique(delta.newRumors, next.rumors).slice(0, 50);
  next.events = mergeUnique(delta.newEvents, next.events).slice(0, 200);
  next.lastSaveTick = delta.tickCount;
  return next;
}

export function rebuildStateFromSave(save: PersistedSave): GameState {
  let state = structuredClone(save.baseline);
  for (const d of save.deltas) {
    state = applyDelta(state, d);
  }
  const last = save.deltas[save.deltas.length - 1];
  if (last?.rngState) {
    restoreRng(last.rngState);
  } else {
    restoreRng(getRngState());
  }
  return migrateLoadedState(state);
}

function migrateLoadedState(state: GameState): GameState {
  const cityIds = Object.keys(state.cities);
  const fallbackCity = cityIds[0];
  for (const f of Object.values(state.factions)) {
    if (!f.memberIds) f.memberIds = [];
    if (!f.rivalFactionIds) f.rivalFactionIds = [];
    if (f.treasury === undefined) f.treasury = 100;
    if (!f.doctrine) f.doctrine = '江湖';
    if (!f.homeCityId && fallbackCity) f.homeCityId = fallbackCity;
  }
  for (const c of Object.values(state.characters)) {
    if (c.factionId && !c.factionMembership) {
      c.factionMembership = {
        factionId: c.factionId,
        rank: 'outer',
        merit: 0,
        joinedAt: { ...state.timestamp },
      };
    }
  }
  for (const f of Object.values(state.factions)) {
    f.memberIds = Object.values(state.characters)
      .filter((c) => c.alive && c.factionId === f.id)
      .map((c) => c.id);
  }
  return state;
}

export function createDelta(
  prev: GameState,
  next: GameState,
  feed?: string[],
): GameSaveDelta {
  const characterDeltas: CharacterDelta[] = [];
  for (const id of new Set([...Object.keys(prev.characters), ...Object.keys(next.characters)])) {
    const a = prev.characters[id];
    const b = next.characters[id];
    if (!b) continue;
    if (!a) {
      characterDeltas.push({ id, patch: b });
      continue;
    }
    const patch = shallowCharacterDiff(a, b);
    if (patch) characterDeltas.push({ id, patch });
  }

  const factionPatches: GameSaveDelta['factionPatches'] = {};
  for (const id of Object.keys(next.factions)) {
    const a = prev.factions[id];
    const b = next.factions[id];
    if (!b) continue;
    if (!a) {
      factionPatches[id] = b;
      continue;
    }
    const patch: Record<string, unknown> = {};
    for (const k of Object.keys(b) as (keyof typeof b)[]) {
      if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
        patch[k as string] = b[k];
      }
    }
    if (Object.keys(patch).length) factionPatches[id] = patch;
  }

  const prevHistoryIds = new Set(prev.history.map((h) => h.id));
  const newHistory = next.history.filter((h) => !prevHistoryIds.has(h.id));
  const prevRumorIds = new Set(prev.rumors.map((r) => r.id));
  const newRumors = next.rumors.filter((r) => !prevRumorIds.has(r.id));
  const prevEventIds = new Set(prev.events.map((e) => e.id));
  const newEvents = next.events.filter((e) => !prevEventIds.has(e.id));

  return {
    tickCount: next.tickCount,
    timestamp: next.timestamp,
    rngState: getRngState(),
    playerId: next.playerId,
    characterDeltas,
    factionPatches,
    newHistory,
    newRumors,
    newEvents,
    feedTail: feed?.slice(0, 40),
  };
}

export function compactSave(_save: PersistedSave, rebuilt: GameState, feed?: string[]): PersistedSave {
  return {
    version: SAVE_SCHEMA_VERSION,
    savedAt: Date.now(),
    baseline: structuredClone(rebuilt),
    deltas: [],
    feed: feed?.slice(0, 40),
  };
}

export function persistSave(
  prevPersisted: PersistedSave | null,
  prevState: GameState | null,
  nextState: GameState,
  feed?: string[],
): PersistedSave {
  if (!prevPersisted || !prevState) {
    return {
      version: SAVE_SCHEMA_VERSION,
      savedAt: Date.now(),
      baseline: structuredClone(nextState),
      deltas: [],
      feed: feed?.slice(0, 40),
    };
  }

  const delta = createDelta(prevState, nextState, feed);

  const hasChanges =
    delta.characterDeltas.length > 0 ||
    Object.keys(delta.factionPatches).length > 0 ||
    delta.newHistory.length > 0 ||
    delta.tickCount !== prevState.tickCount;

  if (!hasChanges) {
    return { ...prevPersisted, savedAt: Date.now(), feed: feed?.slice(0, 40) };
  }

  const deltas = [...prevPersisted.deltas, delta];
  let baseline = prevPersisted.baseline;
  if (deltas.length >= 12) {
    const rebuilt = rebuildStateFromSave({ ...prevPersisted, deltas });
    return compactSave({ ...prevPersisted, baseline, deltas }, rebuilt, feed);
  }

  return {
    version: SAVE_SCHEMA_VERSION,
    savedAt: Date.now(),
    baseline,
    deltas,
    feed: feed?.slice(0, 40),
  };
}

export function readPersistedSave(): PersistedSave | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSave;
    if (parsed.version !== SAVE_SCHEMA_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadSaveFromStorage(): { state: GameState; feed: string[]; savedAt: number } | null {
  const parsed = readPersistedSave();
  if (!parsed) return null;
  const state = rebuildStateFromSave(parsed);
  return {
    state,
    feed: parsed.feed ?? ['你睜開眼，昨日江湖猶在。'],
    savedAt: parsed.savedAt,
  };
}

export function writeSaveToStorage(save: PersistedSave): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(save));
}

export function clearSaveStorage(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(SAVE_STORAGE_KEY);
}

export function formatSaveTime(ms: number): string {
  return new Date(ms).toLocaleString('zh-TW', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
