import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyEventPatch,
  applyEventPatches,
  clearAllEventPatches,
  draftPatchFromEvent,
  exportEventOverrideStore,
  importEventOverrideStore,
  loadEventOverrides,
  removeEventPatch,
  resetEventOverrideRuntime,
  saveEventPatch,
} from '../core/life/eventOverrides';
import { fullCatalog, getRawEventById, invalidateCatalogCache, lookupEvent } from '../core/life/eventEngine';
import type { GameEvent } from '../interfaces/lifeEngine';

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
  loadEventOverrides();
  invalidateCatalogCache();
});

afterEach(() => {
  resetEventOverrideRuntime();
  invalidateCatalogCache();
  vi.unstubAllGlobals();
});

function sampleEvent(): GameEvent {
  return {
    id: 'test_edit_evt',
    title: '舊題',
    body: '舊文',
    weight: 10,
    requirements: {},
    choices: [
      {
        id: 'go',
        text: '前往',
        outcomes: [
          {
            id: 'go_ok',
            weight: 0.8,
            effects: [
              { type: 'narrate', text: '平安抵達' },
              { type: 'money', amount: 5 },
            ],
          },
          {
            id: 'go_ill',
            weight: 0.2,
            effects: [
              { type: 'narrate', text: '遇襲' },
              { type: 'health', amount: -4 },
            ],
          },
        ],
      },
    ],
  };
}

describe('eventOverrides', () => {
  it('applies title body weight and choice edits', () => {
    const patched = applyEventPatch(sampleEvent(), {
      title: '新題',
      body: '新文',
      weight: 3,
      choices: {
        go: {
          text: '速行',
          narrate: '風塵仆仆',
          money: 12,
          riskPercent: 40,
        },
      },
    });
    expect(patched.title).toBe('新題');
    expect(patched.body).toBe('新文');
    expect(patched.weight).toBe(3);
    expect(patched.choices[0].text).toBe('速行');
    const fair = patched.choices[0].outcomes.find((o) => o.id === 'go_ok')!;
    const ill = patched.choices[0].outcomes.find((o) => o.id === 'go_ill')!;
    expect(fair.effects.find((e) => e.type === 'narrate')).toMatchObject({ text: '風塵仆仆' });
    expect(fair.effects.find((e) => e.type === 'money')).toMatchObject({ amount: 12 });
    expect(fair.weight).toBeCloseTo(0.6);
    expect(ill.weight).toBeCloseTo(0.4);
  });

  it('disabled zeroes weight', () => {
    const patched = applyEventPatch(sampleEvent(), { disabled: true });
    expect(patched.weight).toBe(0);
  });

  it('persists patches and hot-reloads fullCatalog', () => {
    const market = getRawEventById('ord_market');
    expect(market).toBeTruthy();
    saveEventPatch('ord_market', { title: '手機改市集' });
    invalidateCatalogCache();
    expect(lookupEvent('ord_market')?.title).toBe('手機改市集');
    expect(fullCatalog().find((e) => e.id === 'ord_market')?.title).toBe('手機改市集');
    removeEventPatch('ord_market');
    invalidateCatalogCache();
    expect(lookupEvent('ord_market')?.title).toBe(market!.title);
  });

  it('export / import roundtrip', () => {
    saveEventPatch('ord_market', { title: '匯出市集', weight: 7 });
    const json = exportEventOverrideStore();
    clearAllEventPatches();
    const res = importEventOverrideStore(JSON.parse(json));
    expect(res).toEqual({ ok: true, count: 1 });
    expect(applyEventPatches([getRawEventById('ord_market')!])[0].title).toBe('匯出市集');
  });

  it('draftPatchFromEvent pre-fills editable fields', () => {
    const draft = draftPatchFromEvent(sampleEvent());
    expect(draft.title).toBe('舊題');
    expect(draft.choices?.go?.riskPercent).toBe(20);
    expect(draft.choices?.go?.money).toBe(5);
  });
});
