import { describe, expect, it } from 'vitest';
import { EVENT_CATALOG, EVENT_COUNT } from '../data/events/catalog';
import {
  validateEvents,
  applyChoice,
  pickYearEvent,
  startMonth,
  getEventById,
  fullCatalog,
  listEligibleEvents,
} from '../core/life/eventEngine';
import { JIANGHU_EXTRA_EVENTS } from '../data/events/jianghuExtra100';
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
    expect(fullCatalog().length).toBeGreaterThan(250);
  });

  it('includes 100 jianghu extra events', () => {
    expect(JIANGHU_EXTRA_EVENTS.length).toBe(100);
    expect(JIANGHU_EXTRA_EVENTS.every((e) => e.choices.length === 3)).toBe(true);
    expect(fullCatalog().some((e) => e.id === 'jx_black_inn')).toBe(true);
  });

  it('avoids repeating the same event within 50 months', () => {
    const state = createNewLife({ seed: 99, name: '測試', birthplace: '千燈鎮' });
    state.character.age = 18;
    state.character.stats.monthsLived = 10;
    state.recentEvents = [{ id: 'jx_black_inn', at: 8 }];
    const pool = listEligibleEvents(JIANGHU_EXTRA_EVENTS, state);
    expect(pool.some((e) => e.id === 'jx_black_inn')).toBe(false);

    state.character.stats.monthsLived = 60;
    const later = listEligibleEvents(JIANGHU_EXTRA_EVENTS, state);
    expect(later.some((e) => e.id === 'jx_black_inn')).toBe(true);
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
    expect(state.specialEventCountdown).toBeGreaterThanOrEqual(3);
    expect(state.specialEventCountdown).toBeLessThanOrEqual(15);
    expect(state.character.maxHealth).toBeGreaterThan(100);
    expect(state.character.maxQi).toBeGreaterThan(100);
  });

  it('ordinary events offer three choices with fair/mixed/ill branches', () => {
    const market = getEventById(fullCatalog(), 'ord_market')!;
    expect(market.choices.length).toBe(3);
    expect(market.choices.every((c) => c.outcomes.length >= 3)).toBe(true);
    expect(market.choices.every((c) => c.outcomes.some((o) => o.label === '順遂'))).toBe(true);
    expect(market.choices.every((c) => c.outcomes.some((o) => o.label === '波折'))).toBe(true);
    expect(market.choices.every((c) => c.outcomes.some((o) => o.label === '事與願違'))).toBe(true);
  });

  it('road encounters exist and combat countdown starts in 7–15', () => {
    const state = createNewLife({ seed: 7, name: '試劍', birthplace: '千燈鎮' });
    expect(state.combatEncounterCountdown).toBeGreaterThanOrEqual(7);
    expect(state.combatEncounterCountdown).toBeLessThanOrEqual(15);
    expect(fullCatalog().some((e) => e.id === 'road_bandit_pass')).toBe(true);
  });

  it('choice outcomes vary across rolls (anti-memorization)', () => {
    const market = getEventById(fullCatalog(), 'ord_market')!;
    const signatures = new Set<string>();
    for (let i = 0; i < 48; i += 1) {
      const s = createNewLife({ seed: 2000 + i, name: '雲舟', birthplace: '千燈鎮' });
      const before = { money: s.character.money, health: s.character.health, rep: s.character.reputation };
      applyChoice(s, market, market.choices[0].id);
      signatures.add(
        `${s.character.money - before.money}|${s.character.health - before.health}|${s.character.reputation - before.rep}`,
      );
    }
    expect(signatures.size).toBeGreaterThan(2);
  });

  it('combat moves get role tags without capping count', async () => {
    const { combatMoveRole, formatCombatMoveCompact, BASIC_STRIKE, listExternalMovesForSkills } =
      await import('../data/skills/catalog');
    expect(combatMoveRole(BASIC_STRIKE)).toBe('普');
    const stone = listExternalMovesForSkills(['art_stone_palm']).find((m) => m.id === 'mv_stone_palm')!;
    expect(combatMoveRole(stone)).toBe('破');
    expect(formatCombatMoveCompact(stone)).toMatch(/破/);
    const many = listExternalMovesForSkills([
      'art_river_fist',
      'art_stone_palm',
      'art_rain_sword',
      'art_moon_sword',
      'art_thunder_blade',
      'art_shadow_needle',
    ]);
    expect(many.filter((m) => !m.id.startsWith('sys_') && m.id !== 'basic_strike').length).toBeGreaterThan(4);
  });

  it('practice page actions are rumors/heal/equip; wander arts appear on month flip', async () => {
    const { PRACTICE_ACTIONS, performPracticeAction } = await import('../core/life/actions');
    const { PRACTICE_WANDER_EVENTS } = await import('../data/events/practiceWander');
    expect(PRACTICE_ACTIONS.map((a) => a.id)).toEqual(['inquire_rumors', 'heal', 'equip_best']);
    expect(PRACTICE_WANDER_EVENTS.some((e) => e.id === 'wander_seek_master')).toBe(true);
    expect(fullCatalog().some((e) => e.id === 'wander_train_martial')).toBe(true);

    initRng(12);
    const state = createNewLife(12);
    state.character.money = 20;
    const logs = performPracticeAction(state, 'inquire_rumors');
    expect(Number(state.character.flags.rumor_boost)).toBe(1);
    expect(logs.some((l) => /打聽|傳聞/.test(l))).toBe(true);
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

  it('external art advances after enough combat uses and gains power', async () => {
    const { tryAdvanceSkill } = await import('../core/life/flavor');
    const { rankPowerMult, ADVANCE_COMBAT_BANDS } = await import('../core/life/martialRanks');
    initRng(9);
    const state = createNewLife(9);
    const sid = 'art_river_fist';
    state.character.skillAdvanceNeed[sid] = 12;
    state.character.skillProgress[sid] = 0;
    let advanced = false;
    for (let i = 0; i < 40; i++) {
      const msg = tryAdvanceSkill(state, sid, 'combat');
      if (msg) {
        advanced = true;
        break;
      }
    }
    expect(advanced).toBe(true);
    expect(state.character.skillRanks[sid]).toBe(1);
    expect(rankPowerMult(1)).toBe(1.25);
    expect(ADVANCE_COMBAT_BANDS[0].min).toBe(10);
    expect(ADVANCE_COMBAT_BANDS[1].min).toBe(50);
    // second rank needs much more
    state.character.skillAdvanceNeed[sid] = 55;
    state.character.skillProgress[sid] = 0;
    let second = false;
    for (let i = 0; i < 20; i++) {
      if (tryAdvanceSkill(state, sid, 'combat')) second = true;
    }
    expect(second).toBe(false);
    expect(state.character.skillRanks[sid]).toBe(1);
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

  it('weapon-matched skill gets combat boost label path', async () => {
    const { startCombat, playerCombatTurn } = await import('../core/life/combat');
    const { learnMartialArt } = await import('../core/life/flavor');
    initRng(2);
    const state = createNewLife(2);
    learnMartialArt(state, 'art_moon_sword', '弄月劍法');
    state.character.equipment.weapon = 'old-sword'; // sword
    startCombat(state, { source: 'spar', title: '試', foeName: '木人', foePower: 'weak' });
    const logs = playerCombatTurn(state, 'mv_moon_sword');
    expect(logs.some((l) => /兵刃相契|弄月/.test(l))).toBe(true);
  });

  it('qinggong passives increase combat evasion', async () => {
    const { startCombat } = await import('../core/life/combat');
    const { learnMartialArt } = await import('../core/life/flavor');
    initRng(11);
    const state = createNewLife(11);
    learnMartialArt(state, 'qg_snow_track', '踏雪無痕');
    startCombat(state, { source: 'spar', title: '試', foeName: '木人', foePower: 'weak' });
    expect(state.pendingCombat!.player.evasion).toBeGreaterThan(0.05);
  });

  it('boss win grants configured skill and gear', async () => {
    const { startCombat, playerCombatTurn } = await import('../core/life/combat');
    const { getBossFightConfig } = await import('../data/events/bossEncounters');
    initRng(3);
    const state = createNewLife(3);
    state.character.martial = 80;
    state.character.maxHealth = 500;
    state.character.health = 500;
    const cfg = getBossFightConfig('boss_scarlet_viper')!;
    startCombat(state, {
      source: 'event',
      title: '首領·赤練娘',
      foeName: cfg.foeName,
      foePower: cfg.foePower,
      rewardOnWin: cfg.rewardOnWin,
      eventId: 'boss_scarlet_viper',
    });
    const combat = state.pendingCombat!;
    combat.foe.hp = 1;
    combat.player.qi = 200;
    while (state.pendingCombat && state.pendingCombat.phase !== 'ended') {
      if (state.pendingCombat.phase === 'resolve') {
        const { resolveCombatDisposition } = await import('../core/life/combat');
        resolveCombatDisposition(state, 'kill');
        break;
      }
      playerCombatTurn(state, 'basic_strike');
      if (state.pendingCombat && state.pendingCombat.turn > 40) break;
    }
    expect(state.character.skills).toContain('art_shadow_needle');
    expect(state.character.gear).toContain('sleeve-darts');
  });

  it('victory prompts foe disposition except spar', async () => {
    const { startCombat, playerCombatTurn, resolveCombatDisposition } = await import(
      '../core/life/combat'
    );
    initRng(9);
    const state = createNewLife(9);
    state.character.martial = 60;
    startCombat(state, {
      source: 'event',
      title: '路遇',
      foeName: '剪徑之徒',
      foePower: 'weak',
    });
    state.pendingCombat!.foe.hp = 0;
    playerCombatTurn(state, 'basic_strike');
    expect(state.pendingCombat?.phase).toBe('resolve');
    const beforeEvil = state.character.nature!.e;
    resolveCombatDisposition(state, 'release');
    expect(state.pendingCombat).toBeNull();
    expect(state.character.nature!.xia).toBeGreaterThan(12);
    expect(state.character.nature!.e).toBeLessThanOrEqual(beforeEvil);
  });

  it('external move qi costs are meaningful and qi persists after combat', async () => {
    const { startCombat, playerCombatTurn, resolveCombatDisposition } = await import('../core/life/combat');
    const { getSkillDef, listExternalMovesForSkills } = await import('../data/skills/catalog');
    const river = getSkillDef('art_river_fist')!.move!;
    expect(river.qiCost).toBeGreaterThanOrEqual(30);

    const moves = listExternalMovesForSkills(['art_river_fist']);
    expect(moves.some((m) => m.id === 'sys_guard')).toBe(true);
    expect(moves.find((m) => m.id === 'mv_river_fist')!.qiCost).toBeGreaterThanOrEqual(30);

    initRng(6);
    const state = createNewLife(6);
    state.character.martial = 60;
    state.character.maxQi = 200;
    state.character.qi = 200;
    state.character.maxHealth = 400;
    state.character.health = 400;
    startCombat(state, {
      source: 'event',
      title: '試耗',
      foeName: '剪徑',
      foePower: 'weak',
      rewardOnWin: { martial: 1 },
    });
    expect(state.pendingCombat!.player.qiRegen).toBe(0);
    state.pendingCombat!.foe.hp = 500;
    state.pendingCombat!.foe.maxHp = 500;
    const before = state.pendingCombat!.player.qi;
    playerCombatTurn(state, 'mv_river_fist');
    expect(state.pendingCombat).toBeTruthy();
    expect(state.pendingCombat!.player.qi).toBeLessThanOrEqual(before - river.qiCost);
    state.pendingCombat!.foe.hp = 0;
    playerCombatTurn(state, 'basic_strike');
    expect(state.pendingCombat?.phase).toBe('resolve');
    const midQi = state.pendingCombat!.player.qi;
    resolveCombatDisposition(state, 'stun');
    expect(state.pendingCombat).toBeNull();
    expect(state.character.qi).toBe(midQi);
    expect(state.character.qi).toBeLessThan(state.character.maxQi);
  });

  it('huashan bracket runs elimination with ghost opponents', async () => {
    const { startHuashanBracket, runPlayerHuashanDuel, canEnterHuashan } = await import(
      '../core/life/huashan'
    );
    const { simulateContestDuel } = await import('../core/life/duelSim');
    initRng(77);
    const state = createNewLife(77);
    state.character.martial = 25;
    state.character.age = 20;
    expect(canEnterHuashan(state).ok).toBe(true);
    const startLines = startHuashanBracket(state);
    expect(startLines[0]).toMatch(/華山論劍/);
    expect(state.huashan?.status).toBe('active');
    expect(state.huashan?.matches.length).toBe(7);
    let safety = 0;
    while (state.huashan?.status === 'active' && state.huashan.pendingMatchId && safety < 6) {
      runPlayerHuashanDuel(state);
      safety += 1;
    }
    expect(state.huashan?.status).toBe('completed');
    expect(state.huashan?.placement).toBeGreaterThanOrEqual(1);
    expect(state.character.flags.huashan_last_season).toBeTruthy();
    expect(canEnterHuashan(state).ok).toBe(false);

    const a = state.huashan!.contestants.player!;
    const b = state.huashan!.contestants.ghost_0!;
    const r1 = simulateContestDuel({ title: '測試', a, b, seed: 99, aIsPlayer: true });
    const r2 = simulateContestDuel({ title: '測試', a, b, seed: 99, aIsPlayer: true });
    expect(r1.winnerId).toBe(r2.winnerId);
    expect(r1.log.join('')).not.toMatch(/art_|skill_/);
  });

  it('life summary lists martial arts in Chinese, not internal ids', async () => {
    const { buildLifeSummary } = await import('../core/life/summary');
    initRng(5);
    const state = createNewLife(5);
    state.character.skills.push('skill_breath');
    state.character.skillRanks['skill_breath'] = 0;
    const text = buildLifeSummary(state);
    expect(text).toContain('【武功】');
    expect(text).toContain('長河拳');
    expect(text).toContain('基礎吐納');
    expect(text).not.toMatch(/art_river_fist|skill_breath|skill_[a-z]/);
  });

  it('displayChoiceText hides placeholder English', async () => {
    const { displayChoiceText, sanitizePlayerLine } = await import('../core/life/playerText');
    expect(displayChoiceText('None', 'accept')).toBe('應允');
    expect(displayChoiceText('拱手請教', 'accept')).toBe('拱手請教');
    expect(sanitizePlayerLine('習得 skill_foo 與 None')).toMatch(/習得/);
    expect(sanitizePlayerLine('習得 skill_foo 與 None')).not.toMatch(/skill_foo|None/i);
    expect(sanitizePlayerLine('閱歷加深（courage）[object Object]')).not.toMatch(/courage|object Object/i);
    expect(sanitizePlayerLine('閱歷加深（courage）')).toMatch(/膽識|閱歷/);
  });

  it('pack outcomes never leak English paths or [object Object]', async () => {
    const { getPackChoice } = await import('../core/life/jianghuEventRepository');
    const { resolvePackOutcomes } = await import('../core/life/outcomeResolver');
    initRng(42);
    const state = createNewLife({ seed: 42, name: '沈雲舟', birthplace: '千燈鎮' });
    const choice = getPackChoice('event_004', 'choice_1')!;
    const resolved = resolvePackOutcomes(state, choice);
    const blob = `${resolved.feedback}\n${resolved.logs.join('\n')}\n${resolved.deltas.join('\n')}`;
    expect(blob).not.toMatch(/courage|perception|charisma|\[object Object\]|acted_with|player\.|attributes\./i);
    expect(resolved.deltas.some((d) => /膽識|名望|疲勞/.test(d))).toBe(true);
  });

  it('boss phase 2 heals and hardens once', async () => {
    const { startCombat, playerCombatTurn } = await import('../core/life/combat');
    initRng(4);
    const state = createNewLife(4);
    state.character.martial = 80;
    state.character.maxHealth = 500;
    state.character.health = 500;
    startCombat(state, {
      source: 'event',
      title: '首領試',
      foeName: '沙蠍客',
      foePower: 'boss',
      rewardOnWin: { martial: 1 },
    });
    const combat = state.pendingCombat!;
    combat.foe.hp = Math.floor(combat.foe.maxHp * 0.4);
    const before = combat.foe.hp;
    const logs = playerCombatTurn(state, 'basic_strike');
    expect(state.pendingCombat?.bossPhase2).toBe(true);
    expect(logs.some((l) => /氣息陡變|強行續命/.test(l))).toBe(true);
    expect(state.pendingCombat!.foe.hp).toBeGreaterThan(before - 5);
  });

  it('sand and mirror bosses are wired with rewards', async () => {
    const { getBossFightConfig, BOSS_ENCOUNTER_EVENTS } = await import('../data/events/bossEncounters');
    expect(getBossFightConfig('boss_sand_scorpion')?.rewardOnWin.skillId).toBe('art_sand_palm');
    expect(getBossFightConfig('boss_mirror_lake')?.rewardOnWin.skillName).toBe('澄心鏡息');
    expect(BOSS_ENCOUNTER_EVENTS.some((e) => e.id === 'rumor_sand')).toBe(true);
    expect(BOSS_ENCOUNTER_EVENTS.some((e) => e.id === 'boss_mirror_lake')).toBe(true);
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

  it('content packs: each sect has four arts with combat-useful effects', async () => {
    const { SECT_CONTENT, FAMILY_RULES, STORY_CHAPTERS } = await import('../data/content/packs');
    const { getSkillDef } = await import('../data/skills/catalog');
    expect(SECT_CONTENT).toHaveLength(5);
    expect(STORY_CHAPTERS.length).toBeGreaterThanOrEqual(4);
    expect(FAMILY_RULES.lifetimeChildrenMax).toBe(5);
    expect(FAMILY_RULES.lifetimeChildrenMin).toBe(1);
    expect(FAMILY_RULES.monthlyBirthChance).toBeLessThan(0.05);
    for (const sect of SECT_CONTENT) {
      expect(sect.arts).toHaveLength(4);
      const standings = sect.arts.map((a) => a.standing).sort();
      expect(standings).toEqual([0, 1, 2, 3]);
      for (const art of sect.arts) {
        const def = getSkillDef(art.skillId);
        expect(def, art.skillId).toBeTruthy();
        expect(def!.flavor).toBeTruthy();
        if (def!.kind === 'external') {
          const m = def!.move!;
          const hasFx =
            (m.pierce ?? 0) > 0 ||
            (m.multiHit ?? 1) > 1 ||
            (m.qiDrain ?? 0) > 0 ||
            (m.bleedChance ?? 0) > 0 ||
            (m.stunChance ?? 0) > 0 ||
            (m.lifesteal ?? 0) > 0 ||
            (m.healSelf ?? 0) > 0 ||
            (m.applyBlind ?? 0) > 0 ||
            (m.defenseBreak ?? 0) > 0 ||
            (m.hitBonus ?? 0) > 0 ||
            m.power >= 1.3;
          expect(hasFx, art.skillId).toBe(true);
        } else {
          expect(def!.passive).toBeTruthy();
        }
      }
    }
  });

  it('joining sect teaches standing-0 art and standing can unlock more', async () => {
    const { performPracticeAction } = await import('../core/life/actions');
    const { tryGainSectStanding } = await import('../core/life/sectStanding');
    const { artForStanding } = await import('../data/content/packs');
    initRng(8);
    const state = createNewLife(8);
    state.character.martial = 50;
    state.character.skillRanks['基礎吐納'] = 2;
    state.character.nature = { xia: 30, xie: 5, kuang: 10, e: 5 };
    // force join success by retrying
    let joined = false;
    for (let i = 0; i < 30 && !joined; i++) {
      state.practiceActionsLeft = 3;
      state.character.sectId = null;
      performPracticeAction(state, 'join_sect', { sectId: 'sect_qingyun' });
      joined = !!state.character.sectId;
    }
    expect(joined).toBe(true);
    const art0 = artForStanding('sect_qingyun', 0)!;
    expect(state.character.skills).toContain(art0);
    expect(state.character.sectStanding).toBe(0);
    // force standing ups
    for (let i = 0; i < 20 && (state.character.sectStanding ?? 0) < 3; i++) {
      tryGainSectStanding(state, 1);
    }
    expect(state.character.sectStanding).toBe(3);
    expect(state.character.skills).toContain(artForStanding('sect_qingyun', 3)!);
  });

  it('birth chance is low and capped by childrenMax 1–5', async () => {
    const { tryMonthlyBirth, ensureFamilyFields } = await import('../core/life/family');
    initRng(100);
    const state = createNewLife(100);
    ensureFamilyFields(state.character);
    expect(state.character.childrenMax).toBeGreaterThanOrEqual(1);
    expect(state.character.childrenMax).toBeLessThanOrEqual(5);
    state.character.age = 25;
    state.character.loverId = 'lover_candidate';
    state.npcs.lover_candidate = {
      id: 'lover_candidate',
      name: '紅袖',
      gender: 'female',
      role: 'lover',
      affinity: 80,
      memories: [],
      alive: true,
    };
    state.character.childrenMax = 2;
    state.character.monthsSinceLastBirth = 99;
    let births = 0;
    for (let i = 0; i < 500; i++) {
      state.character.monthsSinceLastBirth = 99;
      const lines = tryMonthlyBirth(state);
      if (lines.length) births += 1;
    }
    expect(state.character.childrenCount).toBeLessThanOrEqual(2);
    expect(births).toBeLessThanOrEqual(2);
    expect(births).toBeGreaterThanOrEqual(0);
  });

  it('nature delta chips use 狂++ style', async () => {
    const { formatNatureDeltaMark, applyNatureDelta } = await import('../core/life/nature');
    expect(formatNatureDeltaMark('kuang', 2)).toBe('狂++');
    expect(formatNatureDeltaMark('xia', -2)).toBe('俠--');
    expect(formatNatureDeltaMark('e', 1)).toBe('惡+');
    const state = createNewLife(3);
    const lines = applyNatureDelta(state.character, { kuang: 2, xia: -1 });
    expect(lines).toEqual(['俠-', '狂++']);
  });

  it('nature 俠邪狂惡 shifts with choices and gates sects/encounters', async () => {
    const { applyChoice } = await import('../core/life/eventEngine');
    const { inferNatureFromChoice, meetsNatureGate } = await import('../core/life/nature');
    const { getSectContent } = await import('../data/content/packs');
    expect(inferNatureFromChoice('上前調停').xia).toBeGreaterThan(0);
    expect(inferNatureFromChoice('拔刀硬闖').kuang).toBeGreaterThan(0);

    initRng(42);
    const state = createNewLife(42);
    expect(state.character.nature.xia).toBeGreaterThan(0);
    const market = getEventById(fullCatalog(), 'ord_alley')!;
    const before = state.character.nature.xia;
    const result = applyChoice(structuredClone(state), market, 'mediate');
    expect(result.state.character.nature.xia).toBeGreaterThan(before);

    const shaolin = getSectContent('sect_shaolin')!;
    const evil = createNewLife(7);
    evil.character.nature = { xia: 5, xie: 20, kuang: 10, e: 80 };
    expect(meetsNatureGate(evil.character, shaolin.natureGate)).toBe(false);

    const temple = getEventById(fullCatalog(), 'secret_temple_bell')!;
    expect(meetsRequirements(evil, temple.requirements, temple.id)).toBe(false);
    evil.character.age = 18;
    evil.character.nature = { xia: 30, xie: 5, kuang: 8, e: 5 };
    expect(meetsRequirements(evil, temple.requirements, temple.id)).toBe(true);
  });

  it('event outcomes include narrative story beyond numbers', () => {
    const market = getEventById(fullCatalog(), 'ord_market')!;
    const buy = market.choices.find((c) => c.id === 'buy')!;
    const narr = buy.outcomes[0].effects.find((e) => e.type === 'narrate');
    expect(narr && narr.type === 'narrate' && narr.text.length).toBeGreaterThan(40);

    initRng(42);
    const state = createNewLife(42);
    const result = applyChoice(structuredClone(state), market, 'buy');
    expect(result.feedback.length).toBeGreaterThan(40);
    expect(result.feedback).not.toMatch(/^銀兩/);
  });

  it('pack choices have unique result stories', async () => {
    const { getPackLibrary } = await import('../core/life/jianghuEventRepository');
    const lib = getPackLibrary();
    const texts = new Set<string>();
    for (const e of lib.events) {
      for (const c of e.choices ?? []) {
        const rt = c.result_text;
        const s = typeof rt === 'string' ? rt : rt?.success ?? '';
        expect(s.length).toBeGreaterThan(40);
        expect(s).not.toBe('你的選擇改變了事情的走向。');
        texts.add(s);
      }
    }
    expect(texts.size).toBeGreaterThan(200);
  });
});
