import { describe, expect, it } from 'vitest';
import { createNewLife } from '../core/life/gameState';
import { buildGenealogy, formatGenealogyText, sealGenealogyForLegacy } from '../core/life/genealogy';
import { extractLegacy, applyLegacyToCharacter } from '../core/life/legacy';
import { recordDeath } from '../core/life/death';

describe('genealogy 族譜', () => {
  it('lists parents self and children with heir mark', () => {
    const state = createNewLife({ seed: 21, skipCoach: true });
    state.character.family.childrenNames = ['青禾', '墨白'];
    state.character.childrenCount = 2;
    state.character.flags.heir_name = '青禾';
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

    const book = buildGenealogy(state);
    expect(book.entries.some((e) => e.title === '父')).toBe(true);
    expect(book.entries.some((e) => e.title === '母')).toBe(true);
    expect(book.entries.some((e) => e.self && e.name === state.character.name)).toBe(true);
    expect(book.entries.some((e) => e.title === '眷屬' && e.name === '阿絮')).toBe(true);
    expect(book.entries.filter((e) => e.generation === '子嗣')).toHaveLength(2);
    expect(book.entries.find((e) => e.name === '青禾')?.heir).toBe(true);

    const text = formatGenealogyText(state).join('\n');
    expect(text).toMatch(/族譜/);
    expect(text).toMatch(/青禾/);
  });

  it('seals chronicle into next life via legacy', () => {
    const prev = createNewLife({ seed: 22, skipCoach: true });
    prev.character.age = 40;
    prev.character.family.childrenNames = ['傳兒'];
    prev.character.childrenCount = 1;
    prev.character.flags.heir_name = '傳兒';
    recordDeath(prev, '燈殘。');
    const sealed = sealGenealogyForLegacy(prev);
    expect(sealed.some((l) => l.includes(prev.character.name))).toBe(true);

    const legacy = extractLegacy(prev);
    expect(legacy.genealogyChronicle?.length).toBeGreaterThan(0);

    const next = createNewLife({ seed: 23, skipCoach: true });
    applyLegacyToCharacter(next, legacy);
    const book = buildGenealogy(next);
    expect(book.chronicle.length).toBeGreaterThan(0);
    expect(book.entries.some((e) => e.generation === '先祖')).toBe(true);
  });
});
