import { describe, expect, it } from 'vitest';
import { buildFoe, buildPlayerFighter, startCombat } from '../core/life/combat';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('combat difficulty', () => {
  it('scales foe power with player martial', () => {
    const weakEarly = buildFoe('剪徑', 'normal', { martial: 10, maxHp: 100, attack: 14 });
    const late = buildFoe('剪徑', 'normal', { martial: 80, maxHp: 280, attack: 40 });
    expect(late.maxHp).toBeGreaterThan(weakEarly.maxHp);
    expect(late.attack).toBeGreaterThan(weakEarly.attack);
    expect(late.defense).toBeGreaterThan(weakEarly.defense);
  });

  it('boss is tougher than strong at same scale', () => {
    const scale = { martial: 40, maxHp: 180, attack: 28 };
    const strong = buildFoe('刀客', 'strong', scale);
    const boss = buildFoe('寨主', 'boss', scale);
    expect(boss.maxHp).toBeGreaterThan(strong.maxHp);
    expect(boss.attack).toBeGreaterThanOrEqual(strong.attack);
  });

  it('startCombat wires scaled foe from player stats', () => {
    initRng(5);
    const state = createNewLife(5);
    state.character.martial = 60;
    state.character.maxHealth = 220;
    state.character.health = 220;
    startCombat(state, {
      source: 'event',
      title: '試',
      foeName: '山賊',
      foePower: 'strong',
    });
    const player = state.pendingCombat!.player;
    const foe = state.pendingCombat!.foe;
    expect(foe.maxHp).toBeGreaterThan(player.maxHp * 0.9);
    expect(foe.attack).toBeGreaterThan(14);
  });
});
