import type { EventChoice, GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { gameEventSchema } from '@interfaces/lifeEngine';
import { applyEffects } from './effects';
import { meetsRequirements } from './requirements';
import { advanceYear, markEventComplete, snapshotRng, syncRngFromState } from './gameState';
import { buildLifeSummary } from './summary';
import { getRng } from '@core/random';

export function validateEvent(raw: unknown): GameEvent {
  return gameEventSchema.parse(raw);
}

export function validateEvents(raw: unknown[]): GameEvent[] {
  return raw.map((e) => gameEventSchema.parse(e));
}

export function getEventById(catalog: GameEvent[], id: string): GameEvent | undefined {
  return catalog.find((e) => e.id === id);
}

export function listEligibleEvents(catalog: GameEvent[], state: LifeGameState): GameEvent[] {
  return catalog.filter((e) => meetsRequirements(state, e.requirements, e.id));
}

export function pickYearEvent(catalog: GameEvent[], state: LifeGameState): GameEvent | null {
  syncRngFromState(state);
  const rng = getRng();
  const eligible = listEligibleEvents(catalog, state).filter(
    (e) => e.id !== 'life_birth' || state.character.age === 0,
  );
  if (!eligible.length) return null;

  const totalWeight = eligible.reduce((s, e) => s + (e.weight ?? 10), 0);
  let roll = rng.nextFloat() * totalWeight;
  for (const e of eligible) {
    roll -= e.weight ?? 10;
    if (roll <= 0) {
      snapshotRng(state);
      return e;
    }
  }
  snapshotRng(state);
  return eligible[eligible.length - 1];
}

export function pickOutcomeForChoice(
  state: LifeGameState,
  outcomes: EventChoice['outcomes'],
): EventChoice['outcomes'][number] {
  syncRngFromState(state);
  const rng = getRng();
  const hasChance = outcomes.some((o) => o.chance !== undefined);
  if (hasChance) {
    for (const o of outcomes) {
      if (rng.chance(o.chance ?? 1)) {
        snapshotRng(state);
        return o;
      }
    }
    snapshotRng(state);
    return outcomes[outcomes.length - 1];
  }
  const total = outcomes.reduce((s, o) => s + (o.weight ?? 1), 0);
  let roll = rng.nextFloat() * total;
  for (const o of outcomes) {
    roll -= o.weight ?? 1;
    if (roll <= 0) {
      snapshotRng(state);
      return o;
    }
  }
  snapshotRng(state);
  return outcomes[outcomes.length - 1];
}

export interface ResolveResult {
  state: LifeGameState;
  logs: string[];
  died: boolean;
}

export function applyChoice(
  state: LifeGameState,
  event: GameEvent,
  choiceId: string,
): ResolveResult {
  syncRngFromState(state);
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) {
    return { state, logs: ['無此選擇。'], died: false };
  }
  if (!meetsRequirements(state, choice.requirements)) {
    return { state, logs: ['條件不足。'], died: false };
  }

  const outcome = pickOutcomeForChoice(state, choice.outcomes);
  const { logs, died } = applyEffects(state, outcome.effects);

  markEventComplete(state, event.id);
  state.pending = null;
  state.lifeLog = [...logs, ...state.lifeLog].slice(0, 120);

  if (died || !state.character.alive) {
    state.character.alive = false;
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
  }

  snapshotRng(state);
  return { state, logs, died };
}

export function startYear(state: LifeGameState, catalog: GameEvent[]): LifeGameState {
  if (!state.character.alive || state.phase !== 'playing') return state;
  if (state.pending) return state;

  advanceYear(state);

  if (!state.character.alive) {
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
    return state;
  }

  const event = pickYearEvent(catalog, state);
  if (event) {
    state.pending = { eventId: event.id, year: state.year };
  } else {
    state.lifeLog = [`${state.year}年風平浪靜。`, ...state.lifeLog].slice(0, 120);
  }
  snapshotRng(state);
  return state;
}

export function resolvePendingAuto(state: LifeGameState, event: GameEvent): ResolveResult {
  const choice = event.choices[0];
  const outcome = choice.outcomes[0];
  const { logs, died } = applyEffects(state, outcome.effects);
  markEventComplete(state, event.id);
  state.pending = null;
  state.lifeLog = [...logs, ...state.lifeLog].slice(0, 120);
  if (died) {
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
  }
  snapshotRng(state);
  return { state, logs, died };
}
