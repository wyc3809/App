import {
  BASIC_STRIKE,
  GUARD_STANCE,
  CHARGE_STANCE,
  FLEE_MOVE,
  getSkillDef,
  listExternalMovesForSkills,
  sumInternalPassives,
  sumEvasionBonus,
  type CombatMoveDef,
} from '@data/skills/catalog';
import { rankPowerMult } from './martialRanks';
import { grantGear, ensureGear, gearTotals } from './equipment';
import { getGearDef } from '@data/equipment/catalog';
import { learnMartialArt, tryAdvanceSkill } from './flavor';
import { applyNatureDelta } from './nature';
import { recordDispositionAftermath } from './aftermath';
import type { NatureAttr } from '@interfaces/lifeEngine';
import { syncRngFromState, snapshotRng } from './gameState';
import { pushChronicle } from './chronicle';
import { buildLifeSummary } from './summary';
import { tryGainSectStanding } from './sectStanding';
import { getRng } from '@core/random';
import type { LifeGameState, CombatFighterState, PendingCombat as PendingCombatState } from '@interfaces/lifeEngine';

export type CombatFoeDisposition = 'kill' | 'release' | 'stun';

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
    chargeBonus: 0,
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
    chargeBonus: 0,
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
    foePower: opts.foePower ?? 'normal',
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
  if (moveId === GUARD_STANCE.id) return GUARD_STANCE;
  if (moveId === CHARGE_STANCE.id) return CHARGE_STANCE;
  if (moveId === FLEE_MOVE.id) return FLEE_MOVE;
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

/** 持對應兵器時：威力×1.15、命中+0.06 */
function weaponMatchBoost(state: LifeGameState, skillId: string | null): { power: number; hit: number; label?: string } {
  if (!skillId) return { power: 1, hit: 0 };
  const def = getSkillDef(skillId);
  if (!def?.weaponKind) return { power: 1, hit: 0 };
  const equipped = state.character.equipment?.weapon
    ? getGearDef(state.character.equipment.weapon)
    : undefined;
  if (equipped?.weaponKind === def.weaponKind) {
    return { power: 1.15, hit: 0.06, label: `兵刃相契（${equipped.name}）` };
  }
  return { power: 1, hit: 0 };
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
    const qing =
      defender.isPlayer && (defender.evasion ?? 0) >= 0.05
        ? '，借輕功錯開半寸'
        : '';
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
  extraHit = 0,
): string[] {
  const lines: string[] = [];
  if (move.id === GUARD_STANCE.id || move.id === CHARGE_STANCE.id || move.id === FLEE_MOVE.id) {
    return lines;
  }
  if (attacker.qi < move.qiCost) {
    lines.push(`${attacker.name}內息不足，無法使出「${move.name}」，改為普通攻擊。`);
    return resolveStrike(attacker, defender, BASIC_STRIKE, rng, 1, extraHit);
  }
  attacker.qi -= move.qiCost;
  defender.blind = Math.max(0, defender.blind * 0.35);

  let charge = 1;
  if (attacker.chargeBonus > 0) {
    charge = 1 + attacker.chargeBonus;
    attacker.chargeBonus = 0;
    lines.push(`${attacker.name}蓄勢已久，這一擊沉猛異常！`);
  }

  const hits = Math.max(1, move.multiHit ?? 1);
  const boostedMove =
    extraHit > 0 ? { ...move, hitBonus: (move.hitBonus ?? 0) + extraHit } : move;
  let anyHit = false;
  for (let i = 0; i < hits; i++) {
    const before = defender.hp;
    const hitLines = resolveOneHit(
      attacker,
      defender,
      boostedMove,
      rng,
      i,
      hits,
      powerMult * charge,
    );
    lines.push(...hitLines);
    if (defender.hp < before) anyHit = true;
    if (defender.hp <= 0) break;
  }
  lines.push(...applyOnHitEffects(attacker, defender, move, rng, anyHit, powerMult * charge));
  return lines;
}

function enemyChooseMove(
  foe: CombatFighter,
  rng: ReturnType<typeof getRng>,
  bossEnraged = false,
): CombatMoveDef {
  const pool: CombatMoveDef[] = [
    BASIC_STRIKE,
    {
      id: 'enemy_heavy',
      name: '猛攻',
      qiCost: 12,
      power: bossEnraged ? 1.7 : 1.4,
      description: '',
    },
    {
      id: 'enemy_feint',
      name: '虛晃',
      qiCost: 8,
      power: 0.9,
      hitBonus: bossEnraged ? 0.22 : 0.15,
      description: '',
    },
  ];
  if (bossEnraged) {
    pool.push({
      id: 'enemy_burst',
      name: '絕境反撲',
      qiCost: 18,
      power: 1.95,
      pierce: 0.2,
      description: '',
    });
  }
  const affordable = pool.filter((m) => foe.qi >= m.qiCost);
  return rng.pick(affordable.length ? affordable : [BASIC_STRIKE]);
}

function tickRegen(f: CombatFighter): void {
  f.qi = clamp(f.qi + f.qiRegen, 0, f.maxQi);
}

function needsFoeDisposition(combat: PendingCombat): boolean {
  return combat.source !== 'spar';
}

function enterVictoryResolve(state: LifeGameState): string[] {
  const combat = state.pendingCombat;
  if (!combat) return [];
  combat.phase = 'resolve';
  const line = `你戰勝了${combat.foe.name}，對方已無還手之力。`;
  combat.log.push(line);
  return [line];
}

const DISPOSITION_NATURE: Record<
  CombatFoeDisposition,
  Partial<Record<NatureAttr, number>>
> = {
  kill: { e: 4, xia: -2 },
  release: { xia: 4, e: -2, kuang: -1 },
  stun: { xia: 2, e: -1, kuang: -1 },
};

const DISPOSITION_REP: Record<CombatFoeDisposition, number> = {
  kill: -3,
  release: 4,
  stun: 1,
};

const DISPOSITION_NARRATE: Record<CombatFoeDisposition, string> = {
  kill: '你補上最後一擊。血線落地的一瞬，你知這筆債已結，心性卻也添了幾分戾氣。',
  release: '你收刃轉身，任對方踉蹣離去。江湖恩怨，未必都要以命相抵——這份寬恕，亦會留在身上。',
  stun: '你點其穴道，待其甦醒時人已走遠。留一線生機，也留一線牽掛。',
};

/** 戰勝後處置落敗者（殺／放／暈），再結算戰利與獎勵 */
export function resolveCombatDisposition(
  state: LifeGameState,
  disposition: CombatFoeDisposition,
): string[] {
  const combat = state.pendingCombat;
  if (!combat || combat.phase !== 'resolve') return ['此刻無須定奪。'];

  syncRngFromState(state);
  const c = state.character;
  const lines: string[] = [DISPOSITION_NARRATE[disposition]];

  // 俠心過重仍選殺：額外損俠
  if (disposition === 'kill' && (c.nature?.xia ?? 0) >= 35) {
    applyNatureDelta(c, { xia: -2 });
    lines.push('你心裡清楚：這一刀，也斬在自己的俠名上。');
  }
  // 惡念過重仍放人：額外抑惡
  if (disposition === 'release' && (c.nature?.e ?? 0) >= 30) {
    applyNatureDelta(c, { e: -2 });
    lines.push('你按捺殺意，強留三分餘地。');
  }

  const natureLines = applyNatureDelta(c, DISPOSITION_NATURE[disposition]);
  if (natureLines.length) {
    lines.push(`心性有變：${natureLines.join('、')}`);
  }
  const rep = DISPOSITION_REP[disposition];
  if (rep !== 0) {
    c.reputation += rep;
    lines.push(`名望${rep > 0 ? '＋' : ''}${rep}`);
  }

  lines.push(...recordDispositionAftermath(state, disposition, combat.foe.name));
  lines.push(...finishCombatWin(state, disposition));
  snapshotRng(state);
  return lines;
}

function finishCombatWin(state: LifeGameState, dispositionLabel?: CombatFoeDisposition): string[] {
  const combat = state.pendingCombat;
  if (!combat) return [];
  const c = state.character;
  const lines: string[] = [];
  const rng = getRng();

  const hpRatio = combat.player.hp / Math.max(1, combat.player.maxHp);
  c.health = clamp(Math.round(c.maxHealth * Math.min(1, hpRatio)), 0, c.maxHealth);
  c.qi = clamp(combat.player.qi, 0, c.maxQi);
  c.fatigue = clamp(c.fatigue + 8, 0, 100);
  c.stats.combats += 1;
  c.stats.combatsWon += 1;

  if (!dispositionLabel) {
    lines.push(`你戰勝了${combat.foe.name}！`);
  }

  const r = { ...(combat.rewardOnWin ?? {}) };
  // 擊暈：戰利略薄；殺死：略加銀錢；放走：銀錢略減但可能有後續報恩
  if (dispositionLabel === 'stun') {
    if (r.money) r.money = Math.max(1, Math.floor(r.money * 0.55));
    if (r.gearId && rng.chance(0.45)) {
      lines.push('對方昏倒時行囊散落不全，兵器未能穩穩入手。');
      delete r.gearId;
    }
    if (r.skillId && rng.chance(0.35)) {
      lines.push('倉促點穴離去，未及細看對方攜帶的殘譜。');
      delete r.skillId;
      delete r.skillName;
    }
  } else if (dispositionLabel === 'kill') {
    if (r.money) r.money = Math.floor(r.money * 1.15) + 3;
  } else if (dispositionLabel === 'release') {
    if (r.money) r.money = Math.max(0, Math.floor(r.money * 0.7));
  }

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

  const chronicleExtra =
    dispositionLabel === 'kill'
      ? '——殺之'
      : dispositionLabel === 'release'
        ? '——放走'
        : dispositionLabel === 'stun'
          ? '——擊暈'
          : '';

  combat.phase = 'ended';
  combat.log.push(...lines);
  const title = combat.title;
  state.pendingCombat = null;
  pushChronicle(state, [`「${title}」${chronicleExtra}`, ...lines]);
  return lines;
}

function finishCombat(state: LifeGameState, won: boolean): string[] {
  const combat = state.pendingCombat;
  if (!combat) return [];

  if (won) {
    return finishCombatWin(state);
  }

  const c = state.character;
  const lines: string[] = [];

  const hpRatio = combat.player.hp / Math.max(1, combat.player.maxHp);
  c.health = clamp(Math.round(c.maxHealth * Math.min(1, hpRatio)), 0, c.maxHealth);
  c.qi = clamp(combat.player.qi, 0, c.maxQi);
  c.fatigue = clamp(c.fatigue + 14, 0, 100);
  c.stats.combats += 1;

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

    if (move.id === FLEE_MOVE.id) {
      const chance = clamp(0.32 + combat.player.evasion + state.character.attributes.danShi / 400, 0.15, 0.82);
      if (rng.chance(chance)) {
        const hpRatio = combat.player.hp / Math.max(1, combat.player.maxHp);
        state.character.health = clamp(
          Math.round(state.character.maxHealth * Math.min(1, hpRatio)),
          1,
          state.character.maxHealth,
        );
        state.character.qi = clamp(combat.player.qi, 0, state.character.maxQi);
        state.character.reputation = Math.max(0, state.character.reputation - 2);
        state.character.fatigue = clamp(state.character.fatigue + 6, 0, 100);
        const fleeLines = [`你足尖一點，借身法抽身離場（逃離成功）。`, '名望－2'];
        lines.push(...fleeLines);
        combat.log.push(...fleeLines);
        combat.phase = 'ended';
        state.pendingCombat = null;
        pushChronicle(state, [`「${combat.title}」——抽身`, ...fleeLines]);
        snapshotRng(state);
        return lines;
      }
      lines.push('你欲抽身，卻被對方截住去路！');
      combat.log.push(lines[lines.length - 1]);
      // fall through to enemy turn without attacking
    } else if (move.id === GUARD_STANCE.id) {
      combat.player.defenseMod += 6;
      combat.player.qi = clamp(combat.player.qi + 8, 0, combat.player.maxQi);
      lines.push('你收招守中，架勢更穩，內息也緩了過來。');
      combat.log.push(...lines);
    } else if (move.id === CHARGE_STANCE.id) {
      if (combat.player.qi < move.qiCost) {
        lines.push('內息不足，無法蓄勢，只好改為普通攻擊。');
        lines.push(...resolveStrike(combat.player, combat.foe, BASIC_STRIKE, rng, 1));
      } else {
        combat.player.qi -= move.qiCost;
        combat.player.chargeBonus = Math.max(combat.player.chargeBonus, 0.55);
        lines.push('你凝勁於腕，蓄勢待發。');
      }
      combat.log.push(...lines);
    } else {
      const sid = skillIdForMove(state, move.id);
      if (sid && !combat.usedExternalSkillIds.includes(sid)) {
        combat.usedExternalSkillIds.push(sid);
      }
      const rank = sid ? (state.character.skillRanks?.[sid] ?? 0) : 0;
      const wpn = weaponMatchBoost(state, sid);
      if (wpn.label) lines.push(wpn.label);
      const powerMult = (sid ? rankPowerMult(rank) : 1) * wpn.power;
      lines.push(...resolveStrike(combat.player, combat.foe, move, rng, powerMult, wpn.hit));
      combat.log.push(...lines);
    }
  }

  if (combat.foe.hp <= 0) {
    if (needsFoeDisposition(combat)) {
      const resolveLines = enterVictoryResolve(state);
      snapshotRng(state);
      return [...lines, ...resolveLines];
    }
    const end = finishCombat(state, true);
    snapshotRng(state);
    return [...lines, ...end];
  }

  combat.phase = 'enemy';
  const foeStatus = tickStatus(combat.foe);
  lines.push(...foeStatus);
  combat.log.push(...foeStatus);
  if (combat.foe.hp <= 0) {
    if (needsFoeDisposition(combat)) {
      const resolveLines = enterVictoryResolve(state);
      snapshotRng(state);
      return [...lines, ...resolveLines];
    }
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
    const bossEnraged =
      combat.foePower === 'boss' && combat.foe.maxHp > 0 && combat.foe.hp / combat.foe.maxHp <= 0.45;
    if (bossEnraged && !combat.log.some((l) => l.includes('氣息陡變'))) {
      const roar = `${combat.foe.name}氣息陡變，招式更加狠辣！`;
      lines.push(roar);
      combat.log.push(roar);
    }
    const enemyMove = enemyChooseMove(combat.foe, rng, bossEnraged);
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

/** 由 startMonth 呼叫：處理放走／血債引發的延遲交手 */
export function tryStartAftermathCombat(state: LifeGameState): string[] {
  if (state.pending || state.pendingCombat || !state.character.alive) return [];
  const c = state.character;
  const revenge = c.flags['pending_revenge_foe'];
  if (typeof revenge === 'string' && revenge) {
    delete c.flags['pending_revenge_foe'];
    return startCombat(state, {
      source: 'event',
      title: '舊怨重燃',
      foeName: revenge,
      foePower: 'normal',
      rewardOnWin: { money: 15, martial: 2, reputation: 2 },
      rewardOnLose: { money: -8, reputation: -2 },
      eventId: 'aftermath_revenge',
    });
  }
  const blood = c.flags['pending_blood_foe'];
  if (typeof blood === 'string' && blood) {
    delete c.flags['pending_blood_foe'];
    return startCombat(state, {
      source: 'event',
      title: '血債討還',
      foeName: `${blood}舊部`,
      foePower: 'strong',
      rewardOnWin: { money: 20, martial: 3 },
      rewardOnLose: { money: -12, reputation: -4 },
      eventId: 'aftermath_blood',
    });
  }
  return [];
}
