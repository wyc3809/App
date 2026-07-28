import type { EventChoice, GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { gameEventSchema } from '@interfaces/lifeEngine';
import { applyEffects } from './effects';
import { meetsRequirements } from './requirements';
import { markEventComplete, snapshotRng, syncRngFromState } from './gameState';
import { buildLifeSummary } from './summary';
import { pushChronicle } from './chronicle';
import { simulateMonthBody, seasonLabel } from './monthly';
import { RANDOM_PACK_EVENTS } from './packAdapter';
import { ORDINARY_EVENTS } from '@data/events/ordinary';
import { EVENT_CATALOG } from '@data/events/catalog';
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

/** 合併：日常 + 舊 50 + 百人包 */
export function fullCatalog(): GameEvent[] {
  return [...ORDINARY_EVENTS, ...EVENT_CATALOG, ...RANDOM_PACK_EVENTS];
}

export function listEligibleEvents(catalog: GameEvent[], state: LifeGameState): GameEvent[] {
  return catalog.filter((e) => meetsRequirements(state, e.requirements, e.id));
}

function weightedPick(_state: LifeGameState, events: GameEvent[]): GameEvent | null {
  if (!events.length) return null;
  const rng = getRng();
  const total = events.reduce((s, e) => s + (e.weight ?? 10), 0);
  let roll = rng.nextFloat() * total;
  for (const e of events) {
    roll -= e.weight ?? 10;
    if (roll <= 0) return e;
  }
  return events[events.length - 1];
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
  if (!choice) return { state, logs: ['無此選擇。'], died: false };
  if (!meetsRequirements(state, choice.requirements)) {
    return { state, logs: ['條件不足。'], died: false };
  }

  const outcome = pickOutcomeForChoice(state, choice.outcomes);
  const { logs, died } = applyEffects(state, outcome.effects);

  const tags = event.tags ?? [];
  if (tags.includes('combat') || /duel|assassin|bandit|rival/.test(event.id)) {
    state.character.stats.combats += 1;
    if (logs.some((l) => /勝|擊敗|反殺|僅勝/.test(l))) state.character.stats.combatsWon += 1;
  }

  markEventComplete(state, event.id);
  state.pending = null;
  // Hide pack library titles in chronicle — use body snippet
  const titleForLog = tags.includes('pack') ? '江湖偶遇' : event.title;
  pushChronicle(state, [`「${titleForLog}」——${choice.text}`, ...logs]);

  if (died || !state.character.alive) {
    state.character.alive = false;
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
  }

  snapshotRng(state);
  return { state, logs, died };
}

function shouldTriggerSpecial(state: LifeGameState): boolean {
  if (!Number.isFinite(state.specialEventCountdown)) {
    state.specialEventCountdown = getRng().nextInt(10, 18);
  }
  state.specialEventCountdown -= 1;
  return state.specialEventCountdown <= 0;
}

export function startMonth(state: LifeGameState): LifeGameState {
  if (!state.character.alive || state.phase !== 'playing') return state;
  if (state.pending) return state;

  syncRngFromState(state);
  const rng = getRng();

  // calendar
  state.month += 1;
  if (state.month > 12) {
    state.month = 1;
    state.year += 1;
    state.character.age += 1;
    state.character.stats.yearsLived += 1;
  }
  state.character.stats.monthsLived += 1;

  simulateMonthBody(state);

  if (!state.character.alive) {
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
    pushChronicle(state, ['氣血耗盡，墨盡人散。']);
    snapshotRng(state);
    return state;
  }

  let event: GameEvent | null = null;
  let kind: 'ordinary' | 'special' | 'story' = 'ordinary';

  if (shouldTriggerSpecial(state)) {
    const packEligible = listEligibleEvents(RANDOM_PACK_EVENTS, state);
    event = weightedPick(state, packEligible);
    kind = 'special';
    state.specialEventCountdown = rng.nextInt(10, 18);
  }

  if (!event) {
    // mix ordinary + non-birth catalog events (exclude pack)
    const pool = listEligibleEvents(
      [...ORDINARY_EVENTS, ...EVENT_CATALOG.filter((e) => e.id !== 'life_birth')],
      state,
    ).filter((e) => !(e.tags ?? []).includes('pack'));
    event = weightedPick(state, pool);
    kind = 'ordinary';
  }

  if (event) {
    state.pending = {
      eventId: event.id,
      year: state.year,
      month: state.month,
      kind,
    };
  } else {
    pushChronicle(state, [
      `${state.year}年${state.month}月（${seasonLabel(state.month)}），風平浪靜。`,
    ]);
  }

  snapshotRng(state);
  return state;
}

/** @deprecated use startMonth */
export function startYear(state: LifeGameState, _catalog?: GameEvent[]): LifeGameState {
  return startMonth(state);
}

export function pickYearEvent(catalog: GameEvent[], state: LifeGameState): GameEvent | null {
  syncRngFromState(state);
  const event = weightedPick(state, listEligibleEvents(catalog, state));
  snapshotRng(state);
  return event;
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
