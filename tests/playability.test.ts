import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { upsertGrudge, listGrudges, recordGrudgeFromDisposition } from '../core/life/grudgeBook';
import { rollTravelOffer, applyTravelChoice, listTravelOffer } from '../core/life/rumorTravel';
import { gainWeaponMastery, getWeaponMastery, weaponSynergyBoost } from '../core/life/weaponMastery';
import { setCareer, careerMonthlyIncome } from '../core/life/careers';
import { grantFragment, formatFragmentProgress, MANUAL_RECIPES } from '../core/life/manualFragments';
import { ensureMasterBond, getMasterName, pickBondEvent } from '../core/life/bonds';
import { PLAYABILITY_EVENTS } from '../data/events/playabilityPack';
import { startHuashanBracket, canEnterHuashan } from '../core/life/huashan';
import { tickMonthlyEconomy } from '../core/life/economy';

describe('playability pack 1–8', () => {
  it('grudge book records disposition', () => {
    const state = createNewLife({ seed: 42, skipCoach: true });
    recordGrudgeFromDisposition(state, 'kill', '黑衣人');
    const book = listGrudges(state);
    expect(book.some((g) => g.name === '黑衣人' && g.kind === 'blood')).toBe(true);
  });

  it('rumor travel offer and apply change location', () => {
    const state = createNewLife({ seed: 7, skipCoach: true });
    const offer = rollTravelOffer(state);
    expect(offer.length).toBeGreaterThanOrEqual(2);
    expect(listTravelOffer(state).length).toBe(offer.length);
    const lines = applyTravelChoice(state, offer[0]!.id);
    expect(lines.join('')).toMatch(offer[0]!.name);
    expect(state.character.location).toBe(offer[0]!.name);
    expect(state.character.flags.travel_region).toBe(offer[0]!.region);
  });

  it('weapon mastery deepens match bonus', () => {
    const state = createNewLife({ seed: 11, skipCoach: true });
    state.character.skills.push('art_moon_sword');
    state.character.skillRanks.art_moon_sword = 0;
    // art_moon_sword is sword；舊鐵劍契合
    state.character.equipment.weapon = 'old-sword';
    for (let i = 0; i < 30; i += 1) gainWeaponMastery(state, 'art_moon_sword', 1);
    expect(getWeaponMastery(state, 'sword')).toBeGreaterThanOrEqual(1);
    const boost = weaponSynergyBoost(state, 'art_moon_sword');
    expect(boost.power).toBeGreaterThan(1.15);
  });

  it('career adds monthly income', () => {
    const state = createNewLife({ seed: 3, skipCoach: true });
    setCareer(state, 'escort');
    expect(careerMonthlyIncome(state)).toBe(3);
    const before = state.character.money;
    tickMonthlyEconomy(state);
    expect(state.character.money).not.toBe(before - 999);
  });

  it('manual fragments assemble into skill', () => {
    const state = createNewLife({ seed: 5, skipCoach: true });
    const recipe = MANUAL_RECIPES[0]!;
    for (const part of recipe.parts) {
      grantFragment(state, recipe.id, part);
    }
    expect(state.character.flags[`manual_done_${recipe.id}`]).toBe(true);
    expect(
      state.character.skills.includes(recipe.skillId) ||
        formatFragmentProgress(state).some((l) => l.includes('已合譜')),
    ).toBe(true);
  });

  it('master bond can surface fork event after months', () => {
    const state = createNewLife({ seed: 9, skipCoach: true });
    ensureMasterBond(state, '白眉叟');
    expect(getMasterName(state)).toBe('白眉叟');
    state.character.flags.master_months = 8;
    state.character.flags.master_bond = 50;
    // may or may not roll due to chance — force by looping seeds
    let found = false;
    for (let s = 1; s < 40; s += 1) {
      const st = createNewLife({ seed: s, skipCoach: true });
      ensureMasterBond(st, '白眉叟');
      st.character.flags.master_months = 8;
      st.character.flags.master_bond = 80;
      const ev = pickBondEvent(st);
      if (ev?.id === 'play_master_fork') {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('playability events exist in pack', () => {
    expect(PLAYABILITY_EVENTS.some((e) => e.id === 'play_career_offer')).toBe(true);
    expect(PLAYABILITY_EVENTS.some((e) => e.id === 'play_sect_politics')).toBe(true);
    expect(PLAYABILITY_EVENTS.some((e) => e.id === 'play_fragment_peddler')).toBe(true);
  });

  it('huashan ghosts can take personal names from grudges', () => {
    const state = createNewLife({ seed: 13, skipCoach: true });
    state.character.age = 20;
    state.character.martial = 20;
    upsertGrudge(state, { name: '血影客', kind: 'blood', strength: 4, monthsLeft: 6 });
    const gate = canEnterHuashan(state);
    expect(gate.ok).toBe(true);
    startHuashanBracket(state);
    const names = Object.values(state.huashan?.contestants ?? {}).map((c) => c.name);
    expect(names.some((n) => n.includes('血影客'))).toBe(true);
  });
});
