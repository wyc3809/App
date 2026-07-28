import { describe, expect, it } from 'vitest';
import { EVENT_CATALOG, EVENT_COUNT } from '../data/events/catalog';
import {
  validateEvents,
  applyChoice,
  pickYearEvent,
  startMonth,
  getEventById,
  fullCatalog,
} from '../core/life/eventEngine';
import { createNewLife } from '../core/life/gameState';
import { meetsRequirements } from '../core/life/requirements';
import { getLifeStage } from '../core/life/stages';
import { RANDOM_PACK_EVENTS } from '../core/life/packAdapter';
import { initRng } from '../core/random';

describe('life event catalog', () => {
  it('has 50 validated built-in events', () => {
    expect(EVENT_COUNT).toBeGreaterThanOrEqual(50);
    const events = validateEvents(EVENT_CATALOG);
    expect(events.length).toBe(EVENT_COUNT);
  });

  it('loads 100 pack events', () => {
    expect(RANDOM_PACK_EVENTS.length).toBe(100);
    expect(fullCatalog().length).toBeGreaterThan(150);
  });
});

describe('life stages', () => {
  it('maps ages to stages', () => {
    expect(getLifeStage(0)).toBe('infant');
    expect(getLifeStage(16)).toBe('youth');
    expect(getLifeStage(72)).toBe('twilight');
  });
});

describe('life event engine', () => {
  it('creates life in 千燈鎮 at age 16', () => {
    const state = createNewLife({ seed: 42, name: '沈雲舟', birthplace: '千燈鎮' });
    expect(state.character.name).toBe('沈雲舟');
    expect(state.character.age).toBe(16);
    expect(state.character.birthplace).toBe('千燈鎮');
    expect(state.month).toBe(1);
    expect(state.specialEventCountdown).toBeGreaterThanOrEqual(5);
    expect(state.specialEventCountdown).toBeLessThanOrEqual(30);
    expect(state.character.maxHealth).toBeGreaterThan(100);
    expect(state.character.maxQi).toBeGreaterThan(100);
  });

  it('ordinary events offer three choices with risk branches', () => {
    const market = getEventById(fullCatalog(), 'ord_market')!;
    expect(market.choices.length).toBe(3);
    expect(market.choices.every((c) => c.outcomes.length >= 2)).toBe(true);
  });

  it('practice can raise max hp and qi', async () => {
    const { performPracticeAction } = await import('../core/life/actions');
    initRng(3);
    const state = createNewLife(3);
    const beforeHp = state.character.maxHealth;
    const beforeQi = state.character.maxQi;
    performPracticeAction(state, 'temper_body');
    performPracticeAction(state, 'train_internal');
    expect(state.character.maxHealth).toBeGreaterThan(beforeHp);
    expect(state.character.maxQi).toBeGreaterThan(beforeQi);
  });

  it('advances month and may assign pending event', () => {
    initRng(99);
    let state = createNewLife(99);
    state = startMonth(structuredClone(state));
    expect(state.character.stats.monthsLived).toBe(1);
    expect(state.month).toBe(2);
  });

  it('resolves ordinary choice', () => {
    initRng(42);
    const state = createNewLife(42);
    const market = getEventById(fullCatalog(), 'ord_market')!;
    state.pending = { eventId: market.id, year: state.year, month: state.month, kind: 'ordinary' };
    const result = applyChoice(structuredClone(state), market, 'watch');
    expect(result.state.completedEvents).toContain('ord_market');
  });

  it('pickYearEvent is deterministic', () => {
    initRng(7);
    const s1 = createNewLife(7);
    const s2 = createNewLife(7);
    s1.character.age = 16;
    s2.character.age = 16;
    const e1 = pickYearEvent(EVENT_CATALOG, s1);
    const e2 = pickYearEvent(EVENT_CATALOG, s2);
    expect(e1?.id).toBe(e2?.id);
  });

  it('requirements gate sect events', () => {
    const state = createNewLife(1);
    const sectEv = EVENT_CATALOG.find((e) => e.id === 'sect_training')!;
    expect(meetsRequirements(state, sectEv.requirements, sectEv.id)).toBe(false);
    state.character.sectId = 'sect_qingyun';
    state.character.age = 18;
    expect(meetsRequirements(state, sectEv.requirements, sectEv.id)).toBe(true);
  });
});
