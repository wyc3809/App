import { describe, expect, it } from 'vitest';
import { buildFoe, startCombat } from '../core/life/combat';
import { createNewLife } from '../core/life/gameState';
import { initRng } from '../core/random';

describe('combat difficulty', () => {
  it('scales foe power roughly linearly with player martial', () => {
    const early = buildFoe('剪徑', 'normal', { martial: 10, maxHp: 100, attack: 14 });
    const mid = buildFoe('剪徑', 'normal', { martial: 45, maxHp: 180, attack: 26 });
    const late = buildFoe('剪徑', 'normal', { martial: 80, maxHp: 260, attack: 38 });
    expect(mid.maxHp).toBeGreaterThan(early.maxHp);
    expect(late.maxHp).toBeGreaterThan(mid.maxHp);
    expect(late.attack).toBeGreaterThan(early.attack);
    // 線性：中期增量 ≈ 後期增量（允許少量偏差）
    const d1 = mid.maxHp - early.maxHp;
    const d2 = late.maxHp - mid.maxHp;
    expect(Math.abs(d1 - d2)).toBeLessThan(d1 * 0.55 + 20);
  });

  it('keeps normal foes clearly easier than player', () => {
    const scale = { martial: 50, maxHp: 200, attack: 30 };
    const normal = buildFoe('刀客', 'normal', scale);
    const boss = buildFoe('寨主', 'boss', scale);
    expect(normal.maxHp).toBeLessThan(scale.maxHp * 0.9);
    expect(normal.attack).toBeLessThan(scale.attack * 0.85);
    expect(boss.maxHp).toBeGreaterThan(normal.maxHp);
    expect(boss.attack).toBeGreaterThanOrEqual(normal.attack);
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
    expect(foe.maxHp).toBeGreaterThan(player.maxHp * 0.35);
    expect(foe.maxHp).toBeLessThan(player.maxHp * 0.95);
    expect(foe.attack).toBeLessThan(player.attack);
  });
});