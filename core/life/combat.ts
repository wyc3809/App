import type { LifeGameState, CombatFighterState, PendingCombat as PendingCombatState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { gearTotals, ensureGear } from './equipment';
import { tryAdvanceSkill } from './flavor';
import { pushChronicle } from './chronicle';
import { buildLifeSummary } from './summary';
import { tryGainSectStanding } from './sectStanding';
import {
  BASIC_STRIKE,
  getSkillDef,
  listExternalMovesForSkills,
  sumInternalPassives,
  sumEvasionBonus,
  type CombatMoveDef,
} from '@data/skills/catalog';
import { rankPowerMult } from './martialRanks';
import { grantGear } from './equipment';
import { learnMartialArt } from './flavor';

export type CombatFighter = CombatFighterState;
export type PendingCombat = PendingCombatState;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function buildPlayerFighter(state: LifeGameState): CombatFighter {
  const c = state.character;
  ensureGear(c);
  const gear = gearTotals(c);
  const passive = sumInternalPassives(c.skills, c.skillRanks ?? {});
  const evasion = sumEvasionBonus(c.skills, c.skillRanks ?? {}) + c.attributes.danShi / 500;
  const maxHp = c.health;
  const maxQi = c.qi;
  return {
    name: c.name,
    hp: maxHp,
    maxHp: c.maxHealth + (passive.maxHp ?? 0),
    qi: maxQi,
    maxQi: c.maxQi + (passive.maxQi ?? 0),
    attack: 12 + Math.floor(c.martial / 4) + gear.attack + gear.martialBonus + (passive.attack ?? 0),
    defense: 6 + Math.floor(c.attributes.genGu / 12) + gear.defense + (passive.defense ?? 0),
    hitBonus: 0.05 + c.attributes.danShi / 400 + (passive.hitBonus ?? 0),
    evasion: Math.min(0.45, evasion),
    qiRegen: 6 + (passive.qiRegen ?? 0),
    blind: 0,
    isPlayer: true,
    stun: 0,
    bleedDamage: 0,
    bleedTurns: 0,
    defenseMod: 0,
    reflect: Math.min(0.35, passive.reflect ?? 0),
  };
}

export function buildFoe(
  name: string,
  power: 'weak' | 'normal' | 'strong' | 'boss' = 'normal',
): CombatFighter {
  const mult =
    power === 'weak' ? 0.75 : power === 'strong' ? 1.35 : power === 'boss' ? 1.75 : 1;
  const maxHp = Math.round((power === 'boss' ? 130 : 90) * mult);
  const maxQi = Math.round((power === 'boss' ? 95 : 70) * mult);
  return {
    name,
    hp: maxHp,
    maxHp,
    qi: maxQi,
    maxQi,
    attack: Math.round((power === 'boss' ? 18 : 14) * mult),
    defense: Math.round((power === 'boss' ? 9 : 7) * mult),
    hitBonus: (power === 'boss' ? 0.08 : 0.04) * mult,
    evasion: power === 'boss' ? 0.06 : 0,
    qiRegen: power === 'boss' ? 7 : 5,
    blind: 0,
    isPlayer: false,
    stun: 0,
    bleedDamage: 0,
    bleedTurns: 0,
    defenseMod: 0,
    reflect: 0,
  };
}

export function startCombat(
  state: LifeGameState,
  opts: {
    source: PendingCombat['source'];
    title: string;
    foeName: string;
    foePower?: 'weak' | 'normal' | 'strong' | 'boss';
    rewardOnWin?: PendingCombat['rewardOnWin'];
    rewardOnLose?: PendingCombat['rewardOnLose'];
    eventId?: string;
  },
): string[] {
  syncRngFromState(state);
  const combat: PendingCombat = {
    id: `cbt_${state.year}_${state.month}_${state.character.stats.combats}`,
    source: opts.source,
    title: opts.title,
    turn: 1,
    phase: 'player',
    player: buildPlayerFighter(state),
    foe: buildFoe(opts.foeName, opts.foePower),
    log: [`【${opts.title}】對上${opts.foeName}，戰端已開。`],
    usedExternalSkillIds: [],
    rewardOnWin: opts.rewardOnWin,
    rewardOnLose: opts.rewardOnLose,
    eventId: opts.eventId,
  };
  combat.player.hp = clamp(combat.player.hp, 1, combat.player.maxHp);
  combat.player.qi = clamp(combat.player.qi, 0, combat.player.maxQi);
  state.pendingCombat = combat;
  state.pending = null;
  snapshotRng(state);
  return combat.log;
}

export function getPlayerMoves(state: LifeGameState): CombatMoveDef[] {
  return listExternalMovesForSkills(state.character.skills);
}

function findMove(state: LifeGameState, moveId: string): CombatMoveDef | null {
  if (moveId === BASIC_STRIKE.id) return BASIC_STRIKE;
  for (const id of state.character.skills) {
    const def = getSkillDef(id);
    if (def?.move?.id === moveId) return def.move;
  }
  return null;
}

function skillIdForMove(state: LifeGameState, moveId: string): string | null {
  for (const id of state.character.skills) {
    const def = getSkillDef(id);
    if (def?.kind === 'external' && def.move?.id === moveId) return id;
  }
  return null;
}

function effectiveDefense(f: CombatFighter): number {
  return Math.max(0, f.defense + f.defenseMod);
}

function tickStatus(f: CombatFighter): string[] {
  const lines: string[] = [];
  if (f.bleedTurns > 0 && f.bleedDamage > 0) {
    f.hp = clamp(f.hp - f.bleedDamage, 0, f.maxHp);
    f.bleedTurns -= 1;
    lines.push(`${f.name}血流不止，失去 ${f.bleedDamage} 點氣血。`);
    if (f.bleedTurns <= 0) {
      f.bleedDamage = 0;
    }
  }
  if (f.defenseMod < 0) {
    f.defenseMod = Math.min(0, f.defenseMod + 1);
  }
  return lines;
}

function resolveOneHit(
  attacker: CombatFighter,
  defender: CombatFighter,
  move: CombatMoveDef,
  rng: ReturnType<typeof getRng>,
  hitIndex: number,
  totalHits: number,
  powerMult = 1,
): string[] {
  const lines: string[] = [];
  const hitChance = clamp(
    0.62 +
      attacker.hitBonus +
      (move.hitBonus ?? 0) -
      (defender.evasion ?? 0) -
      defender.blind -
      hitIndex * 0.04,
    0.12,
    0.95,
  );
  if (!rng.chance(hitChance)) {
    lines.push(
      totalHits > 1
        ? `${attacker.name}「${move.name}」第${hitIndex + 1}擊被${defender.name}閃過。`
        : `${attacker.name}使出「${move.name}」，被${defender.name}閃過！`,
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

function applyOnHitEffects(
  attacker: CombatFighter,
  defender: CombatFighter,
  move: CombatMoveDef,
  rng: ReturnType<typeof getRng>,
  anyHit: boolean,
  powerMult = 1,
): string[] {
  const lines: string[] = [];
  if (!anyHit) return lines;

  if (move.healSelf) {
    const heal = Math.round(move.healSelf * (0.9 + powerMult * 0.1));
    attacker.hp = clamp(attacker.hp + heal, 0, attacker.maxHp);
    lines.push(`${attacker.name}順勢調息，氣血回復 ${heal}。`);
  }
  if (move.applyBlind) {
    defender.blind = Math.max(defender.blind, move.applyBlind);
    lines.push(`${defender.name}眼前一花，招式顯得滯澀。`);
  }
  if (move.qiDrain) {
    const drain = Math.round(move.qiDrain * powerMult);
    defender.qi = clamp(defender.qi - drain, 0, defender.maxQi);
    lines.push(`${defender.name}內息被擾，散去 ${drain}。`);
  }
  if (move.defenseBreak) {
    const brk = Math.round(move.defenseBreak * (0.85 + powerMult * 0.15));
    defender.defenseMod -= brk;
    lines.push(`${defender.name}架勢散亂，防禦暫降。`);
  }
  if (move.bleedChance && rng.chance(move.bleedChance)) {
    const dmg = Math.round((move.bleedDamage ?? 5) * powerMult);
    const turns = move.bleedTurns ?? 2;
    defender.bleedDamage = Math.max(defender.bleedDamage, dmg);
    defender.bleedTurns = Math.max(defender.bleedTurns, turns);
    lines.push(`${defender.name}被劃出血線，一時難止。`);
  }
  if (move.stunChance && rng.chance(Math.min(0.55, move.stunChance * (0.9 + powerMult * 0.1)))) {
    defender.stun = Math.max(defender.stun, 1);
    lines.push(`${defender.name}穴道一滯，動作遲了半拍！`);
  }
  return lines;
}

function resolveStrike(
  attacker: CombatFighter,
  defender: CombatFighter,
  move: CombatMoveDef,
  rng: ReturnType<typeof getRng>,
  powerMult = 1,
): string[] {
  const lines: string[] = [];
  if (attacker.qi < move.qiCost) {
    lines.push(`${attacker.name}內息不足，無法使出「${move.name}」，改為普通攻擊。`);
    return resolveStrike(attacker, defender, BASIC_STRIKE, rng, 1);
  }
  attacker.qi -= move.qiCost;
  defender.blind = Math.max(0, defender.blind * 0.35);

  const hits = Math.max(1, move.multiHit ?? 1);
  let anyHit = false;
  for (let i = 0; i < hits; i++) {
    const before = defender.hp;
    const hitLines = resolveOneHit(attacker, defender, move, rng, i, hits, powerMult);
    lines.push(...hitLines);
    if (defender.hp < before) anyHit = true;
    if (defender.hp <= 0) break;
  }
  lines.push(...applyOnHitEffects(attacker, defender, move, rng, anyHit, powerMult));
  return lines;
}

function enemyChooseMove(foe: CombatFighter, rng: ReturnType<typeof getRng>): CombatMoveDef {
  const pool: CombatMoveDef[] = [
    BASIC_STRIKE,
    {
      id: 'enemy_heavy',
      name: '猛攻',
      qiCost: 12,
      power: 1.4,
      description: '',
    },
    {
      id: 'enemy_feint',
      name: '虛晃',
      qiCost: 8,
      power: 0.9,
      hitBonus: 0.15,
      description: '',
    },
  ];
  const affordable = pool.filter((m) => foe.qi >= m.qiCost);
  return rng.pick(affordable.length ? affordable : [BASIC_STRIKE]);
}

function tickRegen(f: CombatFighter): void {
  f.qi = clamp(f.qi + f.qiRegen, 0, f.maxQi);
}

function finishCombat(state: LifeGameState, won: boolean): string[] {
  const combat = state.pendingCombat;
  if (!combat) return [];
  const c = state.character;
  const lines: string[] = [];

  const hpRatio = combat.player.hp / Math.max(1, combat.player.maxHp);
  c.health = clamp(Math.round(c.maxHealth * Math.min(1, hpRatio)), 0, c.maxHealth);
  c.qi = clamp(combat.player.qi, 0, c.maxQi);
  c.fatigue = clamp(c.fatigue + (won ? 8 : 14), 0, 100);
  c.stats.combats += 1;

  if (won) {
    c.stats.combatsWon += 1;
    lines.push(`你戰勝了${combat.foe.name}！`);
    const r = combat.rewardOnWin ?? {};
    if (r.money) {
      c.money += r.money;
      lines.push(`銀兩＋${r.money}`);
    }
    if (r.reputation) {
      c.reputation += r.reputation;
      lines.push(`名望＋${r.reputation}`);
    }
    if (r.martial) {
      c.martial += r.martial;
      lines.push(`武學＋${r.martial}`);
    }
    if (r.skillId && !c.skills.includes(r.skillId)) {
      lines.push(learnMartialArt(state, r.skillId, r.skillName));
    }
    if (r.gearId) {
      const gearName = grantGear(state, r.gearId);
      if (gearName) lines.push(`戰利品：「${gearName}」`);
    }
    if (combat.source === 'spar' && c.sectId) {
      const stand = tryGainSectStanding(state, 0.55);
      if (stand) lines.push(stand);
    }
    for (const sid of combat.usedExternalSkillIds) {
      const adv = tryAdvanceSkill(state, sid, 'combat');
      if (adv) lines.push(adv);
    }
  } else {
    lines.push(`你敗於${combat.foe.name}。`);
    const r = combat.rewardOnLose ?? {};
    if (r.money) {
      c.money = Math.max(0, c.money + r.money);
      lines.push(r.money < 0 ? `銀兩${r.money}` : `銀兩＋${r.money}`);
    }
    if (r.reputation) {
      c.reputation += r.reputation;
      lines.push(`名望${r.reputation > 0 ? '＋' : ''}${r.reputation}`);
    }
    if (c.health <= 0) {
      c.alive = false;
      state.phase = 'summary';
      state.summaryText = buildLifeSummary(state);
      lines.push('你力竭倒地，江湖路斷。');
    } else {
      c.health = Math.max(1, c.health);
    }
  }

  combat.phase = 'ended';
  combat.log.push(...lines);
  state.pendingCombat = null;
  pushChronicle(state, [`「${combat.title}」`, ...lines]);
  return lines;
}

/**
 * 玩家回合：選外功招式或普通攻擊 → 結算 → 敵方回合 → 回到玩家
 */
export function playerCombatTurn(state: LifeGameState, moveId: string): string[] {
  if (!state.pendingCombat || state.pendingCombat.phase !== 'player') {
    return ['此刻並無交手。'];
  }
  syncRngFromState(state);
  const rng = getRng();
  const combat = state.pendingCombat;
  const lines: string[] = [];

  lines.push(...tickStatus(combat.player));
  if (combat.player.hp <= 0) {
    const end = finishCombat(state, false);
    snapshotRng(state);
    return [...lines, ...end];
  }

  if (combat.player.stun > 0) {
    combat.player.stun -= 1;
    lines.push('你穴道未暢，這一招使不出來。');
    combat.log.push(...lines);
  } else {
    tickRegen(combat.player);
    const move = findMove(state, moveId) ?? BASIC_STRIKE;
    const sid = skillIdForMove(state, move.id);
    if (sid && !combat.usedExternalSkillIds.includes(sid)) {
      combat.usedExternalSkillIds.push(sid);
    }
    const rank = sid ? (state.character.skillRanks?.[sid] ?? 0) : 0;
    const powerMult = sid ? rankPowerMult(rank) : 1;
    lines.push(...resolveStrike(combat.player, combat.foe, move, rng, powerMult));
    combat.log.push(...lines);
  }

  if (combat.foe.hp <= 0) {
    const end = finishCombat(state, true);
    snapshotRng(state);
    return [...lines, ...end];
  }

  combat.phase = 'enemy';
  const foeStatus = tickStatus(combat.foe);
  lines.push(...foeStatus);
  combat.log.push(...foeStatus);
  if (combat.foe.hp <= 0) {
    const end = finishCombat(state, true);
    snapshotRng(state);
    return [...lines, ...end];
  }

  if (combat.foe.stun > 0) {
    combat.foe.stun -= 1;
    const skip = `${combat.foe.name}動作遲滯，錯過機會。`;
    lines.push(skip);
    combat.log.push(skip);
  } else {
    tickRegen(combat.foe);
    const enemyMove = enemyChooseMove(combat.foe, rng);
    const enemyLines = resolveStrike(combat.foe, combat.player, enemyMove, rng);
    combat.log.push(...enemyLines);
    lines.push(...enemyLines);
  }

  if (combat.player.hp <= 0) {
    const end = finishCombat(state, false);
    snapshotRng(state);
    return [...lines, ...end];
  }

  combat.turn += 1;
  combat.phase = 'player';
  snapshotRng(state);
  return lines;
}

export function isFleeChoice(choiceId: string, text: string): boolean {
  const s = `${choiceId} ${text}`;
  return /avoid|flee|leave|delay|watch|run|逃|避|離開|觀望|改日|抽身|退去|不戰/.test(s);
}
