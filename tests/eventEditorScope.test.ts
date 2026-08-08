import { describe, expect, it } from 'vitest';
import { eventMatchesEditorQuery } from '../core/life/eventEditorScope';
import { getRawEventById } from '../core/life/eventEngine';

describe('eventEditorScope search', () => {
  it('finds 挑戰帖到 by choice text 回帖改期', () => {
    const letter = getRawEventById('jy_rival_letter');
    expect(letter).toBeTruthy();
    expect(eventMatchesEditorQuery(letter!, '回帖改期')).toBe(true);
    expect(eventMatchesEditorQuery(letter!, '挑戰帖')).toBe(true);
    expect(eventMatchesEditorQuery(letter!, '病體未癒')).toBe(true);
  });

  it('does not false-match unrelated events', () => {
    const market = getRawEventById('ord_market');
    expect(market).toBeTruthy();
    expect(eventMatchesEditorQuery(market!, '回帖改期')).toBe(false);
  });
});
