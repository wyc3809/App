import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { gearTotals, ensureGear } from './equipment';
import { tryAdvanceSkill } from './flavor';
import { pushChronicle } from './chronicle';
import { buildLifeSummary } from './summary';
import {
  BASIC_STRIKE,
  getSkillDef,
  listExternalMovesForSkills,
  sumInternalPassives,
  type CombatMoveDef,
} from '@data/skills/catalog';

export interface CombatFighter {
  name: string;
  hp: number;
  maxHp: number;
  qi: number;
  maxQi: number;
  attack: number;
  defense: number;
  hitBonus: number;
  qiRegen: number;
  /** 下回合命中懲罰 */
  blind: number;
  isPlayer: boolean;
}

export interface PendingCombat {
  id: string;
  source: 'spar' | 'event' | 'bandit' | 'road';
  title: string;
  turn: number;
  phase: 'player' | 'enemy' | 'ended';
  player: CombatFighter;
  foe: CombatFighter;
  log: string[];
  /** 本場用過的外功 skillId，結束時嘗試進階 */
  usedExternalSkillIds: string[];
  rewardOnWin?: { money?: number; reputation?: number; martial?: number };
  rewardOnLose?: { money?: number; reputation?: number };
  eventId?: string;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function buildPlayerFighter(state: LifeGameState): CombatFighter {
  const c = state.character;
  ensureGear(c);
  const gear = gearTotals(c);
  const passive = sumInternalPassives(c.skills, c.skillRanks ?? {});
  const maxHp = c.health; // 戰鬥用當前氣血為戰意池，結束回寫
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
    qiRegen: 6 + (passive.qiRegen ?? 0),
    blind: 0,
    isPlayer: true,
  };
}

export function buildFoe(
  name: string,
  power: 'weak' | 'normal' | 'strong' = 'normal',
): CombatFighter {
  const mult = power === 'weak' ? 0.75 : power === 'strong' ? 1.35 : 1;
  const maxHp = Math.round(90 * mult);
  const maxQi = Math.round(70 * mult);
  return {
    name,
    hp: maxHp,
    maxHp,
    qi: maxQi,
    maxQi,
    attack: Math.round(14 * mult),
    defense: Math.round(7 * mult),
    hitBonus: 0.04 * mult,
    qiRegen: 5,
    blind: 0,
    isPlayer: false,
  };
}

export function startCombat(
  state: LifeGameState,
  opts: {
    source: PendingCombat['source'];
    title: string;
    foeName: string;
    foePower?: 'weak' | 'normal' | 'strong';
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
  // 內功即時抬高戰中氣血上限表現
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

function resolveStrike(
  attacker: CombatFighter,
  defender: CombatFighter,
  move: CombatMoveDef,
  rng: ReturnType<typeof getRng>,
): string[] {
  const lines: string[] = [];
  if (attacker.qi < move.qiCost) {
    lines.push(`${attacker.name}內息不足，無法使出「${move.name}」，改為普通攻擊。`);
    return resolveStrike(attacker, defender, BASIC_STRIKE, rng);
  }
  attacker.qi -= move.qiCost;

  const hitChance = clamp(0.62 + attacker.hitBonus + (move.hitBonus ?? 0) - defender.blind, 0.2, 0.95);
  defender.blind = 0;
  if (!rng.chance(hitChance)) {
    lines.push(`${attacker.name}使出「${move.name}」，被${defender.name}閃過！`);
    return lines;
  }

  const raw = attacker.attack * move.power;
  const mitigated = Math.max(3, Math.round(raw - defender.defense * 0.55 + rng.nextInt(-3, 4)));
  defender.hp = clamp(defender.hp - mitigated, 0, defender.maxHp);
  lines.push(`${attacker.name}「${move.name}」命中，造成 ${mitigated} 點傷害。`);

  if (move.healSelf) {
    const heal = move.healSelf;
    attacker.hp = clamp(attacker.hp + heal, 0, attacker.maxHp);
    lines.push(`${attacker.name}順勢調息，氣血回復 ${heal}。`);
  }
  if (move.applyBlind) {
    defender.blind = move.applyBlind;
    lines.push(`${defender.name}眼前一花，招式顯得滯澀。`);
  }
  // 寒霜等：額外耗敵內息
  if (move.id === 'mv_cold_palm') {
    defender.qi = clamp(defender.qi - 10, 0, defender.maxQi);
    lines.push(`${defender.name}內息被寒意侵擾。`);
  }
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

  // 回寫氣血內息（戰損／回復）
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

  tickRegen(combat.player);
  const move = findMove(state, moveId) ?? BASIC_STRIKE;
  const sid = skillIdForMove(state, move.id);
  if (sid && !combat.usedExternalSkillIds.includes(sid)) {
    combat.usedExternalSkillIds.push(sid);
  }

  lines.push(...resolveStrike(combat.player, combat.foe, move, rng));
  combat.log.push(...lines);

  if (combat.foe.hp <= 0) {
    const end = finishCombat(state, true);
    snapshotRng(state);
    return [...lines, ...end];
  }

  // 敵方回合
  combat.phase = 'enemy';
  tickRegen(combat.foe);
  const enemyMove = enemyChooseMove(combat.foe, rng);
  const enemyLines = resolveStrike(combat.foe, combat.player, enemyMove, rng);
  combat.log.push(...enemyLines);
  lines.push(...enemyLines);

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
