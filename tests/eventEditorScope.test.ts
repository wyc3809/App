import { describe, expect, it } from 'vitest';
import { filterEventsForEditor, isEventEditorExcluded } from '../core/life/eventEditorScope';
import { getRawEventById, rawCatalog } from '../core/life/eventEngine';

describe('eventEditorScope', () => {
  it('excludes challenge-letter / 回帖改期 events', () => {
    const letter = getRawEventById('jy_rival_letter');
    expect(letter).toBeTruthy();
    expect(isEventEditorExcluded(letter!)).toBe(true);
    expect(letter!.choices.some((c) => c.text === '回帖改期')).toBe(true);
  });

  it('excludes 戰書 titles', () => {
    const duel = getRawEventById('jx_rival_letter');
    expect(duel).toBeTruthy();
    expect(isEventEditorExcluded(duel!)).toBe(true);
  });

  it('keeps ordinary market editable', () => {
    const market = getRawEventById('ord_market');
    expect(market).toBeTruthy();
    expect(isEventEditorExcluded(market!)).toBe(false);
  });

  it('filterEventsForEditor drops excluded ids', () => {
    const ids = new Set(filterEventsForEditor(rawCatalog()).map((e) => e.id));
    expect(ids.has('jy_rival_letter')).toBe(false);
    expect(ids.has('jx_rival_letter')).toBe(false);
    expect(ids.has('ord_market')).toBe(true);
  });
});
