import { describe, expect, it } from 'vitest';
import { initRng } from '../core/random';
import { createNewLife } from '../core/life/gameState';
import { startCombat, playerCombatTurn } from '../core/life/combat';
import {
  MOVE_STANCE_LABEL,
  resolveMoveStance,
  stanceBeats,
  stanceDamageMult,
} from '../core/life/moveStance';
import { BASIC_STRIKE, GUARD_STANCE, CHARGE_STANCE } from '../data/skills/catalog';
import { chooseFoeMove } from '../core/life/foeAi';

describe('move stance RPS', () => {
  it('defines 實克虛、架克實、虛克架', () => {
    expect(stanceBeats('shi', 'xu')).toBe(true);
    expect(stanceBeats('jia', 'shi')).toBe(true);
    expect(stanceBeats('xu', 'jia')).toBe(true);
    expect(stanceBeats('xu', 'shi')).toBe(false);
    expect(stanceDamageMult('shi', 'xu')).toBe(1.25);
    expect(stanceDamageMult('xu', 'shi')).toBe(0.75);
    expect(stanceDamageMult('shi', 'shi')).toBe(1);
  });

  it('assigns system move stances', () => {
    expect(resolveMoveStance(BASIC_STRIKE)).toBe('shi');
    expect(resolveMoveStance(GUARD_STANCE)).toBe('jia');
    expect(resolveMoveStance(CHARGE_STANCE)).toBe('xu');
    expect(MOVE_STANCE_LABEL.shi).toBe('實');
  });

  it('enemy pool includes all three stances', () => {
    initRng(1);
    const foe = {
      name: '刀客',
      hp: 100,
      maxHp: 100,
      qi: 80,
      maxQi: 80,
      attack: 20,
      defense: 10,
      hitBonus: 0,
      evasion: 0,
      qiRegen: 5,
      blind: 0,
      isPlayer: false as const,
      stun: 0,
      bleedDamage: 0,
      bleedTurns: 0,
      defenseMod: 0,
      reflect: 0,
      chargeBonus: 0,
    };
    const seen = new Set<string>();
    for (const style of ['brute', 'duelist', 'trickster', 'boss'] as const) {
      for (let i = 0; i < 20; i++) {
        const m = chooseFoeMove(
          foe,
          {
            nextFloat: () => (i % 10) / 10,
            pick: <T,>(arr: T[]) => arr[i % arr.length]!,
            chance: (p) => p > 0.3 && i % 3 === 0,
          },
          style,
        );
        seen.add(resolveMoveStance(m));
      }
    }
    expect(seen.has('shi')).toBe(true);
    expect(seen.has('xu')).toBe(true);
    expect(seen.has('jia')).toBe(true);
  });

  it('combat log mentions 對勢', () => {
    initRng(9);
    const state = createNewLife(9);
    state.character.martial = 30;
    state.character.maxHealth = 200;
    state.character.health = 200;
    startCombat(state, {
      source: 'spar',
      title: '試招',
      foeName: '木人',
      foePower: 'weak',
    });
    const logs = playerCombatTurn(state, BASIC_STRIKE.id);
    expect(logs.some((l) => l.includes('對勢'))).toBe(true);
    expect(logs.some((l) => /虛|實|架/.test(l))).toBe(true);
  });
});
