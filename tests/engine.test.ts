import { describe, expect, it } from 'vitest';
import { getFinalAttributes } from '../core/attribute';
import { initRng, SeededRng } from '../core/random';
import { checkJoinFaction, joinFaction } from '../core/faction';
import {
  persistSave,
  rebuildStateFromSave,
  type PersistedSave,
} from '../core/save';
import { createDefaultWorld, getPlayer } from '../core/world';

describe('faction', () => {
  it('allows player to join sect', () => {
    initRng(99);
    const state = createDefaultWorld(99);
    const player = getPlayer(state);
    player.martialSkill = 12;
    player.martialSkill = 12;
    const sect = Object.values(state.factions).find((f) => f.type === 'sect');
    expect(sect).toBeTruthy();
    const check = checkJoinFaction(state, player, sect!.id);
    expect(check.ok).toBe(true);
    const joined = joinFaction(state, player, sect!.id);
    expect(joined.ok).toBe(true);
    expect(player.factionId).toBe(sect!.id);
    expect(player.factionMembership?.rank).toBe('outer');
  });
});

describe('save', () => {
  it('roundtrips delta save', () => {
    initRng(7);
    const world = createDefaultWorld(7);
    const player = getPlayer(world);
    player.money = 999;
    const baseline: PersistedSave = {
      version: 1,
      savedAt: Date.now(),
      baseline: structuredClone(world),
      deltas: [],
    };
    const next = structuredClone(world);
    next.characters[player.id].money = 1000;
    next.tickCount = 5;
    const persisted = persistSave(baseline, world, next);
    const rebuilt = rebuildStateFromSave(persisted);
    expect(rebuilt.characters[player.id].money).toBe(1000);
    expect(rebuilt.tickCount).toBe(5);
  });
});

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
