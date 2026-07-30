import { initRng, type SeededRng } from '@core/random';
import {
  BASIC_STRIKE,
  GUARD_STANCE,
  CHARGE_STANCE,
  getSkillDef,
  listExternalMovesForSkills,
  sumInternalPassives,
  sumEvasionBonus,
  type CombatMoveDef,
} from '@data/skills/catalog';
import { getGearDef } from '@data/equipment/catalog';
import { gearTotals, ensureGear } from './equipment';
import { rankPowerMult } from './martialRanks';
import type { CombatFighterState, LifeCharacter, WuxiaAttribute } from '@interfaces/lifeEngine';
import type { ContestantBuild } from '@interfaces/lifeEngine';

export type ContestFighter = CombatFighterState;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function fakeCharacter(loadout: ContestantBuild): LifeCharacter {
  const attrs = { ...loadout.attributes };
  const c = {
    name: loadout.name,
    gender: 'male' as const,
    age: loadout.age ?? 28,
    alive: true,
    health: loadout.maxHealth,
    maxHealth: loadout.maxHealth,
    money: 0,
    reputation: loadout.reputation ?? 0,
    martial: loadout.martial,
    qi: loadout.maxQi,
    maxQi: loadout.maxQi,
    stamina: 100,
    maxStamina: 100,
    fatigue: 0,
    birthplace: '',
    location: '',
    conditions: [],
    attributes: attrs,
    nature: { xia: 0, xie: 0, kuang: 0, e: 0 },
    skills: [...loadout.skills],
    skillRanks: { ...loadout.skillRanks },
    skillProgress: {},
    skillAdvanceNeed: {},
    gear: [...(loadout.gear ?? [])],
    equipment: { ...loadout.equipment },
    sectId: null,
    sectStanding: 0,
    loverId: null,
    childrenCount: 0,
    childrenMax: 1,
    monthsSinceLastBirth: 99,
    flags: {},
    family: {},
    stats: {
      yearsLived: 0,
      monthsLived: 0,
      eventsSeen: 0,
      combats: 0,
      combatsWon: 0,
      lovers: 0,
      wealthPeak: 0,
    },
  };
  ensureGear(c);
  return c;
}

export function buildContestantFighter(loadout: ContestantBuild, isPlayerSide = false): ContestFighter {
  const c = fakeCharacter(loadout);
  const gear = gearTotals(c);
  const passive = sumInternalPassives(c.skills, c.skillRanks ?? {});
  const evasion = sumEvasionBonus(c.skills, c.skillRanks ?? {}) + c.attributes.danShi / 500;
  const maxHp = c.maxHealth + (passive.maxHp ?? 0) + gear.maxHpBonus;
  const maxQi = c.maxQi + (passive.maxQi ?? 0) + gear.maxQiBonus;
  return {
    name: loadout.name,
    hp: maxHp,
    maxHp,
    qi: maxQi,
    maxQi,
    attack:
      12 +
      Math.floor(c.martial / 4) +
      gear.attack +
      gear.martialBonus +
      (passive.attack ?? 0),
    defense: 6 + Math.floor(c.attributes.genGu / 12) + gear.defense + (passive.defense ?? 0),
    hitBonus: 0.05 + c.attributes.danShi / 400 + (passive.hitBonus ?? 0),
    evasion: Math.min(0.45, evasion),
    qiRegen: 0,
    blind: 0,
    isPlayer: isPlayerSide,
    stun: 0,
    bleedDamage: 0,
    bleedTurns: 0,
    defenseMod: 0,
    reflect: Math.min(0.35, passive.reflect ?? 0),
    chargeBonus: 0,
  };
}


function effectiveDefense(f: ContestFighter): number {
  return Math.max(0, f.defense + f.defenseMod);
}

function skillIdForMove(skills: string[], moveId: string): string | null {
  for (const id of skills) {
    const def = getSkillDef(id);
    if (def?.kind === 'external' && def.move?.id === moveId) return id;
  }
  return null;
}

function weaponMatchBoost(
  loadout: ContestantBuild,
  skillId: string | null,
): { power: number; hit: number } {
  if (!skillId) return { power: 1, hit: 0 };
  const def = getSkillDef(skillId);
  if (!def?.weaponKind) return { power: 1, hit: 0 };
  const equipped = loadout.equipment?.weapon ? getGearDef(loadout.equipment.weapon) : undefined;
  if (equipped?.weaponKind === def.weaponKind) {
    return { power: 1.15, hit: 0.06 };
  }
  return { power: 1, hit: 0 };
}

function tickStatus(f: ContestFighter): string[] {
  const lines: string[] = [];
  if (f.bleedTurns > 0 && f.bleedDamage > 0) {
    f.hp = clamp(f.hp - f.bleedDamage, 0, f.maxHp);
    f.bleedTurns -= 1;
    lines.push(`${f.name}血流不止，失去 ${f.bleedDamage} 點氣血。`);
    if (f.bleedTurns <= 0) f.bleedDamage = 0;
  }
  if (f.defenseMod < 0) f.defenseMod = Math.min(0, f.defenseMod + 1);
  return lines;
}

function resolveOneHit(
  attacker: ContestFighter,
  defender: ContestFighter,
  move: CombatMoveDef,
  rng: SeededRng,
  hitIndex: number,
  totalHits: number,
  powerMult = 1,
  extraHit = 0,
): string[] {
  const lines: string[] = [];
  const hitChance = clamp(
    0.62 +
      attacker.hitBonus +
      (move.hitBonus ?? 0) +
      extraHit -
      (defender.evasion ?? 0) -
      defender.blind -
      hitIndex * 0.04,
    0.12,
    0.95,
  );
  if (!rng.chance(hitChance)) {
    const qing =
      defender.isPlayer && (defender.evasion ?? 0) >= 0.05 ? '，借輕功錯開半寸' : '';
    lines.push(
      totalHits > 1
        ? `${attacker.name}「${move.name}」第${hitIndex + 1}擊被${defender.name}閃過${qing}。`
        : `${attacker.name}使出「${move.name}」，被${defender.name}閃過${qing}！`,
    );
    return lines;
  }
  const pierce = clamp(move.pierce ?? 0, 0, 0.85);
  const def = effectiveDefense(defender) * (1 - pierce);
  const raw = attacker.attack * move.power * powerMult;
  const mitigated = Math.max(3, Math.round(raw - def * 0.55 + rng.nextInt(-3, 4)));
  defender.hp = clamp(defender.hp - mitigated, 0, defender.maxHp);
  lines.push(
    totalHits > 1
      ? `${attacker.name}「${move.name}」第${hitIndex + 1}擊命中，造成 ${mitigated} 點傷害。`
      : `${attacker.name}「${move.name}」命中，造成 ${mitigated} 點傷害。`,
  );
  if (move.lifesteal) {
    const steal = Math.max(1, Math.round(mitigated * move.lifesteal * (0.85 + powerMult * 0.15)));
    attacker.hp = clamp(attacker.hp + steal, 0, attacker.maxHp);
    lines.push(`${attacker.name}借力回氣，回復 ${steal} 點氣血。`);
  }
  if (defender.reflect > 0 && mitigated > 0) {
    const back = Math.max(1, Math.round(mitigated * defender.reflect));
    attacker.hp = clamp(attacker.hp - back, 0, attacker.maxHp);
    lines.push(`${defender.name}硬功反震，${attacker.name}受到 ${back} 點反震。`);
  }
  return lines;
}

function resolveStrike(
  attacker: ContestFighter,
  defender: ContestFighter,
  move: CombatMoveDef,
  loadout: ContestantBuild,
  rng: SeededRng,
  powerMult = 1,
  extraHit = 0,
): string[] {
  const lines: string[] = [];
  if (move.id === GUARD_STANCE.id || move.id === CHARGE_STANCE.id) return lines;
  if (attacker.qi < move.qiCost) {
    lines.push(`${attacker.name}內息不足，改為普通攻擊。`);
    return resolveStrike(attacker, defender, BASIC_STRIKE, loadout, rng, 1, extraHit);
  }
  attacker.qi -= move.qiCost;
  defender.blind = Math.max(0, defender.blind * 0.35);
  let charge = 1;
  if (attacker.chargeBonus > 0) {
    charge = 1 + attacker.chargeBonus;
    attacker.chargeBonus = 0;
    lines.push(`${attacker.name}蓄勢已久，這一擊沉猛異常！`);
  }
  const hits = move.multiHit ?? 1;
  const sid = skillIdForMove(loadout.skills, move.id);
  const wpn = weaponMatchBoost(loadout, sid);
  const rank = sid ? (loadout.skillRanks[sid] ?? 0) : 0;
  const mult = (sid ? rankPowerMult(rank) : 1) * wpn.power * charge * powerMult;
  for (let i = 0; i < hits; i += 1) {
    lines.push(...resolveOneHit(attacker, defender, move, rng, i, hits, mult, extraHit + wpn.hit));
    if (defender.hp <= 0) break;
  }
  return lines;
}

function contestChooseMove(
  fighter: ContestFighter,
  moves: CombatMoveDef[],
  rng: SeededRng,
): CombatMoveDef {
  const hpR = fighter.hp / Math.max(1, fighter.maxHp);
  if (hpR < 0.38 && fighter.qi >= GUARD_STANCE.qiCost && rng.chance(0.35)) {
    return GUARD_STANCE;
  }
  if (fighter.chargeBonus <= 0 && fighter.qi >= CHARGE_STANCE.qiCost + 25 && rng.chance(0.22)) {
    return CHARGE_STANCE;
  }
  const attacks = moves.filter((m) => m.power > 0 && fighter.qi >= m.qiCost);
  if (attacks.length) {
    const sorted = [...attacks].sort((a, b) => b.power - a.power);
    const top = sorted.slice(0, Math.min(3, sorted.length));
    return rng.pick(top);
  }
  return BASIC_STRIKE;
}

function executeTurn(
  attacker: ContestFighter,
  defender: ContestFighter,
  loadout: ContestantBuild,
  moves: CombatMoveDef[],
  rng: SeededRng,
): string[] {
  const lines: string[] = [];
  lines.push(...tickStatus(attacker));
  if (attacker.hp <= 0) return lines;
  if (attacker.stun > 0) {
    attacker.stun -= 1;
    lines.push(`${attacker.name}穴道未暢，這一招使不出來。`);
    return lines;
  }
  const move = contestChooseMove(attacker, moves, rng);
  if (move.id === GUARD_STANCE.id) {
    attacker.defenseMod += 6;
    attacker.qi = clamp(attacker.qi + 12, 0, attacker.maxQi);
    lines.push(`${attacker.name}收招守中，架勢更穩。`);
    return lines;
  }
  if (move.id === CHARGE_STANCE.id) {
    if (attacker.qi < move.qiCost) {
      lines.push(...resolveStrike(attacker, defender, BASIC_STRIKE, loadout, rng));
    } else {
      attacker.qi -= move.qiCost;
      attacker.chargeBonus = Math.max(attacker.chargeBonus, 0.55);
      lines.push(`${attacker.name}凝勁於腕，蓄勢待發。`);
    }
    return lines;
  }
  lines.push(...resolveStrike(attacker, defender, move, loadout, rng));
  return lines;
}

export interface ContestDuelResult {
  winnerId: string;
  loserId: string;
  log: string[];
  draw: boolean;
}

/** 非即時自動比武：依雙方武功與數值推演，固定 seed 可重播 */
export function simulateContestDuel(opts: {
  title: string;
  a: ContestantBuild;
  b: ContestantBuild;
  seed: number;
  maxTurns?: number;
  aIsPlayer?: boolean;
}): ContestDuelResult {
  const rng = initRng(opts.seed >>> 0);
  const maxTurns = opts.maxTurns ?? 36;
  const aF = buildContestantFighter(opts.a, Boolean(opts.aIsPlayer));
  const bF = buildContestantFighter(opts.b, false);
  const movesA = listExternalMovesForSkills(opts.a.skills);
  const movesB = listExternalMovesForSkills(opts.b.skills);
  const log: string[] = [`【${opts.title}】`, `${opts.a.name} 對 ${opts.b.name}，劍拔弩張。`];

  for (let turn = 1; turn <= maxTurns; turn += 1) {
    if (aF.hp > 0 && bF.hp > 0) {
      log.push(...executeTurn(aF, bF, opts.a, movesA, rng));
    }
    if (bF.hp <= 0 || aF.hp <= 0) break;
    if (aF.hp > 0 && bF.hp > 0) {
      log.push(...executeTurn(bF, aF, opts.b, movesB, rng));
    }
    if (bF.hp <= 0 || aF.hp <= 0) break;
  }

  let draw = false;
  let winnerId: string;
  let loserId: string;
  if (aF.hp > 0 && bF.hp > 0) {
    draw = true;
    if (aF.hp / aF.maxHp >= bF.hp / bF.maxHp) {
      winnerId = opts.a.id;
      loserId = opts.b.id;
      log.push('時限已至，裁判以氣血成色判你稍佔上風。');
    } else {
      winnerId = opts.b.id;
      loserId = opts.a.id;
      log.push('時限已至，裁判以氣血成色判對手稍佔上風。');
    }
  } else if (bF.hp <= 0) {
    winnerId = opts.a.id;
    loserId = opts.b.id;
    log.push(`${opts.b.name}氣竭敗北。`);
  } else {
    winnerId = opts.b.id;
    loserId = opts.a.id;
    log.push(`${opts.a.name}氣竭敗北。`);
  }

  return { winnerId, loserId, log, draw };
}

export function defaultAttributes(martial: number): Record<WuxiaAttribute, number> {
  const base = 40 + Math.floor(martial / 3);
  return {
    genGu: base + 4,
    wuXing: base,
    fuYuan: base - 2,
    meiLi: base - 4,
    danShi: base + 2,
  };
}
