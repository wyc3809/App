import { describe, expect, it } from 'vitest';
import { EVENT_CATALOG, EVENT_COUNT } from '../data/events/catalog';
import { validateEvents } from '../core/life/eventEngine';
import { createNewLife } from '../core/life/gameState';
import { applyChoice, pickYearEvent, startYear } from '../core/life/eventEngine';
import { getEventById } from '../core/life/eventEngine';
import { meetsRequirements } from '../core/life/requirements';
import { initRng } from '../core/random';

describe('life event catalog', () => {
  it('has 50 validated events', () => {
    expect(EVENT_COUNT).toBeGreaterThanOrEqual(50);
    const events = validateEvents(EVENT_CATALOG);
    expect(events.length).toBe(EVENT_COUNT);
  });
});

describe('life event engine', () => {
  it('resolves birth choice deterministically', () => {
    initRng(42);
    const state = createNewLife(42);
    const birth = getEventById(EVENT_CATALOG, 'life_birth')!;
    const next = structuredClone(state);
    const result = applyChoice(next, birth, 'cry');
    expect(result.state.completedEvents).toContain('life_birth');
    expect(result.state.character.attributes.genGu).toBeGreaterThan(30);
  });

  it('advances year and assigns pending event', () => {
    initRng(99);
    let state = createNewLife(99);
    const birth = getEventById(EVENT_CATALOG, 'life_birth')!;
    state = applyChoice(structuredClone(state), birth, 'quiet').state;
    state = startYear(structuredClone(state), EVENT_CATALOG);
    expect(state.character.age).toBe(1);
    expect(state.pending).not.toBeNull();
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
