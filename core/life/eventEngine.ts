import type { EventChoice, GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { gameEventSchema } from '@interfaces/lifeEngine';
import { applyEffects } from './effects';
import { meetsRequirements } from './requirements';
import { advanceYear, markEventComplete, snapshotRng, syncRngFromState } from './gameState';
import { buildLifeSummary } from './summary';
import { pushChronicle, yearQuietLine } from './chronicle';
import { stageWeightBias } from './stages';
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
  return catalog.filter((e) => {
    if (e.id === 'life_birth' && state.character.age > 0) return false;
    if (e.id === 'life_birth' && state.completedEvents.includes('life_birth')) return false;
    return meetsRequirements(state, e.requirements, e.id);
  });
}

function eventWeight(state: LifeGameState, e: GameEvent): number {
  const base = e.weight ?? 10;
  return base * stageWeightBias(state.character.age, e.tags);
}

export function pickYearEvent(catalog: GameEvent[], state: LifeGameState): GameEvent | null {
  syncRngFromState(state);
  const rng = getRng();
  const eligible = listEligibleEvents(catalog, state);
  if (!eligible.length) return null;

  const totalWeight = eligible.reduce((s, e) => s + eventWeight(state, e), 0);
  let roll = rng.nextFloat() * totalWeight;
  for (const e of eligible) {
    roll -= eventWeight(state, e);
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

function maybeTrackCombat(state: LifeGameState, event: GameEvent, logs: string[]): void {
  const tags = event.tags ?? [];
  const combatLike =
    tags.includes('combat') ||
    event.id.includes('duel') ||
    event.id.includes('assassin') ||
    event.id.includes('bandit') ||
    event.id.includes('rival');
  if (!combatLike) return;
  state.character.stats.combats += 1;
  const won = logs.some((l) => /勝|擊敗|反殺|僅勝/.test(l));
  if (won) state.character.stats.combatsWon += 1;
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
  maybeTrackCombat(state, event, logs);

  markEventComplete(state, event.id);
  state.pending = null;
  pushChronicle(state, [`「${event.title}」——${choice.text}`, ...logs]);

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
    pushChronicle(state, ['氣血耗盡，墨盡人散。']);
    return state;
  }

  const event = pickYearEvent(catalog, state);
  if (event) {
    state.pending = { eventId: event.id, year: state.year };
  } else {
    pushChronicle(state, [yearQuietLine(state)]);
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
  pushChronicle(state, [`「${event.title}」`, ...logs]);
  if (died) {
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
  }
  snapshotRng(state);
  return { state, logs, died };
}
