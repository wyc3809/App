import packJson from '@data/events/jianghu_random_events_100.json';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng, isEventOnRepeatCooldown } from './gameState';

/** Pack v1 原始結構（對應 content/events/jianghu_random_events_100.json） */
export type PackOutcomeOp = {
  op?: string;
  path?: string;
  value?: unknown;
  chance?: number;
  note?: string;
};

export type PackChoiceRaw = {
  id: string;
  text: string;
  requirements?: unknown[];
  outcomes?: PackOutcomeOp[];
  result_text?: string | { success?: string; failure?: string };
};

export type PackEventRaw = {
  id: string;
  title: string;
  category?: string;
  rarity?: string;
  weight?: number;
  summary?: string;
  description?: string;
  tags?: string[];
  conditions?: {
    min_age?: number | null;
    max_age?: number | null;
    allowed_locations?: string[];
    required_flags?: string[];
    forbidden_flags?: string[];
    attribute_checks?: unknown[];
    relationship_checks?: unknown[];
  };
  choices?: PackChoiceRaw[];
};

export type PackLibrary = {
  library_id: string;
  version: string;
  language: string;
  event_count: number;
  events: PackEventRaw[];
};

const library = packJson as unknown as PackLibrary;

export function getPackLibrary(): PackLibrary {
  return library;
}

export function getPackEventById(id: string): PackEventRaw | undefined {
  return library.events.find((e) => e.id === id);
}

export function getPackChoice(eventId: string, choiceId: string): PackChoiceRaw | undefined {
  return getPackEventById(eventId)?.choices?.find((c) => c.id === choiceId);
}

/** 按 conditions 過濾（含 completion flags） */
export function filterPackByConditions(state: LifeGameState): PackEventRaw[] {
  const c = state.character;
  return library.events.filter((event) => {
    const cond = event.conditions ?? {};
    if (cond.min_age != null && c.age < cond.min_age) return false;
    if (cond.max_age != null && c.age > cond.max_age) return false;

    for (const f of cond.required_flags ?? []) {
      if (!c.flags[f] && !state.completedEvents.includes(f.replace(/^completed_/, ''))) {
        return false;
      }
    }
    for (const f of cond.forbidden_flags ?? []) {
      if (c.flags[f]) return false;
      const eid = f.replace(/^completed_/, '');
      if (state.completedEvents.includes(eid) || state.completedEvents.includes(f)) return false;
    }

    const allowed = cond.allowed_locations ?? [];
    if (allowed.length > 0) {
      const loc = c.location || c.birthplace || '';
      if (!allowed.includes(loc)) return false;
    }

    if (isEventOnRepeatCooldown(state, event.id)) return false;

    return true;
  });
}

/** 按 weight 加權抽取 */
export function pickWeightedPackEvent(
  state: LifeGameState,
  eligible: PackEventRaw[],
): PackEventRaw | null {
  if (!eligible.length) return null;
  syncRngFromState(state);
  const rng = getRng();
  const total = eligible.reduce((s, e) => s + Math.max(0, Number(e.weight ?? 1)), 0);
  if (total <= 0) {
    const picked = rng.pick(eligible);
    snapshotRng(state);
    return picked;
  }
  let roll = rng.nextFloat() * total;
  for (const e of eligible) {
    roll -= Math.max(0, Number(e.weight ?? 1));
    if (roll <= 0) {
      snapshotRng(state);
      return e;
    }
  }
  snapshotRng(state);
  return eligible[eligible.length - 1];
}

/** 條件過濾 → 加權抽取 */
export function pickPackEvent(state: LifeGameState): PackEventRaw | null {
  return pickWeightedPackEvent(state, filterPackByConditions(state));
}

export function packCompletionFlag(eventId: string): string {
  return `completed_${eventId}`;
}
