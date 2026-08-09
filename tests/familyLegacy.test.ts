import { describe, expect, it } from 'vitest';
import { createNewLife, syncRngFromState } from '../core/life/gameState';
import { initRng } from '../core/random';
import {
  canHaveChild,
  designateHeir,
  getHeirName,
  previewInheritanceMoney,
  seekChild,
} from '../core/life/family';
import { applyLegacyToCharacter, extractLegacy } from '../core/life/legacy';
import { buildLifeSummary } from '../core/life/summary';
import { recordDeath } from '../core/life/death';

function withLover(seed: number) {
  initRng(seed);
  const state = createNewLife({ seed, skipCoach: true });
  syncRngFromState(state);
  state.character.age = 24;
  state.character.money = 80;
  state.character.loverId = 'lover_candidate';
  state.npcs.lover_candidate = {
    id: 'lover_candidate',
    name: '阿絮',
    gender: 'female',
    role: 'lover',
    affinity: 80,
    memories: [],
    alive: true,
  };
  state.character.monthsSinceLastBirth = 99;
  return state;
}

describe('childbirth and inheritance', () => {
  it('seek_child can birth with lover and sets heir + family_legacy', () => {
    let born = false;
    for (let s = 1; s <= 40; s += 1) {
      const state = withLover(s);
      expect(canHaveChild(state).ok).toBe(true);
      const lines = seekChild(state);
      if (state.character.childrenCount > 0) {
        born = true;
        expect(lines.join('')).toMatch(/求子|添丁|子|女/);
        expect(getHeirName(state)).toBeTruthy();
        expect(state.character.flags.family_legacy).toBe(true);
        break;
      }
    }
    expect(born).toBe(true);
  });

  it('designateHeir rotates successor', () => {
    const state = withLover(2);
    state.character.childrenCount = 2;
    state.character.family.childrenNames = ['甲童', '乙童'];
    state.character.flags.heir_name = '甲童';
    designateHeir(state, '乙童');
    expect(getHeirName(state)).toBe('乙童');
  });

  it('death with children carries estate into next life', () => {
    const prev = withLover(8);
    prev.character.childrenCount = 1;
    prev.character.family.childrenNames = ['小江湖'];
    prev.character.flags.heir_name = '小江湖';
    prev.character.flags.family_legacy = true;
    prev.character.money = 100;
    prev.character.stats.wealthPeak = 200;
    recordDeath(prev, '病榻燈殘。');
    prev.phase = 'summary';
    prev.summaryText = buildLifeSummary(prev);
    expect(prev.summaryText).toMatch(/繼承人|小江湖/);
    expect(prev.summaryText).toMatch(/來世可繼族產/);

    const legacy = extractLegacy(prev);
    expect(legacy.hadChildren).toBe(true);
    expect(legacy.heirName).toBe('小江湖');
    expect(legacy.familyLegacy).toBe(true);
    expect(legacy.inheritedMoney).toBe(previewInheritanceMoney(prev));
    expect(legacy.inheritedMoney).toBeGreaterThan(0);

    const next = createNewLife({ seed: 99, skipCoach: true, legacy });
    expect(next.character.flags.born_with_family_legacy).toBe(true);
    expect(next.character.money).toBeGreaterThan(60);
    expect(next.lifeLog.some((l) => /血脈|族產|小江湖/.test(l))).toBe(true);
    applyLegacyToCharacter(createNewLife({ seed: 100, skipCoach: true }), legacy);
  });
});
