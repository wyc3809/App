import { describe, expect, it } from 'vitest';
import { getFinalAttributes } from '../core/attribute';
import { initRng, SeededRng } from '../core/random';
import { createDefaultWorld } from '../core/world';

describe('SeededRng', () => {
  it('is deterministic for same seed', () => {
    const a = new SeededRng(42);
    const b = new SeededRng(42);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });
});

describe('world', () => {
  it('creates reproducible world', () => {
    initRng(12345);
    const w1 = createDefaultWorld(12345);
    initRng(12345);
    const w2 = createDefaultWorld(12345);
    expect(w1.playerId).toBe(w2.playerId);
    expect(w1.characters[w1.playerId].name).toBe(w2.characters[w2.playerId].name);
  });
});

describe('attribute', () => {
  it('applies aging penalty', () => {
    const base = {
      strength: 80,
      agility: 50,
      constitution: 70,
      intelligence: 50,
      spirit: 50,
      perception: 50,
      willpower: 50,
      luck: 50,
    };
    const young = getFinalAttributes(base, [], 0, 25);
    const old = getFinalAttributes(base, [], 0, 65);
    expect(old.strength).toBeLessThan(young.strength);
    expect(old.spirit).toBeGreaterThanOrEqual(young.spirit - 5);
  });
});
