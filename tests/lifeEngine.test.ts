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

  it('preserves original pack choice texts (3 each)', () => {
    const first = RANDOM_PACK_EVENTS.find((e) => e.id === 'event_001')!;
    expect(first.choices.map((c) => c.text)).toEqual(['暗中相助', '公開交涉', '向有權勢者報信']);
    expect(RANDOM_PACK_EVENTS.every((e) => e.choices.length === 3)).toBe(true);
  });
});

describe('jianghu pack repository + outcome resolver', () => {
  it('filters by conditions and marks completion flags', async () => {
    const { filterPackByConditions, pickWeightedPackEvent, packCompletionFlag } = await import(
      '../core/life/jianghuEventRepository'
    );
    initRng(11);
    const state = createNewLife(11);
    const eligible = filterPackByConditions(state);
    expect(eligible.length).toBe(100);
    const picked = pickWeightedPackEvent(state, eligible)!;
    expect(picked.id).toMatch(/^event_\d{3}$/);

    const event = getEventById(fullCatalog(), picked.id)!;
    const choiceId = event.choices[0].id;
    const result = applyChoice(structuredClone(state), event, choiceId);
    expect(result.state.completedEvents).toContain(picked.id);
    expect(result.state.character.flags[packCompletionFlag(picked.id)]).toBe(true);
    expect(result.feedback.length).toBeGreaterThan(0);

    const after = filterPackByConditions(result.state);
    expect(after.some((e) => e.id === picked.id)).toBe(false);
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
    expect(state.practiceActionsLeft).toBe(1);
  });

  it('martial arts use ranks and may advance without XP numbers', async () => {
    const { performPracticeAction } = await import('../core/life/actions');
    const { MARTIAL_RANKS } = await import('../core/life/martialRanks');
    const { skillDisplay } = await import('../core/life/flavor');
    initRng(21);
    const state = createNewLife(21);
    expect(state.character.skillRanks['基礎吐納']).toBe(0);
    expect(skillDisplay(state.character, '基礎吐納')).toContain(MARTIAL_RANKS[0]);
    expect(skillDisplay(state.character, '基礎吐納')).toContain('內功');
    expect(skillDisplay(state.character, 'art_river_fist')).toContain('外功');
    for (let i = 0; i < 40; i++) {
      state.practiceActionsLeft = 3;
      performPracticeAction(state, 'train_martial');
    }
    const ranks = Object.values(state.character.skillRanks);
    expect(ranks.every((r) => r >= 0 && r <= 3)).toBe(true);
  });

  it('limits practice to three actions per month', async () => {
    const { performPracticeAction } = await import('../core/life/actions');
    initRng(2);
    const state = createNewLife(2);
    expect(state.practiceActionsLeft).toBe(3);
    performPracticeAction(state, 'train_martial');
    performPracticeAction(state, 'train_martial');
    performPracticeAction(state, 'train_martial');
    expect(state.practiceActionsLeft).toBe(0);
    const blocked = performPracticeAction(state, 'train_martial');
    expect(blocked[0]).toMatch(/本月修煉/);
  });

  it('sect submenu can attempt joining a chosen sect', async () => {
    const { performPracticeAction } = await import('../core/life/actions');
    initRng(8);
    const state = createNewLife(8);
    state.character.martial = 40;
    state.character.skillRanks['基礎吐納'] = 2;
    const logs = performPracticeAction(state, 'join_sect', { sectId: 'sect_wudang' });
    expect(logs.some((l) => /武當|機緣未到|根基尚淺/.test(l))).toBe(true);
  });

  it('turn-based combat uses external moves and internal passives', async () => {
    const { startCombat, playerCombatTurn, getPlayerMoves } = await import('../core/life/combat');
    initRng(5);
    const state = createNewLife(5);
    startCombat(state, {
      source: 'spar',
      title: '試招',
      foeName: '木人',
      foePower: 'weak',
      rewardOnWin: { martial: 1 },
    });
    expect(state.pendingCombat?.phase).toBe('player');
    const moves = getPlayerMoves(state);
    expect(moves.some((m) => m.id === 'basic_strike')).toBe(true);
    expect(moves.some((m) => m.name === '長河崩拳')).toBe(true);
    expect(moves.every((m) => m.id !== '基礎吐納')).toBe(true);
    expect(state.pendingCombat!.player.attack).toBeGreaterThan(0);
    playerCombatTurn(state, 'basic_strike');
    expect(!state.pendingCombat || state.pendingCombat.phase === 'player').toBe(true);
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
