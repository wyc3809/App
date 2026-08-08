import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initRng } from '../core/random';
import { createNewLife } from '../core/life/gameState';
import { applyChoice, fullCatalog, getRawEventById, invalidateCatalogCache } from '../core/life/eventEngine';
import { getChoiceResultNarrate } from '../core/life/resultNarrate';
import {
  clearAllEventPatches,
  draftPatchFromEvent,
  resetEventOverrideRuntime,
  saveEventPatch,
} from '../core/life/eventOverrides';

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memory.set(k, v);
    },
    removeItem: (k: string) => {
      memory.delete(k);
    },
    clear: () => memory.clear(),
    key: () => null,
    length: 0,
  });
  resetEventOverrideRuntime();
  clearAllEventPatches();
  invalidateCatalogCache();
  initRng(42);
});

describe('result narrate aligns editor and page-flip', () => {
  it('find_coin feedback matches editor 結果敘事', () => {
    const raw = getRawEventById('find_coin')!;
    const draft = draftPatchFromEvent(raw);
    const expected = draft.choices?.keep?.narrate;
    expect(expected).toBeTruthy();
    expect(expected).toContain('銅錢');

    const state = createNewLife(42);
    const ev = fullCatalog().find((e) => e.id === 'find_coin')!;
    expect(getChoiceResultNarrate(ev, 'keep')).toBe(expected);
    const result = applyChoice(state, ev, 'keep');
    expect(result.feedback).toBe(expected);
  });

  it('patched 結果敘事 shows on applyChoice feedback', () => {
    const custom = '手機改過嘅結果正文，翻頁亦應原樣顯示。';
    saveEventPatch('ord_market', {
      choices: { buy: { narrate: custom } },
    });
    invalidateCatalogCache();
    const ev = fullCatalog().find((e) => e.id === 'ord_market')!;
    expect(getChoiceResultNarrate(ev, 'buy')).toBe(custom);
    const state = createNewLife(7);
    expect(applyChoice(state, ev, 'buy').feedback).toBe(custom);
  });

  it('挑戰帖 回帖改期 feedback matches editor narrate', () => {
    const raw = getRawEventById('jy_rival_letter')!;
    const draft = draftPatchFromEvent(raw);
    const expected = draft.choices?.delay?.narrate;
    expect(expected).toBeTruthy();
    const ev = fullCatalog().find((e) => e.id === 'jy_rival_letter')!;
    const state = createNewLife(9);
    const result = applyChoice(state, ev, 'delay');
    expect(result.feedback).toBe(expected);
  });
});
